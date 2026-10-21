/**
 * Prototype Apps Script privé : API lecture seule.
 * À déployer uniquement sur une COPIE TEST du tableur.
 * Ne pas activer un accès public à des données personnelles.
 * Script Properties: GOOGLE_CLIENT_ID, SOURCE_SHEET_ID, ALLOWED_EMAILS
 */
function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const user = authenticate_(req.idToken);
    if (req.action !== 'posts.list') throw new Error('Action non autorisée');
    return json_({ok:true, data:posts_(), user:{email:user.email}});
  } catch (err) {
    return json_({ok:false, error:'Accès refusé ou requête invalide'});
  }
}
function authenticate_(idToken) {
  if (typeof idToken !== 'string' || !idToken) throw new Error('Token manquant');
  const clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  const allowed = (PropertiesService.getScriptProperties().getProperty('ALLOWED_EMAILS') || '')
    .split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if (!clientId || !allowed.length) throw new Error('Configuration incomplète');
  const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  const response = UrlFetchApp.fetch(url,{muteHttpExceptions:true});
  if (response.getResponseCode() !== 200) throw new Error('Token invalide');
  const claims = JSON.parse(response.getContentText());
  if (claims.aud !== clientId || !['accounts.google.com','https://accounts.google.com'].includes(claims.iss)
      || Number(claims.exp) <= Date.now()/1000 || claims.email_verified !== 'true')
    throw new Error('Identité invalide');
  if (!allowed.includes(String(claims.email).toLowerCase())) throw new Error('Utilisateur non autorisé');
  return {email:claims.email,sub:claims.sub};
}
function posts_() {
  const id = PropertiesService.getScriptProperties().getProperty('SOURCE_SHEET_ID');
  if (!id) throw new Error('Source non configurée');
  const sheet = SpreadsheetApp.openById(id).getSheetByName('05 - Responsables');
  if (!sheet) throw new Error('Onglet absent');
  const values = sheet.getDataRange().getDisplayValues().slice(1);
  return values.filter(row=>row[0]).map(row=>({
    id: stableKey_(row[0]), name:row[0], leaderName:row[1]||'', leaderStatus:row[2]||''
  }));
}
function stableKey_(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
