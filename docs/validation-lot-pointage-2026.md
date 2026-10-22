# Lot groupé — Préparation de la copie TEST et du journal des présences

## Livrables
- `apps-script/PointageEngine.gs` : calcul et validation des changements de présence, sans écriture.
- `apps-script/PointageEngine.test.cjs` : tests locaux du moteur.
- `apps-script/StagingPreparation.gs` : audit + préparation des ID permanents sur **une copie seulement**, sous verrou.
- `apps-script/PointageDraft.gs` : audit du snapshot, lecture seule.
- `.github/workflows/pointage-tests.yml` : contrôle automatique à déclencher par modification du moteur.

## Point de contrôle — avant exécution dans Google
L'application existante et le classeur source sont inchangés. La prochaine intervention humaine doit être faite depuis le compte Google du club :
1. Dupliquer le classeur d'affectation **réellement à jour** dans Drive : nouvelle copie nommée `TEST TECHNIQUE — Affectations Chambérienne 2026 — Pointages`.
2. Vérifier que la copie est distincte du classeur source et qu'elle reprend les 20 postes et **au moins** les 210 affectations du dernier état confirmé. Le total peut avoir changé entre-temps.
3. Dans la copie, ouvrir Extensions → Apps Script (projet attaché à la copie). Copier `StagingPreparation.gs` dans un nouveau fichier. Si les onglets réservés ont évolué, lister explicitement leurs noms dans `RESERVED_TABS` ou ajouter les exclusions correspondantes dans le script.
4. Dans Paramètres du projet → Propriétés du script, configurer :
   - `SOURCE_SHEET_ID` : ID du classeur de référence (ne pas utiliser celui de la copie).
   - `STAGING_SHEET_ID` : ID de la copie.
   - `ENABLE_STAGING_WRITES` : absent ou `false` d'abord.
5. Exécuter `auditStaging()`. Vérifier le nombre de postes, d'affectations et les éventuels ID dupliqués **avant** toute écriture.
6. Après validation de l'audit, activer `ENABLE_STAGING_WRITES=true` puis exécuter **une seule fois** `prepareStagingIdsAndJournal()`.
7. Repasser immédiatement `ENABLE_STAGING_WRITES=false`. Refaire `auditStaging()` : aucun ID manquant / dupliqué. Vérifier l'onglet `Pointages 2026` vide, à cinq colonnes.
8. Ne pas migrer le classeur source ni publier ce script dans l'application Apps Script déjà déployée.

## Limitations importantes
- Les colonnes d'ID sont ajoutées dans la copie ; les modifications de lignes doivent inclure cette colonne.
- Les opérations de tri/filtre de l'ensemble d'une ligne conservent les IDs, mais un copier-coller partiel peut rompre l'association.
- Un journal vide n'est pas une preuve que le pointage partagé est opérationnel.
- Le moteur de pointage existe, mais l'authentification serveur, les contrôles de secteur, les écritures réelles et la cohérence entre les versions de déploiement restent à intégrer.
- Les identités affichées ne sont pas des identifiants fiables : deux `Vincent M.` distincts doivent rester séparés.
- Cyclo Bissy 1 à 10 doivent rester rattachés aux dix affectations existantes, sans duplication.
- Le dernier résultat du connecteur (20 postes / 210 affectations) est une **référence de comparaison**, pas une exigence immuable pour un classeur qui a continué à évoluer.

## Prochain lot, après validation sur copie
Raccorder la lecture du snapshot aux UUID des lignes, puis écrire le journal append-only derrière une authentification réelle. Réaliser deux connexions simultanées sur smartphones, tester l'annulation, les erreurs de version et les modifications de postes. Ne pas réutiliser `PUBLIC_TEST=true` pour l'écriture.
