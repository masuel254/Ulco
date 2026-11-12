// Nœud "Enregistrer abonnement" : reçoit l'abonnement push de l'iPhone (paramètre s, base64url),
// le mémorise et prépare une notification de test.
const store = $getWorkflowStaticData('global');
store.subs = store.subs || [];
const q = $input.first().json.query || {};
// Décodage base64url sans atob ni Buffer (disponibilité variable selon l'installation n8n).
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function decode(s) {
  let out = '', buf = 0, bits = 0;
  for (const ch of String(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')) {
    const v = B64.indexOf(ch);
    if (v < 0) throw new Error('base64');
    buf = ((buf << 6) | v) & 0xffffff; bits += 6;
    if (bits >= 8) { bits -= 8; out += String.fromCharCode((buf >> bits) & 255); }
  }
  return out;
}
let sub = null;
try {
  sub = JSON.parse(decode(q.s || ''));
} catch (e) {
  sub = null;
}
const ok = sub && typeof sub.endpoint === 'string' && /^https:\/\/[a-z0-9.-]+\//i.test(sub.endpoint);
if (!ok) return [{ json: { ok: false } }];
store.subs = store.subs.filter((s) => s.endpoint !== sub.endpoint);
store.subs.push({ endpoint: sub.endpoint, at: new Date().toISOString() });
store.subs = store.subs.slice(-5);
return [{ json: { ok: true, endpoint: sub.endpoint } }];
