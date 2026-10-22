# Audit technique et préparation pointage TEST — 22/10/2026

## Constat vérifié
- `index.html` contient les données DEMO (`DATA.people`), les trois vues et l'état `state`.
- `localStorage` est appelé par `persist()`, à l'initialisation, pour les contacts et les documents locaux.
- Écritures de pointage DEMO : `setMissionStatus(id,index,s)`, `setStatus(id,s)`, `leaderCheckIn(sector)`.
- Les identifiants DEMO (`P1`, index de mission) ne sont **pas** des identifiants d'affectation serveur stables.
- Navigation : `admin` (Bureau central), `leader` (Responsable), `volunteer` (Bénévole).
- Démo : absence d'authentification/autorisation serveur ; les rôles UI ne sont pas des permissions.

## Modifications sûres livrées
- `pointage/adapter.js` : API isolée, sans dépendance et sans configuration implicite.
- `createDemoAdapter({read,write})` : délégation explicite au comportement existant, non branchée.
- `createTestAdapter({load,write,refresh})` : transport injecté uniquement après vérification.
- Aucun appel réseau, aucun accès Sheets, aucun nom de méthode Apps Script supposé.
- Écriture TEST impossible avant un chargement serveur validé ; verrou contre double clic.
- Après ACK comme après erreur/timeout, la relecture serveur est obligatoire avant toute autre écriture : aucun succès optimiste.
- `getSnapshot()` expose le dernier instantané confirmé ; son remplacement exige une réponse avec version valide.
- **La DEMO n'est volontairement pas recâblée** : `index.html` reste inchangé ; le mode TEST n'est pas opérationnel.

## À confirmer avant branchement UI et moteur
1. Fichiers du projet Apps Script, version déployée et accès autorisé au code (sans secrets).
2. Noms **réels** des fonctions publiques, signature/arguments et exemples de réponses anonymisées pour lecture/écriture/rafraîchissement.
3. Mode d'hébergement : HtmlService (pont `google.script.run`) ou autre transport réel et contraintes CORS.
4. Authentification session, attribution des rôles, périmètres de secteurs et contrôles **côté serveur**.
5. Identifiants persistants des affectations ; mapping éventuel entre missions DEMO et lignes du planning TEST (interdit d'utiliser les numéros de ligne comme IDs).
6. Sémantique des versions (globale/par secteur), refus concurrent, idempotence, verrou `LockService` et codes d'erreur.
7. Confirmation que lecture/relecture sont disponibles et leur format ; politique de timeout et de reprise sans duplication.
8. Nature des écritures existantes : journal uniquement ou aussi feuille des affectations ; ne rien modifier pendant recette.
9. Validation des personnes autorisées à accéder aux données TEST et du processus de déploiement isolé.
10. Mesures réelles sur 10 pointages (min, médiane, max), deux appareils et Safari iPhone.

## Tests
Lancer `node --test tests/pointage-adapter.test.cjs` (Node 18+).
Tests unitaires : délégation DEMO, absence de transport, version et ACK, anti-double clic, timeout, réponse invalide.
**Non couverts tant que moteur non fourni :** autorisation serveur, conflits multi-appareils, réseau réel, 4–7 s et recette Safari.
