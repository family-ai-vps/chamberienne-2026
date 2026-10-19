# Préparation des tests réels et de la synchronisation — décisions à prendre

**Date : 19/10/2026.** Aucun système de synchronisation ni données réelles n'est déployé. Les choix ci-dessous sont à valider avant d'intégrer des personnes réelles.

## P0 — questions bloquantes
1. **Validation de la source Forms 2026** : source candidate trouvée : « Bénévolat Chambéry Triathlon 2026 (Responses) », onglet `Form Responses 1` (216 réponses nominatives horodatées au 19/10/2026). Confirmer qu'elle fait autorité pour La Chambérienne, ses règles d'actualisation et les champs importables. Elle contient notamment des **numéros de permis de conduire**, dates de naissance, emails et téléphones : exclure les numéros de permis de tout jeu d'essai applicatif. Le fichier « Retours bénévoles La Chambérienne 2026 » concerne la Nordic ; ne pas l'importer comme inscriptions.
2. **Responsable de validation** : qui valide les bénévoles, les affectations, les horaires, les dérogations, et à quelle date fige-t-on la liste ?
3. **Identité** : identifiant bénévole stable, gestion des homonymes, mineurs, changements de nom, absence de téléphone/email, doublons Forms ; ne pas dériver l'ID du numéro de ligne Forms.
4. **Authentification et autorisations** : compte individuel ou code à usage limité ; liste des administrateurs, responsables par secteur, révocation et remplacement. Le simple sélecteur de rôle du MVP ne suffit pas.
5. **Modèle d'affectation** : poste/sous-poste/secteur, effectif requis, disponibilité, âge, qualification secourisme, chevauchement, temps de déplacement, horaires, dérogations et responsable habilité à déplacer un bénévole.
6. **Architecture** : choix du backend avec authentification, règles de sécurité, journal serveur, base transactionnelle, sauvegardes et supervision ; Sheets éventuellement source/import/export, **pas interface de travail le jour J**.
7. **Confidentialité** : minimisation des données, visibilité par rôle, conservation/suppression, droits des personnes et consentement notifications ; dépôt GitHub public sans données personnelles.
8. **Fonctionnement sans réseau** : quelles actions restent possibles hors ligne, pendant combien de temps, et comment résoudre les conflits de mise à jour ?

## P1 — règles opérationnelles
9. **Accueil et prise de poste** : qui pointe l'arrivée, qui confirme la présence sur poste, statut en cas de double confirmation, horodatage et annulation.
10. **Absence/remplacement** : responsable peut-il déclarer une absence ? bureau central seul valide-t-il le remplacement ? prévenir les deux bénévoles, conserver l'historique et recontrôler les contraintes.
11. **Renfort** : priorité, destinataires, prise en charge, attribution, accusé de réception, clôture et escalade.
12. **Incidents** : gravité, visibilité, notifications, escalade secours, personnes habilitées à clôturer, accusé de réception et procédure d'urgence ; ne pas confondre une PWA et le numéro d'urgence.
13. **Matériel** : inventaire initial, numérotation, prêt, retour, casse, perte, remise par bénévole, mouvements signés, anti-double sortie et stock minimum.
14. **Informations course** : qui publie, quels publics (tous/secteur/personne), priorité, accusé de lecture, corrections et suppression.
15. **Notifications push** : destinataires par rôle et secteur, opt-in, heures silencieuses, messages critiques, appareils multiples et alternative si notifications refusées.
16. **Support jour J** : qui supervise les erreurs, téléphone de secours, procédure de bascule, audit de fin de journée, export et archivage.

## P2 — plan de simulation fonctionnelle
- **Étape 1** : dupliquer le maître d'affectation et le fichier d'exploitation dans un espace de TEST restreint, sans toucher aux originaux.
- **Étape 2** : connecter une **copie privée autorisée** des réponses Forms 2026 après validation de la source ; minimiser les champs (jamais le permis), pseudonymiser les jeux utilisés pour tests publics. Ne pas injecter de PII dans GitHub Pages.
- **Étape 3** : contrôles d'import : doublons, IDs, âge, disponibilités, postes, horaires, conflits, données manquantes et anomalies bloquantes.
- **Étape 4** : API et base TEST ; connexion de 2 à 3 iPhones, comptes de rôles différents, droits testés côté serveur.
- **Étape 5** : scénarios de bout en bout : accueil, prise de poste, absence/remplacement, demande renfort, incident, clôture, matériel (entrée/sortie), annonce, notification.
- **Étape 6** : tests réseau : déconnexion, reprise, édition concurrente, notifications refusées, PWA ancienne, restauration et révocation.
- **Étape 7** : recette utilisateur documentée et décision explicite de passage en production.

## Structure cible des fichiers (sans réécrire les sources)
**Maître d'affectation** : conserver les onglets existants ; ajouter si nécessaire une table technique de synchronisation, un ID permanent bénévole, un ID permanent mission, version, dates de modification, origine et auteur. Les affectations validées doivent rester traçables.

**Exploitation** : conserver Accueil, Présences, Absences, Renforts, Inventaire, Mouvements, Incidents, Infos, Consignes, Accès et Historique ; chaque action reçoit un identifiant unique, un acteur, un appareil, une date serveur, une version, un état de synchronisation et un résultat. Une entrée/sortie de matériel doit être atomique.

**Règle de conception** : l'application smartphone est l'interface métier principale ; les fichiers Sheets servent à la préparation, aux imports contrôlés et aux exports de contrôle, sans manipulation obligatoire sur ordinateur le jour de la course.

## Critères minimum pour déclarer la simulation fonctionnelle
- Deux appareils voient le même incident, renfort et pointage en quelques secondes sous réseau normal.
- Un bénévole ne peut pas accéder aux actions du Bureau central, même en modifiant le code du navigateur.
- Une sortie de matériel concurrente ne peut pas créer un stock négatif ni deux détenteurs d'un objet numéroté.
- Les affectations modifiées sont répercutées aux personnes concernées avec historique.
- Un mode dégradé est défini et testé ; aucune action silencieusement perdue.
- Les données réelles restent privées et les exports sont limités aux personnes autorisées.

**À ne pas faire avant clarification P0** : import de réponses réelles dans le dépôt public, activation de rôles non sécurisés, ou présentation du MVP comme outil opérationnel synchronisé.
