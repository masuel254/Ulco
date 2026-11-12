# Notes ULCO

Application web installable (PWA) qui récupère le relevé de notes publié par l'IUT (site ScoDoc
`http://194.57.179.42/abs/`) et le structure par UE, module et évaluation.

## Fonctionnement

Le site de l'IUT est en HTTP et n'autorise pas les appels depuis un autre site. Une page HTTPS
(GitHub Pages) ne peut donc pas l'interroger directement. Un petit workflow n8n sert de relais :

```
Appli (GitHub Pages) -> webhook n8n (HTTPS) -> POST pt.php sur le site ULCO -> HTML renvoyé à l'appli
```

L'analyse du HTML se fait dans l'appli (`parse.js`). Le numéro INE reste dans n8n, il n'est ni dans
ce dépôt ni dans l'appli. Aucune note n'est stockée ici : le dernier relevé est gardé uniquement sur
l'appareil, pour la consultation hors ligne.

## Mise en route

1. Importer `n8n/ulco-notes.json` dans n8n.
2. Nœud **Webhook** : remplacer le chemin `ulco-notes-CHANGEZ-MOI` par un chemin difficile à deviner.
3. Nœud **Releve ULCO** : remplacer `VOTRE_NUMERO_INE`.
4. Activer le workflow et copier l'URL de production du webhook.
5. Activer GitHub Pages (Settings > Pages > branche `main`, dossier racine).
6. Ouvrir l'appli, puis Réglages, et coller l'URL du webhook. Variante en un clic :
   `https://masuel254.github.io/Ulco/#hook=URL_DU_WEBHOOK`.

L'URL du webhook donne accès aux notes à qui la connaît : ne pas la publier.

## Fichiers

- `index.html` : interface (vue par UE, dernières notes, badge "nouveau" pendant 48 h).
- `parse.js` : analyse du relevé HTML, sans dépendance.
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et mode hors ligne.
- `n8n/ulco-notes.json` : workflow relais (3 nœuds).
