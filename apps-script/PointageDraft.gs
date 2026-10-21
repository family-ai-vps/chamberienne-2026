/**
 * La Chambérienne 2026 — préparation du pointage réel.
 * MODULE INACTIF : ne contient aucune fonction d'écriture.
 * À conserver dans GitHub pour revue ; ne pas copier dans le déploiement Apps Script.
 *
 * Objectif : vérifier les affectations et préparer un registre d'identifiants
 * immuables AVANT d'autoriser un pointage partagé.
 */
const POINTAGE_DRAFT = Object.freeze({
  journalTab: 'Pointages 2026',
  idHeader: 'ID affectation',
  auditHeaders: ['Horodatage UTC','ID affectation','Action','Identifiant opérateur','Version'],
  actions: ['PRESENT','ANNULER']
});

/**
 * Contrôle purement en mémoire des données de snapshot_().
 * Aucune écriture, aucun appel réseau, aucune identité complète.
 * Les homonymes restent des affectations distinctes.
 */
function auditAssignmentsForPointage_(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.posts) || !Array.isArray(snapshot.assignments)) {
    throw new Error('Snapshot non conforme');
  }
  const postIds = new Set(snapshot.posts.map(p => String(p.id)));
  const ids = new Set();
  const duplicates = [];
  const missing = [];
  const unknownPosts = [];
  const bySubpost = {};
  snapshot.assignments.forEach((a,index) => {
    const id = String(a.id || '').trim();
    if (!id) missing.push(index + 1);
    else if (ids.has(id)) duplicates.push(index + 1);
    else ids.add(id);
    if (!postIds.has(String(a.postId))) unknownPosts.push(index + 1);
    const group = String(a.postId || '') + ' / ' + String(a.subpost || 'Sans sous-poste');
    bySubpost[group] = (bySubpost[group] || 0) + 1;
  });
  return {
    posts: snapshot.posts.length,
    assignments: snapshot.assignments.length,
    uniqueAssignmentIds: ids.size,
    missingIdPositions: missing,
    duplicateIdPositions: duplicates,
    unknownPostPositions: unknownPosts,
    countsBySubpost: bySubpost,
    // Les IDs actuellement construits à partir du numéro de ligne ne sont PAS immuables.
    stableIdsReady: false,
    writingEnabled: false
  };
}

/**
 * Test manuel de lecture seule dans Apps Script, après validation du code.
 * Ne révèle ni noms, ni e-mails, ni téléphones.
 */
function auditPointagePreparation() {
  const result = auditAssignmentsForPointage_(snapshot_());
  console.log(JSON.stringify(result));
  return result;
}

/**
 * Préconditions obligatoires pour l'étape suivante :
 * 1. Créer une colonne ID permanente dans CHAQUE onglet de poste, après
 *    vérification de la structure et sauvegarde du classeur.
 * 2. Générer un UUID uniquement pour les lignes d'affectation qui n'en ont pas.
 * 3. Ne jamais réattribuer cet UUID lors d'un tri ou déplacement de ligne.
 * 4. Valider un contrôle d'accès serveur indépendant de PUBLIC_TEST.
 * 5. Ajouter l'onglet journal à RESERVED_TABS.
 * 6. Ajouter des écritures append-only sous LockService, avec journal
 *    horodaté et identification fiable de l'opérateur.
 */
