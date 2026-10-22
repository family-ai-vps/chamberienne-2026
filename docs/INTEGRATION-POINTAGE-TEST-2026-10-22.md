# PWA Chambérienne 2026 — Intégration du pointage TEST
État du 22/10/2026. Document de travail : aucune mise en production autorisée.

## Référence exacte
- Référence graphique et fonctionnelle : `main` au commit `7f8a6fa84ca19764ad48a8b52c179987647aefe1` (démo datée 20/10).
- Ancienne V22.5 : historique seulement.
- Branche d'intégration : `dev/pwa-pointage-test-2026-10-22`. Ne pas changer `main` ni la démo GitHub Pages.
- La démo GitHub Pages embarque des données fictives et du `localStorage` ; ses 3 espaces ne constituent PAS des contrôles d'accès réels.
- Ne jamais committer de noms, e-mails, téléphones ou affectations réels, ni clé ou secret.

## Google Sheets TEST vérifiés
- Affectations : `1BdqBxZEfNFArV4CQ4a4aWUjYVHTPLCjML1_5fNNxdX0` (onglets par poste ; reste en lecture seule pendant la recette utilisateur).
- Journal technique : `1JH3Gdc4wmH_PTf4rxIJTT_rn8d5Ska0qmzgwX4jiXdk`, onglet `Pointages 2026`.
- Colonnes observées du journal : `Horodatage UTC | ID affectation | Action | Identifiant opérateur | Version`.
- 11 opérations vérifiées (versions 1–11) ; 7 affectations touchées ; état final : 3 présentes, 4 annulées.
- Temps opérationnel remonté par l'utilisateur après optimisation : 4 à 7 s par pointage ; non mesuré automatiquement.

## Architecture de raccordement
1. Isoler un **adaptateur de données** derrière les vues existantes, sans modifier visuellement les parcours Bureau/Responsable/Bénévole de la démo.
2. Mode `demo` : données fictives actuelles et comportement local conservés. Pas de simulation présentée comme une donnée vraie.
3. Mode `test` : données d'affectations et appels pointage fournis **exclusivement côté serveur** après authentification ; le navigateur ne détient pas d'identifiant de compte de service.
4. Si l'interface est servie par Apps Script HtmlService : `google.script.run` pour les fonctions serveur. Ne présumer ni CORS ni accès direct aux Sheets depuis GitHub Pages.
5. Conserver les identifiants d'affectation stables. Les lignes du classeur ne sont pas des IDs.
6. Enregistrer côté serveur sous verrou (LockService) ; valider rôle/secteur, ID affectation, action, version attendue. Renvoi d'un état autoritatif et de la nouvelle version.
7. Ne jamais marquer `présent` dans l'interface avant l'accusé de réception serveur ; désactiver brièvement le bouton pendant l'appel ; messages distincts pour attente, succès, refus, délai et panne.
8. Après une erreur réseau ou un délai, **relire l'état** avant toute nouvelle écriture : éviter de doubler un pointage exécuté par le serveur mais dont l'accusé de réception s'est perdu.
9. La synchronisation multi-appareils doit relire régulièrement l'état serveur ou utiliser un rafraîchissement explicite ; `localStorage` ne doit jamais être source de vérité en mode TEST.

## Contrat fonctionnel à vérifier contre le code Apps Script existant (non présumé disponible)
- `chargerSecteur({session, secteur}) -> {version, missions, pointages}`
- `pointer({session, affectationId, action: 'PRESENT'|'ANNULER', versionAttendue}) -> {version, affectationId, etat}`
- `rafraichir({session, secteur, depuisVersion?}) -> {version, pointages}`
Ces noms sont PROPOSÉS, pas des fonctions Apps Script confirmées. Adapter à l'API réelle, sans écraser le moteur testé.

## Critères de recette, dans cet ordre
1. Démo `main` inchangée ; trois espaces et navigation conservés ; Buvette indépendante, Gestion départs séparée, bouton FFSS rouge.
2. Un pointage puis une annulation : un événement de chaque dans le journal et état final correct.
3. Double clic rapide : une seule opération effective.
4. Deux appareils / responsables : visibilité et version cohérentes après actualisation.
5. Version ancienne : refus sans écriture ni perte de l'état courant.
6. Non autorisé / affectation hors secteur : refus côté serveur.
7. Réseau coupé pendant pointage : état affiché « indéterminé » puis réconciliation avec serveur, pas de fausse validation.
8. Mesurer 10 opérations, noter médiane, minimum et maximum ; comparer aux 4–7 secondes observées.
9. Vérifier installation PWA et cache iPhone Safari avec version d'interface identifiable.
10. Ne déployer qu'après accord explicite et recette sur environnement TEST. 

## État de livraison
- Référence et branche : établies.
- Contrat et plan de recette : préparés.
- Code d'adaptation, authentification, synchronisation et tests de bout en bout : **non implémentés**.
- Aucun changement sur les Google Sheets ni la PWA publique.
