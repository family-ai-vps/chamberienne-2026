/**
 * Chambérienne 2026 — PRÉPARATION SUR COPIE UNIQUEMENT.
 * À NE PAS AJOUTER au projet Apps Script en production.
 * Installer sur une copie du classeur, puis définir :
 *  STAGING_SHEET_ID = ID de cette copie
 *  SOURCE_SHEET_ID = ID du classeur de travail courant
 *  ENABLE_STAGING_WRITES = true uniquement après audit et confirmation
 *
 * Les IDs sont attachés aux cellules de leur ligne, pas au numéro de ligne.
 * Un tri de lignes complètes conserve l'association ; des collages partiels
 * des colonnes sans ID doivent être surveillés.
 */
const STAGING_ID_HEADER_='ID affectation';
const STAGING_JOURNAL_='Pointages 2026';
const STAGING_JOURNAL_HEADERS_=['Horodatage UTC','ID affectation','Action','Identifiant opérateur','Version'];
function stagingConfig_(){
  const p=PropertiesService.getScriptProperties();
  const source=p.getProperty('SOURCE_SHEET_ID');
  const staging=p.getProperty('STAGING_SHEET_ID');
  if(!source||!staging||source===staging)throw new Error('Copie TEST distincte obligatoire');
  return {source,staging,enabled:p.getProperty('ENABLE_STAGING_WRITES')==='true'};
}
function stagingAssignmentTabs_(ss){
  const reserved=new Set(typeof RESERVED_TABS!=='undefined'?[...RESERVED_TABS]:[]);
  reserved.add(STAGING_JOURNAL_);
  return ss.getSheets().filter(sh=>{
    if(reserved.has(sh.getName()))return false;
    const v=sh.getRange(1,1,Math.min(4,sh.getLastRow()),Math.max(2,sh.getLastColumn())).getDisplayValues();
    return v.length>=4 && String(v[3][1]).trim()==='NOM Prénom';
  });
}
function auditStaging(){
  const cfg=stagingConfig_(),ss=SpreadsheetApp.openById(cfg.staging),tabs=stagingAssignmentTabs_(ss);
  const details=[];let total=0,missing=0;const ids=new Set(),duplicates=[];
  for(const sh of tabs){
    const last=sh.getLastRow(),cols=sh.getLastColumn();
    const headings=sh.getRange(4,1,1,cols).getDisplayValues()[0];
    const idCol=headings.indexOf(STAGING_ID_HEADER_)+1;
    const vals=last>4?sh.getRange(5,1,last-4,Math.max(cols,2)).getDisplayValues():[];
    let count=0,need=0;
    for(const row of vals){
      if(!String(row[1]||'').trim())continue;
      count++;const id=idCol?String(row[idCol-1]||'').trim():'';
      if(!id){need++;continue}
      if(ids.has(id))duplicates.push({onglet:sh.getName(),id});else ids.add(id);
    }
    details.push({onglet:sh.getName(),affectations:count,idsManquants:need,idColonne:idCol||null});
    total+=count;missing+=need;
  }
  return {classeurCopie:cfg.staging,modeEcritureActive:cfg.enabled,postes:tabs.length,affectations:total,idsManquants:missing,doublons:duplicates,details};
}
function prepareStagingIdsAndJournal(){
  const cfg=stagingConfig_();
  if(!cfg.enabled)throw new Error('Ecritures TEST non autorisées');
  const ss=SpreadsheetApp.openById(cfg.staging),lock=LockService.getScriptLock();
  if(!lock.tryLock(30000))throw new Error('Copie occupée');
  try{
    const audit=auditStaging();
    if(audit.doublons.length)throw new Error('Doublons ID détectés : intervention requise');
    const tabs=stagingAssignmentTabs_(ss);
    for(const sh of tabs){
      let col=audit.details.find(d=>d.onglet===sh.getName()).idColonne;
      if(!col){
        col=sh.getLastColumn()+1;
        sh.getRange(4,col).setValue(STAGING_ID_HEADER_);
      }
      const last=sh.getLastRow();
      if(last<=4)continue;
      const names=sh.getRange(5,2,last-4,1).getDisplayValues();
      const range=sh.getRange(5,col,last-4,1),values=range.getValues();
      let modified=false;
      for(let i=0;i<names.length;i++){
        if(String(names[i][0]||'').trim()&&!String(values[i][0]||'').trim()){
          values[i][0]=Utilities.getUuid();modified=true;
        }
      }
      if(modified)range.setValues(values);
    }
    let journal=ss.getSheetByName(STAGING_JOURNAL_);
    if(!journal){
      journal=ss.insertSheet(STAGING_JOURNAL_);
      journal.getRange(1,1,1,STAGING_JOURNAL_HEADERS_.length).setValues([STAGING_JOURNAL_HEADERS_]);
      journal.setFrozenRows(1);
    }else {
      const h=journal.getRange(1,1,1,STAGING_JOURNAL_HEADERS_.length).getDisplayValues()[0];
      if(JSON.stringify(h)!==JSON.stringify(STAGING_JOURNAL_HEADERS_))throw new Error('Journal existant incompatible');
    }
    return auditStaging();
  }finally{lock.releaseLock()}
}
