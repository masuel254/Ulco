// Nœud "Nouvelles notes ?" : lit le relevé, compare aux notes déjà vues,
// et sort un élément par iPhone abonné si au moins une note est apparue.
const html = String($input.first().json.data || '');
const store = $getWorkflowStaticData('global');
store.subs = store.subs || [];

const clean = (s) => String(s).replace(/<[^>]*>/g, '').replace(/&[a-zA-Z#0-9]+;?/g, ' ').replace(/\s+/g, ' ').trim();
const num = (s) => { const m = String(s).replace(',', '.').match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; };
const cells = (row) => { const out = []; const re = /<td[^>]*>([\s\S]*?)<\/td>/g; let m; while ((m = re.exec(row))) out.push(clean(m[1])); return out; };

// Même identifiant que l'appli : module, nom, valeur, rang parmi les identiques. Pas d'UE ni de date :
// un module présent dans plusieurs UE compte une fois, une date corrigée n'est pas une nouvelle note.
const keys = [];
const doneMods = new Set();
const rank = {};
let mod = '', skip = false;
const re = /<tr class="notes_bulletin_row_(ue|mod|eval)"[^>]*>([\s\S]*?)<\/tr>/g;
let m;
while ((m = re.exec(html))) {
  const c = cells(m[2]);
  if (m[1] === 'ue') continue;
  if (m[1] === 'mod') { mod = c[1] || ''; skip = doneMods.has(mod); doneMods.add(mod); continue; }
  if (skip) continue;
  const note = num(c[5] || '');
  if (note === null) continue;
  const sig = ['0', mod, c[3] || '', note].join('|');
  rank[sig] = (rank[sig] || 0) + 1;
  keys.push(sig + '#' + rank[sig]);
}

// Page vide ou en erreur : on ne touche à rien.
if (!/notes_bulletin_row_ue/.test(html)) return [];

const first = !Array.isArray(store.seen2);
const seen = new Set(store.seen2 || []);
const fresh = keys.filter((k) => !seen.has(k));
store.seen2 = [...new Set([...seen, ...keys])].slice(-500);
delete store.seen;
store.lastCheck = new Date().toISOString();

if (first || fresh.length === 0) return [];
store.lastNew = { at: store.lastCheck, count: fresh.length, keys: fresh };
return store.subs.map((s) => ({ json: { endpoint: s.endpoint, nouvelles: fresh.length } }));
