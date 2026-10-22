/**
 * Moteur de pointage — fonctions pures, sans accès Google ni écriture.
 * Fichier préparatoire : NE PAS déployer avant identification fiable des affectations
 * et authentification côté serveur.
 */
const POINTAGE_ENGINE = {
  ACTIONS: Object.freeze(['PRESENT','ANNULER']),
  JOURNAL_HEADERS: Object.freeze(['Horodatage UTC','ID affectation','Action','Identifiant opérateur','Version'])
};
function validateAssignmentIds_(assignments) {
  if (!Array.isArray(assignments)) throw new Error('Affectations manquantes');
  const seen=new Set(),missing=[],duplicate=[];
  assignments.forEach((a,i)=>{
    const id=String(a.id||'').trim();
    if(!id) missing.push(i+1);
    else if(seen.has(id)) duplicate.push({position:i+1,id});
    else seen.add(id);
  });
  return {total:assignments.length,unique:seen.size,missing,duplicate,ok:!missing.length&&!duplicate.length};
}
function readPresenceJournal_(assignments,entries) {
  const ids=validateAssignmentIds_(assignments);
  if(!ids.ok) throw new Error('Identifiants d’affectation non uniques ou manquants');
  if(!Array.isArray(entries)) throw new Error('Journal invalide');
  const allowed=new Set(assignments.map(a=>String(a.id)));
  const state=new Map(assignments.map(a=>[String(a.id),{status:'NON_POINTE',version:0}]));
  const errors=[];
  entries.forEach((e,i)=>{
    const id=String(e.assignmentId||''),action=String(e.action||'');
    const prev=state.get(id);
    const version=Number(e.version);
    if(!allowed.has(id)||!POINTAGE_ENGINE.ACTIONS.includes(action)||!Number.isSafeInteger(version)||version!==(prev?.version||0)+1){
      errors.push({position:i+1,reason:'journal incohérent'});return;
    }
    state.set(id,{status:action==='PRESENT'?'PRESENT':'NON_POINTE',version,
      updatedAt:String(e.at||''),operator:String(e.operator||'')});
  });
  return {state,errors,ready:errors.length===0};
}
function proposePresenceChange_(assignmentId,action,operator,expectedVersion,state,nowISO){
  const id=String(assignmentId||''),user=String(operator||'').trim();
  if(!id||!user||!POINTAGE_ENGINE.ACTIONS.includes(action)) throw new Error('Action invalide');
  if(!state.has(id)) throw new Error('Affectation inexistante');
  const prev=state.get(id);
  if(prev.version!==expectedVersion) throw new Error('Conflit : actualiser le pointage');
  if(!/^\d{4}-\d{2}-\d{2}T.*Z$/.test(String(nowISO||'')))throw new Error('Horodatage UTC requis');
  const status=action==='PRESENT'?'PRESENT':'NON_POINTE';
  if(prev.status===status)throw new Error('Action déjà appliquée');
  return {assignmentId:id,action,operator:user,at:nowISO,version:prev.version+1};
}
// Comptage par affectation, jamais par prénom abrégé.
function countPresenceBySubpost_(assignments,state){
  const groups={};
  for(const a of assignments){
    const key=String(a.postId||'')+' / '+String(a.subpost||'Sans sous-poste');
    if(!groups[key])groups[key]={planned:0,present:0,notChecked:0};
    groups[key].planned++;
    if(state.get(String(a.id))?.status==='PRESENT')groups[key].present++;
    else groups[key].notChecked++;
  }
  return groups;
}
