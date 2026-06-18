// Bouwt public/js/drutex-konf.js (window.DRUTEX_KONF) uit de gescrapete catalogus,
// met NL-vertaling van stap- en optienamen. Losgekoppeld van het scrapen zodat we
// de vertaling kunnen herdraaien zonder opnieuw op te halen.
//   node scripts/gen-konf-data.js

const fs = require('fs');
const path = require('path');
const NL = require('../public/js/drutex-nl.js');

const SRC = path.join(__dirname, '..', 'public', 'media', 'konf', '_catalog.json');
const DEST = path.join(__dirname, '..', 'public', 'js', 'drutex-konf.js');

// HTML uit Drutex-omschrijvingen strippen + vertalen, bewaar opsommingen als ' · '
function cleanDesc(html) {
  if (!html) return '';
  let s = String(html)
    .replace(/<li>\s*/gi, ' · ').replace(/<\/li>/gi, '')
    .replace(/<\/?ul>/gi, '').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^·\s*/, '');
  // dubbele staart (Drutex herhaalt de tekst zonder opmaak) inkorten
  return NL(s).slice(0, 240).trim();
}

// Stap(groep)namen waarvoor de generieke NL-vertaler botst met optiewaarden
// (bv. "Szyby" als staptitel = Beglazing, maar "szyby" in waarden = ruiten).
const STEP_NAMES = { KolorSzyba: 'Beglazing' };

const cat = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const out = { productGroups: {} };

for (const gk in cat.productGroups) {
  const g = cat.productGroups[gk];
  const fgs = {};
  for (const fk in g.featureGroups) {
    const fg = g.featureGroups[fk];
    fgs[fk] = {
      identity: fg.identity,
      name: STEP_NAMES[fg.identity] || NL(fg.name),
      elements: fg.elements.map(e => ({
        identity: e.identity,
        name: NL(e.name),
        desc: cleanDesc(e.description),
        image: e.image,
        extra: e.extra || []
      }))
    };
  }
  out.productGroups[gk] = {
    label: g.label,
    productGroupUrl: g.productGroupUrl,
    stepsOrder: g.stepsOrder,
    featureGroups: fgs,
    dimensionLimits: g.dimensionLimits || {}
  };
}

const js = '/* Auto-gegenereerd door scripts/gen-konf-data.js — Drutex-configuratorcatalogus (NL).\n' +
  '   Bron: officiele dealer-configurator. Optienamen + afbeeldingen 1:1; prijzen weggelaten. */\n' +
  'window.DRUTEX_KONF = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(DEST, js);

// rapport
let groups = 0, steps = 0, elems = 0;
for (const gk in out.productGroups) { groups++; const g = out.productGroups[gk]; steps += Object.keys(g.featureGroups).length; for (const fk in g.featureGroups) elems += g.featureGroups[fk].elements.length; }
console.log('Geschreven:', path.relative(process.cwd(), DEST));
console.log('Productgroepen:', groups, '| feature-groups:', steps, '| opties totaal:', elems, '| grootte:', (js.length / 1024 | 0) + ' KB');
