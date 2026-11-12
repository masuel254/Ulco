// Analyse du relevé de notes ULCO (page pt.php, basée sur ScoDoc).
// Fonctions pures, sans dépendance : une chaîne HTML en entrée, des objets en sortie.

const ENTITIES = {
  nbsp: ' ', amp: '&', quot: '"', lt: '<', gt: '>', apos: "'", acute: "'", rsquo: "'", lsquo: "'",
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à', acirc: 'â', auml: 'ä',
  icirc: 'î', iuml: 'ï', ocirc: 'ô', ouml: 'ö', ugrave: 'ù', ucirc: 'û', uuml: 'ü',
  ccedil: 'ç', oelig: 'œ', aelig: 'æ', Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Agrave: 'À',
  Acirc: 'Â', Ccedil: 'Ç', Ocirc: 'Ô', Icirc: 'Î', OElig: 'Œ', laquo: '«', raquo: '»', deg: '°',
};

export function clean(s) {
  return String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);?/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-zA-Z]+);?/g, (m, name) => (name in ENTITIES ? ENTITIES[name] : m))
    .replace(/\s+/g, ' ')
    .trim();
}

function num(s) {
  const m = String(s).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function cells(rowHtml) {
  const out = [];
  const re = /<td[^>]*>([\s\S]*?)<\/td>/g;
  let m;
  while ((m = re.exec(rowHtml))) out.push(clean(m[1]));
  return out;
}

// Liste des semestres proposés dans le menu déroulant.
export function listSemesters(html) {
  const sel = html.match(/<select name="sem">([\s\S]*?)<\/select>/);
  if (!sel) return [];
  const out = [];
  const re = /<option value="([^"]*)"([^>]*)>([\s\S]*?)<\/option>/g;
  let m;
  while ((m = re.exec(sel[1]))) {
    out.push({ id: m[1], label: clean(m[3]), selected: /selected/.test(m[2]) });
  }
  return out;
}

// Un relevé : étudiant, intitulé du semestre, UE > modules > évaluations.
export function parseBulletin(html) {
  const h2 = [];
  const start = html.indexOf('class="notes_bulletin"');
  if (start >= 0) {
    const re = /<h2>([\s\S]*?)<\/h2>/g;
    re.lastIndex = start;
    let m;
    while ((m = re.exec(html)) && h2.length < 2) h2.push(clean(m[1]));
  }
  const ues = [];
  let ue = null;
  let mod = null;
  const re = /<tr class="notes_bulletin_row_(ue|mod|eval)"[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html))) {
    const c = cells(m[2]);
    if (m[1] === 'ue') {
      ue = { titre: c[0] || '', moyenne: num(c[5] || ''), modules: [] };
      ues.push(ue);
      mod = null;
    } else if (m[1] === 'mod') {
      if (!ue) { ue = { titre: 'Sans UE', moyenne: null, modules: [] }; ues.push(ue); }
      mod = { code: c[1] || '', nom: c[2] || '', moyenne: num(c[5] || ''), coef: num(c[6] || ''), evaluations: [] };
      ue.modules.push(mod);
    } else if (mod) {
      mod.evaluations.push({
        nom: c[3] || '',
        date: (c[4] || '').slice(0, 10) || null,
        note: num(c[5] || ''),
        coef: num(c[6] || ''),
      });
    }
  }
  return { etudiant: h2[0] || '', intitule: h2[1] || '', ues };
}
