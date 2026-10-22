/**
 * La Chambérienne 2026 — API prototype lecture seule.
 * Source: classeur TEST de refonte, onglets Responsables 2026 + postes.
 * Le mode PUBLIC_TEST ne renvoie que prénom + initiale du nom.
 * IMPORTANT : une initiale ne garantit pas l'anonymat ; tester avec des personnes
 * autorisées et ne jamais transmettre e-mail, téléphone ou notes privées.
 *
 * Script Properties:
 * SOURCE_SHEET_ID = 1BdqBxZEfNFArV4CQ4a4aWUjYVHTPLCjML1_5fNNxdX0
 * PUBLIC_TEST = false (défaut) ; mettre true uniquement pour un test autorisé.
 * GOOGLE_CLIENT_ID et ALLOWED_EMAILS pour les accès authentifiés.
 */
const REF_TAB = 'Responsables 2026';
const RESERVED_TABS = new Set([
 'Responsables 2026',"00 - Mode d'emploi",'Bénévoles','Postes et critères',
 'Affectations','Matériel par sous-poste','Réserve','Réglages',
 'Tableau de bord','Données Forms','Historique affectations',
 'Référentiel postes 2026','_Disponibilités','_Contacts',
 '_Sources contrôle','_Bénévoles contrôle','_Contrôles horaires','_Listes par mission',
 'Pointages 2026','_Charge missions','_Bilan charge','Suivi souhaits 2026'
]);

function doGet(e) {
  const action=(e && e.parameter && e.parameter.action) || '';
  if (action === 'health') return json_({ok:true,service:'chamberienne-test',version:1});
  return HtmlService.createHtmlOutputFromFile('Test').setTitle('Chambérienne 2026 — Connecteur TEST');
}
function testSnapshot() {
  const props=PropertiesService.getScriptProperties();
  if (props.getProperty('PUBLIC_TEST') !== 'true') throw new Error('Mode TEST non activé');
  return snapshot_();
}
function doPost(e) {
  let req = {};
  try { req = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ok:false,error:'Requête JSON invalide'}); }
  return handle_(req);
}
function handle_(req) {
  try {
    if (req.action === 'health') return json_({ok:true,service:'chamberienne-test',version:1});
    const publicTest = PropertiesService.getScriptProperties().getProperty('PUBLIC_TEST') === 'true';
    if (!publicTest) authenticate_(req.idToken);
    if (req.action !== 'snapshot') throw new Error('Action inconnue');
    return json_({ok:true,mode:publicTest?'public-test':'authenticated',data:snapshot_()});
  } catch (err) {
    console.error('API request rejected: ' + String(err.message).slice(0,120));
    return json_({ok:false,error:'Accès refusé ou source indisponible'});
  }
}
function snapshot_() {
  const id=PropertiesService.getScriptProperties().getProperty('SOURCE_SHEET_ID');
  if (!id) throw new Error('SOURCE_SHEET_ID manquant');
  const ss=SpreadsheetApp.openById(id);
  const ref=ss.getSheetByName(REF_TAB);
  if (!ref) throw new Error('Onglet responsables absent');
  const rows=ref.getDataRange().getDisplayValues();
  const posts=rows.slice(4).filter(r=>r[0] && r[1]).map(r=>({
    id:key_(r[0]),name:r[0],responsible:shortName_(r[1])
  }));
  const assignments=[];
  ss.getSheets().filter(s=>!RESERVED_TABS.has(s.getName())).forEach(sheet=>{
    const v=sheet.getDataRange().getDisplayValues();
    // Format actuel : 3 lignes d'en-tête ; colonnes B=Nom, E=Horaires, F=Sous-poste.
    if (v.length<5 || v[3][1]!=='NOM Prénom') return;
    v.slice(4).forEach((r,i)=>{
      const full=String(r[1]||'').trim();
      if (!full || full.toLocaleUpperCase('fr')==='NOM PRÉNOM') return;
      const subpost=String(r[5]||'').trim();
      const bissy=/^(?:Bénévole|Cyclo) Bissy (10|[1-9])$/i.exec(full);
      const isBissy=sheet.getName()==='Secteur D - Parcours' &&
        /^D(?:8|9|10|11)$/.test(subpost) && bissy;
      assignments.push({
        id:key_(sheet.getName())+'-'+(i+5),
        postId:key_(sheet.getName()),
        volunteer:isBissy ? 'Cyclo Bissy '+bissy[1] : shortName_(full),
        schedule:String(r[4]||''),
        subpost
      });
    });
  });
  // Les postes supplémentaires Secours, Stand Club et PC bénévoles
  // sont découverts automatiquement parmi les onglets de postes.
  return {generatedAt:new Date().toISOString(),posts,assignments};
}
function shortName_(raw) {
  const words=String(raw||'').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length===1) return words[0].slice(0,1).toUpperCase()+'.';
  // Les onglets d'affectation utilisent « NOM Prénom » ; le référentiel
  // responsables utilise « Prénom NOM » : identifier via la casse.
  const firstUpper=words[0]===words[0].toUpperCase() && words[0].length>1;
  const lastUpper=words[words.length-1]===words[words.length-1].toUpperCase();
  if (firstUpper) return words.slice(1).join(' ')+' '+words[0].slice(0,1).toUpperCase()+'.';
  if (lastUpper) return words.slice(0,-1).join(' ')+' '+words[words.length-1].slice(0,1).toUpperCase()+'.';
  // Ambiguïté : masquer plutôt que risquer de divulguer le nom complet.
  return words[0]+' '+words[words.length-1].slice(0,1).toUpperCase()+'.';
}
function key_(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function authenticate_(idToken) {
  if (!idToken) throw new Error('Jeton absent');
  const props=PropertiesService.getScriptProperties();
  const clientId=props.getProperty('GOOGLE_CLIENT_ID');
  const allowed=(props.getProperty('ALLOWED_EMAILS')||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if (!clientId || !allowed.length) throw new Error('Configuration manquante');
  const res=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(idToken),{muteHttpExceptions:true});
  if (res.getResponseCode()!==200) throw new Error('Jeton invalide');
  const c=JSON.parse(res.getContentText());
  if (c.aud!==clientId || !['accounts.google.com','https://accounts.google.com'].includes(c.iss)
      || Number(c.exp)<=Date.now()/1000 || !(c.email_verified===true || c.email_verified==='true')
      || !allowed.includes(String(c.email||'').toLowerCase())) throw new Error('Non autorisé');
  return {sub:c.sub};
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
