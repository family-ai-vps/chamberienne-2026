# Pointage réel — préparation technique (non déployée)

## État
L'interface actuelle simule les présences en mémoire. **Aucune écriture de présence réelle n'est active.**
Ne pas copier les fonctions d'écriture en production avant validation de l'authentification.

## Modèle de données
Conserver les affectations dans le Google Sheets 2026 sans les modifier.
Créer un onglet dédié `Pointages 2026` avec les colonnes :
- `Horodatage UTC` (ISO 8601)
- `ID affectation` (identifiant stable de la ligne d'affectation)
- `Action` (`PRESENT` ou `ANNULER`)
- `Identifiant opérateur` (identité du compte Google autorisé)
- `Version` (réservée à la gestion de conflits)

Chaque clic crée une nouvelle ligne d'historique (journal append-only), sans effacer les anciennes.
L'état courant est la dernière action validée par ID affectation.
Les noms complets, téléphones et e-mails des bénévoles ne sont pas enregistrés dans ce journal.

## Sécurité obligatoire avant activation
1. `PUBLIC_TEST=true` autorise aujourd'hui la lecture de données abrégées. **Ne jamais l'utiliser pour autoriser l'écriture.**
2. Vérifier un jeton d'identité Google côté serveur, avec `GOOGLE_CLIENT_ID`, `ALLOWED_EMAILS`, audience, émetteur, expiration et adresse vérifiée.
3. Ne pas se fier au prénom/initiale pour identifier une affectation ; utiliser son ID.
4. Vérifier côté serveur que l'ID existe dans la liste actuelle des affectations, que l'action est autorisée et que l'opérateur a le droit de pointer ce secteur.
5. Utiliser `LockService.getScriptLock()` pendant les écritures concurrentes et relire l'état avant d'écrire.
6. Limiter les informations retournées aux comptes autorisés. Les données d'audit opérateur restent privées.
7. En cas de modification de lignes du Google Sheets, les ID fondés sur le numéro de ligne peuvent changer. **Créer des ID stables avant le premier pointage réel.**
8. Prévoir une sauvegarde du journal et un mode lecture seule de secours.

## Interface
- Afficher par sous-poste : `prévus`, `présents confirmés`, `non pointés`.
- `Non pointé` ne signifie pas `absent`.
- Bouton `Marquer présent` et `Annuler le pointage` avec confirmation de l'annulation.
- Afficher date/heure et auteur du dernier pointage aux seuls comptes habilités.
- Actualisation manuelle dans un premier temps ; éviter les collisions entre utilisateurs.
- Cyclo Bissy 1 à 10 : conserver les dix affectations fixes D8 à D11, pointage individuel par ID.

## Plan de validation
1. Faire valider la simulation actuelle.
2. Configurer les comptes autorisés et tester l'authentification Google.
3. Ajouter les ID d'affectation stables et le journal sur une copie du classeur TEST.
4. Tester deux responsables simultanés, annulation, actualisation et modification d'une affectation.
5. Activer ensuite seulement le pointage partagé dans le classeur TEST.

## Points de vigilance repérés
- L'interface de simulation efface les pointages au rechargement, par conception.
- Les compteurs d'identités abrégées ne prouvent pas l'unicité des personnes.
- Vérifier les expressions régulières de détection Cyclo Bissy dans le code source avant une prochaine publication : la copie GitHub et le déploiement Apps Script doivent être synchronisés.
