// Nœud "Nettoyer abonnements" : retire les iPhone désabonnés (réponse 404 ou 410).
const store = $getWorkflowStaticData('global');
store.subs = store.subs || [];
const sent = $('Signer VAPID').all();
const out = $input.all().map((it, i) => {
  const code = it.json.statusCode;
  const endpoint = sent[i] ? sent[i].json.endpoint : null;
  if (endpoint && (code === 404 || code === 410)) store.subs = store.subs.filter((s) => s.endpoint !== endpoint);
  return { json: { endpoint, statusCode: code } };
});
store.lastPush = out;
return out;
