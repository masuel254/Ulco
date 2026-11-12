# Assemble le workflow n8n "Alertes Notes ULCO" à partir des sources de n8n/src.
# Usage : python3 n8n/build.py SORTIE.json [INE] [CHEMIN] [VAPID_PRIVEE] [VAPID_PUBLIQUE]
import json, sys, os
here = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(here, 'src', f), encoding='utf-8').read()
out, ine, path, priv, pub = (sys.argv[1:] + ['VOTRE_NUMERO_INE', 'CHANGEZ-MOI', 'VAPID_PRIVEE_A_RENSEIGNER', 'VAPID_PUBLIQUE_A_RENSEIGNER'][len(sys.argv) - 2:])[:5]

signer = src('vapid.js') + f"""
// ---- Paramètres ----
const VAPID_PRIVEE = '{priv}';
const VAPID_PUBLIQUE = '{pub}';
const SUJET = 'https://masuel254.github.io/Ulco/';

const now = Math.floor(Date.now() / 1000);
return $input.all()
  .filter((it) => typeof it.json.endpoint === 'string' && it.json.endpoint.startsWith('https://'))
  .map((it) => ({{ json: {{ endpoint: it.json.endpoint, authorization: vapidAuth(it.json.endpoint, VAPID_PRIVEE, VAPID_PUBLIQUE, SUJET, now) }} }}));
"""

def code(id_, name, js, pos):
    return {"parameters": {"jsCode": js}, "id": id_, "name": name, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": pos}

nodes = [
  {"parameters": {"httpMethod": "GET", "path": f"ulco-push-{path}", "responseMode": "responseNode", "options": {"allowedOrigins": "*"}},
   "id": "b2000000-0000-4000-8000-000000000001", "name": "Abonnement", "type": "n8n-nodes-base.webhook", "typeVersion": 2,
   "position": [0, 0], "webhookId": "b2000000-0000-4000-8000-0000000000aa"},
  code("b2000000-0000-4000-8000-000000000002", "Enregistrer abonnement", src('abonnement.js'), [220, 0]),
  {"parameters": {"respondWith": "text", "responseBody": "={{ $json.ok ? 'ok' : 'abonnement invalide' }}",
     "options": {"responseHeaders": {"entries": [{"name": "Access-Control-Allow-Origin", "value": "*"}, {"name": "Cache-Control", "value": "no-store"}]}}},
   "id": "b2000000-0000-4000-8000-000000000003", "name": "Reponse abonnement", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [440, 0]},
  {"parameters": {"rule": {"interval": [{"field": "cronExpression", "expression": "0 8,12,17,21 * * *"}]}},
   "id": "b2000000-0000-4000-8000-000000000004", "name": "Verification planifiee", "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.2, "position": [0, 260]},
  {"parameters": {"method": "POST", "url": "http://194.57.179.42/abs/pt.php", "sendBody": True, "contentType": "form-urlencoded",
     "bodyParameters": {"parameters": [{"name": "code_ine", "value": ine}, {"name": "sem", "value": "0"}]},
     "options": {"response": {"response": {"responseFormat": "text"}}, "timeout": 20000}},
   "id": "b2000000-0000-4000-8000-000000000005", "name": "Releve ULCO", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [220, 260]},
  code("b2000000-0000-4000-8000-000000000006", "Nouvelles notes ?", src('detection.js'), [440, 260]),
  code("b2000000-0000-4000-8000-000000000007", "Signer VAPID", signer, [680, 120]),
  {"parameters": {"method": "POST", "url": "={{ $json.endpoint }}", "sendHeaders": True,
     "headerParameters": {"parameters": [{"name": "Authorization", "value": "={{ $json.authorization }}"}, {"name": "TTL", "value": "86400"}, {"name": "Urgency", "value": "normal"}]},
     "options": {"response": {"response": {"fullResponse": True, "neverError": True, "responseFormat": "text"}}, "timeout": 15000}},
   "id": "b2000000-0000-4000-8000-000000000008", "name": "Envoyer push", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [900, 120]},
  code("b2000000-0000-4000-8000-000000000009", "Nettoyer abonnements", src('nettoyage.js'), [1120, 120]),
]
link = lambda n: {"main": [[{"node": n, "type": "main", "index": 0}]]}
wf = {"name": "Alertes Notes ULCO", "nodes": nodes,
  "connections": {"Abonnement": link("Enregistrer abonnement"), "Enregistrer abonnement": link("Reponse abonnement"),
    "Reponse abonnement": link("Signer VAPID"), "Verification planifiee": link("Releve ULCO"), "Releve ULCO": link("Nouvelles notes ?"),
    "Nouvelles notes ?": link("Signer VAPID"), "Signer VAPID": link("Envoyer push"), "Envoyer push": link("Nettoyer abonnements")},
  "settings": {"executionOrder": "v1", "timezone": "Europe/Paris"}, "pinData": {}}
json.dump(wf, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok', out)
