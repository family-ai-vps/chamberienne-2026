# Connecteur Google Sheets — chantier TEST (21 octobre 2026)

Cette branche prépare la connexion de la PWA aux Google Sheets. **Aucune donnée personnelle n'est publiée ici et la PWA de production reste inchangée.**

## Sources vérifiées
- Affectations par poste V3 : `19iMuuzR3dlmBzeUOkWzw-molwdE1Bg6QMyxUfB6iR6c` (onglets 01–48 et `05 - Responsables`).
- Fichier maître historique : `1m8m03r9v7myckST0pNG88DpCOWp-oVcyjU8XByh3N0k`.
- Exploitation course : `1GatqLXOZyNPTWnMq017h_eo2w2O76tYLPYSspUQpxcg`.

**Attention :** la V3 contient des **propositions** de bénévoles, non des affectations validées. Elle comporte aussi des téléphones et e-mails : ne jamais la copier dans un dépôt public ni dans un endpoint anonyme. La version finale de la conversation « Refonte Google Sheets » doit être confirmée avant tout import opérationnel.

## Contrat de données v1
- `posts` : `{id, name, leaderName, leaderStatus}`.
- `subposts` : `{id, postId, name, startAt, endAt}`.
- `assignments` : `{id, volunteerId, subpostId, status}`.
- `volunteers` : `{id, displayName}`, **uniquement pour les comptes autorisés**.
- `events` : `{id, action, actorId, targetId, occurredAt, payload}`.

Identifiants stables obligatoires ; les numéros de lignes Google Sheets ne sont pas des identifiants. Les droits sont vérifiés **sur le serveur**, pas dans l'interface. Un rôle sélectionné dans un menu n'est pas une authentification.

## Séquence de mise en service
1. Valider la structure finale et les identifiants stables (lecture seule).
2. Créer un projet Apps Script privé et des copies Sheets de test, sans données sensibles.
3. Mettre en place une authentification vérifiée côté serveur et la matrice des droits (bureau central / responsables multi-postes).
4. Tester l'accès PWA GitHub Pages → Apps Script sur iPhone, notamment **CORS, redirections ContentService, sessions et expiration**. Ne pas considérer un simple `doGet` public comme une API sécurisée.
5. Déployer les lectures authentifiées et mesurer les performances.
6. Ajouter les écritures idempotentes avec verrouillage, journal d'événements et gestion des conflits.
7. Tester deux téléphones puis une charge représentative et les coupures réseau.

## Critères de validation
- Aucun nom, e-mail ou numéro de téléphone réel dans le code, la page publique, les logs accessibles ou les fixtures.
- Un utilisateur non authentifié ne peut lire aucune affectation personnelle.
- Un responsable ne peut consulter et modifier que les postes autorisés.
- Les actions en double ne créent pas de double pointage.
- Une écriture est visible depuis un autre appareil après synchronisation.
- Les erreurs de réseau ne sont jamais présentées comme des succès.
