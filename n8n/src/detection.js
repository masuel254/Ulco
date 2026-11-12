// Nœud "Nouvelles notes ?" : lit le relevé, compare aux notes déjà vues,
// et sort un élément par iPhone abonné si au moins une note est apparue.
const html = String($input.first().json.data || '');
const store = $getWorkflowStaticData('global');
store.subs = store.subs || [];

const clean = (s) => String(s).replace(/<[^>]*>/g, '').replace(/&[a-zA-Z#0-9]+;?/g, ' ').replace(/\s+/g, ' ').trim();
const num = (s) => { const m = String(s).replace(',', '.').match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; };
const cells = (row) => { const out = []; const re = /<td[^>]*>([\s\S]*?)<\/td>/g; let m; while ((m = re.exec(row))) out.push(clean(m[1])); return out; };

const keys = [];
let ue = '', mod = '';
const re = /<tr class="notes_bulletin_row_(ue|mod|eval)"[^>]*>([\s\S]*?)<\/tr>/g;
let m;
while ((m = re.exec(html))) {
  const c = cells(m[2]);
  if (m[1] === 'ue') ue = (c[0] || '').slice(0, 6);
  else if (m[1] === 'mod') mod = c[1] || '';
  else {
    const note = num(c[5] || '');
    if (note !== null) keys.push([ue, mod, (c[4] || '').slice(0, 10), c[3] || '', note].join('|'));
  }
}

// Page vide ou en erreur : on ne touche à rien.
if (!/notes_bulletin_row_ue/.test(html)) return [];

const first = !Array.isArray(store.seen);
const seen = new Set(store.seen || []);
const fresh = keys.filter((k) => !seen.has(k));
store.seen = [...new Set([...seen, ...keys])].slice(-500);
store.lastCheck = new Date().toISOString();

if (first || fresh.length === 0) return [];
store.lastNew = { at: store.lastCheck, count: fresh.length, keys: fresh };
return store.subs.map((s) => ({ json: { endpoint: s.endpoint, nouvelles: fresh.length } }));
