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

## Pastille de notification (iPhone)

Le workflow `n8n/alertes-notes.json` vérifie le relevé à 8 h, 12 h, 17 h et 21 h (heure de Paris).
Quand une note apparaît, il envoie une notification push sans contenu à l'appli, qui affiche
"Nouvelle note publiée" et pose une pastille sur l'icône. La pastille s'efface à l'ouverture.

- Le chemin du webhook doit reprendre le même suffixe que le relais : `ulco-notes-XXX` / `ulco-push-XXX`.
- Clés VAPID : la clé publique est dans `index.html`, la clé privée uniquement dans n8n (nœud Signer VAPID).
  La signature est écrite en JavaScript pur (`n8n/src/vapid.js`), sans module à autoriser dans n8n.
- Sur iPhone, l'appli doit être installée sur l'écran d'accueil (iOS 16.4 ou plus), puis Réglages > Pastille > Activer.
- Pour ne garder que la pastille : Réglages iPhone > Notifications > Notes ULCO, décocher bannières et sons.
- `python3 n8n/build.py sortie.json INE SUFFIXE PRIVEE PUBLIQUE` régénère le workflow depuis `n8n/src`.

## Versions

`version.json` porte la dernière version publiée. L'appli la compare à la sienne à l'ouverture et via
Réglages > Rechercher une mise à jour. À chaque publication, monter la version dans `index.html`
(`APP_VERSION` et `parse.js?v=`) et dans `version.json`.

## Fichiers

- `index.html` : interface (vue par UE, dernières notes, badge "nouveau" pendant 48 h).
- `parse.js` : analyse du relevé HTML, sans dépendance.
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et mode hors ligne.
- `n8n/ulco-notes.json` : workflow relais (3 nœuds).
