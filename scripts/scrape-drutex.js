/* ============================================================================
   scrape-drutex.js — universele Drutex-productscraper voor de showcase.
   Per productpagina: animatie (mp4) + kleuren + (deuren) wypełnienia-patronen +
   (ramen) krukken. Slaat lokaal op onder public/media/drutex/ en (her)genereert
   public/js/drutex-models.js.

   Kleurmodi:  'image' (PVC/hout, eigen render per kleur) · 'ral' (aluminium,
   masker + RAL-palet) · 'none' (geen kleurkiezer op de pagina).
   Extra (gedeeld, gededupliceerd onder _shared/):
   - deuren: vulpatronen uit #fills, gegroepeerd per patroon met applicatie inox/czarny.
   - ramen:  krukken uit #handles.

   Gebruik:  node scripts/scrape-drutex.js [--only slugA,slugB]
   Idempotent: bestaande, niet-lege assets worden overgeslagen.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MEDIA = path.join(ROOT, 'public', 'media', 'drutex');
const TARGETS = path.join(__dirname, 'drutex-targets.json');
const MODELS_JSON = path.join(MEDIA, '_models.json');
const MODELS_JS = path.join(ROOT, 'public', 'js', 'drutex-models.js');
const BASE = 'https://www.drutex.pl';
const RAL_API = BASE + '/pl/produkty/api/ral-color/all/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const TYPE_BY_CAT = { 'Okna': 'window', 'Drzwi': 'door', 'Systemy tarasowe': 'sliding' };
// Aantal vleugels in het schema = afgelezen van de Drutex-renders (zodat het schema
// het beeld volgt). Eénvleugelig: deze ramen; alle overige ramen tonen 2 vleugels.
const SINGLE_SASH = new Set(['ideal-7000-nl', 'ideal-neo-ad', 'ideal-neo-md', 'ideal-neo-md-fs', 'ideal-neo-md-monoblock', 'softline']);

const PL = { 'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z' };
const slugify = s => s.toLowerCase()
  .replace(/[ąćęłńóśźż]/g, c => PL[c] || c)
  .normalize('NFKD').replace(/[^\x00-\x7F]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dec = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
// tekst zonder tags (voor prozas/lijsten); normaliseert ook m2K → m²K en m3/h → m³/h
const plain = s => dec(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/m\s*2\s*K/g, 'm²K').replace(/m\s*3\s*\/\s*h/g, 'm³/h');
const abs = u => u ? (u.startsWith('http') ? u : BASE + u) : u;
const decodePath = webpUrl => { const m = (webpUrl || '').match(/\/media\/webp\/[0-9]+\/([A-Za-z0-9+/=]+)\.webp/); if (!m) return webpUrl || ''; try { return Buffer.from(m[1], 'base64').toString('latin1'); } catch (e) { return webpUrl; } };

async function fetchText(url, tries) {
  tries = tries || 3;
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (r.ok) return await r.text(); } catch (e) { }
  }
  return null;
}
async function download(url, dest) {
  try {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 200) return true;
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 100) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    return true;
  } catch (e) { return false; }
}
// gedeelde (gededupliceerde) download: zelfde Drutex-asset wordt door meerdere modellen gebruikt
async function downloadShared(webpUrl, subdir) {
  const base = (decodePath(webpUrl).split('/').pop() || 'img').replace(/\.(jpe?g|png|webp)$/i, '').replace(/[^a-z0-9._-]/gi, '-').slice(0, 80);
  const rel = '/media/drutex/_shared/' + subdir + '/' + base + '.webp';
  return (await download(webpUrl, path.join(MEDIA, '_shared', subdir, base + '.webp'))) ? rel : null;
}
async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; await fn(items[k], k); }
  }));
}

const ralCache = {};
const addonsCache = {}; // "Zobacz wszystkie" volledige optie-lijsten per type-URL (gedeeld over alle modellen)
const mapRal = arr => arr.map(c => ({ slug: 'ral-' + c.code, name: c.t_name || ('RAL ' + c.code), code: 'RAL ' + c.code, hex: c.rgb_hex }));
async function getRalSet(endpoint) {
  if (ralCache[endpoint]) return ralCache[endpoint];
  let out = []; try { out = mapRal(JSON.parse(await fetchText(endpoint))); } catch (e) { out = []; }
  ralCache[endpoint] = out; return out;
}
const getRAL = () => getRalSet(RAL_API);
const isFullRal = ep => /\/all\/?$/.test(ep || '');

function parseName(html, slug) {
  let m = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
  if (m) return dec(m[1]).replace(/\s*[-–|]\s*Drutex.*$/i, '').trim();
  m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (m) return dec(m[1].replace(/<[^>]+>/g, ' '));
  return slug.toUpperCase().replace(/-/g, ' ');
}
// Kies de PRODUCT-ANIMATIE, niet de korte hero/cover-clip.
// cover/header = bestand eindigt op -cover/-header.mp4, of zit in /header(_video)/.
// (let op: 'alu-cover' is een productnaam, geen hero → daarom enkel -cover.mp4-suffix.)
const isCoverVid = u => /[-_]cover\.mp4$/i.test(u) || /[-_]header\.mp4$/i.test(u) || /\/header(_video)?\//i.test(u);
const isAnimVid = u => /\/(video|wideo|anim)/i.test(u);
// Geordende kandidatenlijst (beste eerst) via score. De product-animatie zit in
// /produkty/<model>/(video|wideo|anim|video-okno|video-drzwi)/ en matcht het type;
// de hero/cover staat vaak als EERSTE <source> (soms zonder 'cover' in de naam, bv.
// animacja-mb70.mp4 of een Django-hash-suffix). scrapeOne pakt de eerste die écht
// downloadt (sommige product-animatie-URL's geven 404 → val terug op de volgende).
function parseVideoCandidates(html, type) {
  const typ = type === 'door' ? 'drzwi' : (type === 'window' ? 'okn' : null);
  const re = /<source[^>]+src="([^"]+\.(?:mp4|webm))"/gi; // ook webm: soms is de product-animatie alleen als webm beschikbaar (mp4 404)
  const seen = {}; const cands = []; let m;
  while ((m = re.exec(html))) {
    const url = m[1]; if (seen[url]) continue; seen[url] = 1;
    cands.push({ url, before: html.slice(Math.max(0, m.index - 450), m.index) }); // markup vóór de <source> = container
  }
  const score = c => {
    const u = c.url, f = u.split('/').pop().toLowerCase(), b = c.before;
    let s = 0;
    // STERKSTE signaal = HTML-context: product-showcase-blok (zoals Drutex' eigen
    // col-xl-6-video) vs het header/hero-introblok. (komt overeen met de juiste keuze.)
    if (/header-video|module-top|class="[^"]*\bheader\b/i.test(b)) s -= 60;
    if (/col-xl-6|col-md-4|align-self-center|product-version|gallery2021/i.test(b)) s += 60;
    // url/naam-heuristiek als tiebreak
    if (isCoverVid(u)) s -= 100;
    if (/\/(video|wideo|anim)[\/-]/i.test(u)) s += 10;
    if (/\/produkty\//i.test(u)) s += 5;
    if (typ && new RegExp(typ, 'i').test(u)) s += 4;
    if (/produkt|options|opcje|otwier/.test(f)) s += 8;
    if (/drutex|standard|promo/.test(f)) s -= 8;
    if (/_[a-z0-9]{6,8}\.mp4$/i.test(f)) s -= 2;
    if (/\.mp4$/i.test(u)) s += 1;                            // mp4 lichte voorkeur boven webm (breder ondersteund)
    return s;
  };
  return cands.map((c, i) => ({ u: abs(c.url), i, s: score(c) })).sort((a, b) => b.s - a.s || a.i - b.i).map(x => x.u);
}
function parseColors(html) {
  const tags = html.match(/<[^>]*data-color-name[^>]*>/g) || [];
  const attr = (t, a) => { const m = t.match(new RegExp(a + '="([^"]*)"')); return m ? dec(m[1]) : ''; };
  const seen = {}; const out = [];
  tags.forEach(t => {
    const name = attr(t, 'data-color-name'); if (!name) return;
    if (/^bia[łl]y\s+ulti-?matt$/i.test(name)) return; // "Biały Ulti-Matt" uitsluiten (kapotte swatch op Drutex, op verzoek verwijderd)
    let s = slugify(name) || ('kleur-' + (out.length + 1));
    if (seen[s]) { let k = 2; while (seen[s + '-' + k]) k++; s = s + '-' + k; }
    seen[s] = 1;
    out.push({ slug: s, name, code: attr(t, 'data-color-code'), img: abs(attr(t, 'data-color-img')), bg: abs(attr(t, 'data-color-bg')) });
  });
  return out;
}
const parseMask = html => { const m = html.match(/id="color-presenter-image"[^>]*\ssrc="([^"]+)"/i) || html.match(/class="ral-background"[^>]*\ssrc="([^"]+)"/i); return m ? abs(m[1]) : null; };
// drewniano-aluminiowe (DUOLINE e.d.): binnen = hout-decor (image colors), buiten = alu-masker
// (<img class="ral-background">) getint met RAL. Detectie via "widok od wewnątrz/zewnątrz".
const isDualWoodAlu = html => /widok od wewn/i.test(html) && /widok od zewn/i.test(html);
const parseOuterMask = html => { const m = html.match(/class="ral-background"[^>]*\ssrc="([^"]+)"/i); return m ? abs(m[1]) : null; };
const parseOuterHex = html => { const m = html.match(/class="ral-background"[^>]*background-color:\s*(#[0-9a-f]{3,6})/i); return m ? m[1] : '#7a7d7e'; };
const parseRalEndpoint = html => { const m = html.match(/getJSON\(\s*['"]([^'"]*ral-color[^'"]*)['"]/i); return m ? abs(m[1]) : null; };

const sectionOf = (html, id) => { const i = html.indexOf('id="' + id + '"'); if (i < 0) return ''; const e = html.indexOf('</section>', i); return html.slice(i, e < 0 ? i + 90000 : e); };

// deuren: decoratieve applicaties (#fills) → per patroon gegroepeerd met inox/czarny.
// We nemen alleen de benoemde "nakładki dekoracyjne" (bestanden met -inox-/-czarny-),
// niet de rommelige DX-vulpaneelserie. Naam + groepering uit de bestandsnaam (robuust).
function parseFills(html) {
  const sec = sectionOf(html, 'fills'); if (!sec) return [];
  const urls = (sec.match(/(?:data-src|src)="([^"]+\.webp)"/gi) || []).map(s => s.match(/="([^"]+)"/)[1]);
  // canonieke patroon-sleutel: applicatie (inox/czarny), framekleur-suffix én
  // spiegel-/sectie-tokens (l, r, c, lr, lcr, as…) eruit → alleen regio + nummer.
  // Zo groeperen inox/czarny ook bij inconsistente bestandsnamen (PVC én aluminium).
  const VARIANT = /^(l|r|c|cr|rl|lr|lcr|rcl|as|s|n)$/;
  const canon = file => file
    .replace(/(^|[-_])(inox|czarny)([-_]|$)/g, '-')
    .replace(/_[a-z0-9]+$/, '')
    .split(/[-_]/).filter(Boolean).filter(t => !VARIANT.test(t)).join('-');
  const byKey = {}; const order = [];
  urls.forEach(u0 => {
    const u = abs(u0); const p = decodePath(u);
    if (!/wypelnienia/i.test(p) || /przekroje/i.test(p)) return;
    const file = (p.split('/').pop() || '').toLowerCase().replace(/\.(jpe?g|png)$/, '');
    const app = /czarny/.test(file) ? 'czarny' : (/inox/.test(file) ? 'inox' : null);
    if (!app) return; // alleen decoratieve applicaties inox/czarny
    const key = canon(file);
    if (!byKey[key]) { byKey[key] = { apps: {} }; order.push(key); }
    if (!byKey[key].apps[app]) byKey[key].apps[app] = u;
  });
  const nameOf = key => {
    const toks = key.split(/[-_]/).filter(Boolean);
    const region = (toks.find(t => /^[a-z]{3,}$/.test(t)) || toks[0] || '').toUpperCase();
    const num = toks.find(t => /^[0-9]+$/.test(t));
    return (region + (num ? ' ' + num : '')).trim();
  };
  return order.map((k, idx) => ({ n: idx + 1, name: nameOf(k) || ('WZÓR ' + (idx + 1)), apps: byKey[k].apps }));
}
// design-deuren (bv. D-ART Line): #fills bevat geen inox/czarny-applicaties maar
// grote design-renders (.jpg) per model (Elegance/Prestige/Classic/Modern…) onder
// /dodatki/drzwi-wejsciowe/<lijn>/ of /<lijn>_line/. Elk = één groot beeld.
function parseDesignFills(html) {
  const sec = sectionOf(html, 'fills'); if (!sec) return [];
  const urls = [...new Set((sec.match(/\/media\/webp\/[0-9]+\/[A-Za-z0-9+/=]+\.webp/g) || []))];
  const out = []; const seen = {};
  urls.forEach(u => {
    const p = decodePath(u); const f = (p.split('/').pop() || '').toLowerCase();
    if (!/\.jpg/i.test(p)) return;                                   // grote deur-renders zijn .jpg
    if (!/elegance|prestige|classic|d-line|geometric|modern/i.test(f) || /cover/i.test(f)) return;
    if (seen[u]) return; seen[u] = 1;
    const famRaw = (f.match(/elegance|prestige|classic|d-line|geometric|modern/) || ['model'])[0];
    const fam = /geometric|modern|d-line/.test(famRaw) ? 'Modern' : (famRaw[0].toUpperCase() + famRaw.slice(1));
    const num = (f.match(/(\d+)/) || [])[1];
    out.push({ name: (fam + (num ? ' ' + parseInt(num, 10) : '')).trim(), url: abs(u) });
  });
  return out;
}
// ramen: krukken (#handles)
function parseHandles(html) {
  const sec = sectionOf(html, 'handles'); if (!sec) return [];
  const tags = sec.match(/<img[^>]+src="\/media\/webp[^"]+\.webp"[^>]*alt="[^"]*"/gi) || [];
  const seen = {}; const out = [];
  tags.forEach(t => {
    const u = abs((t.match(/src="([^"]+)"/) || [])[1]);
    const name = dec((t.match(/alt="([^"]*)"/) || [])[1] || '');
    if (!u || !name || seen[u]) return; seen[u] = 1;
    out.push({ name, url: u });
  });
  return out;
}

/* ============================================================================
   OPTIES — exact zoals op de Drutex-modelpagina (niets verzonnen).
   - std:   "Wyposażenie standardowe" (verbatim lijst): glaspakket/Ug, warme rand,
            dorpel (deuren), beslag…  → tonen als read-only "standaarduitrusting".
   - glas:  beschikbare glassoorten uit de proza "W ofercie także szyby …".
   - boxes: de simple-info-box-blokken (Szprosy, Wentylacje met merken, Ramki,
            Szyba piaskowana, …) met itemnaam + detail, letterlijk van Drutex.
   ========================================================================== */
function parseStdEquip(html) {
  const i = html.search(/Wyposa[zż]enie standardowe/i); if (i < 0) return [];
  const sub = html.slice(i, i + 2600);
  const ue = sub.indexOf('</ul>');
  const region = ue >= 0 ? sub.slice(0, ue) : sub;
  let lis = [...region.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(x => plain(x[1])).filter(Boolean);
  if (!lis.length) { // proza-fallback: na "standardowe:" tot eerste link/knop
    let t = plain(sub.replace(/ZOBACZ[\s\S]*$/i, '')).replace(/^.*?Wyposa[zż]enie standardowe:\s*/i, '');
    lis = t.split(/(?:\s•\s|\s-\s)/).map(s => s.trim());
  }
  lis = lis.filter(s => s && s.length > 2 && !/ZOBACZ|Porady|Czyste powietrze/i.test(s));
  return [...new Set(lis)].slice(0, 24);
}
function parseGlassTypes(html) {
  const m = html.match(/W ofercie tak[zż]e szyby([\s\S]{0,320}?)\.(?:\s|<)/i);
  if (!m) return [];
  const parts = plain(m[1]).split(',').map(s => s.trim()).filter(Boolean);
  const last = parts.pop() || '';
  last.split(/\s+i\s+/).forEach(x => { const v = x.trim(); if (v) parts.push(v); });
  return parts.map(s => s.replace(/^szyby?\s+/i, '').trim()).filter(s => s.length > 2).slice(0, 12);
}
function parseInfoBoxes(html) {
  const re = /<div class="simple-info-box">([\s\S]*?)(?=<div class="simple-info-box">|<\/section|<footer|$)/gi;
  const out = []; let m;
  while ((m = re.exec(html))) {
    const blk = m[1];
    const title = plain((blk.match(/<div class="title">([\s\S]*?)<\/div>/i) || [, ''])[1]);
    if (!title) continue;
    const items = []; const seen = {};
    const itemRe = /<img\b([^>]*)>\s*<div class="text">([\s\S]*?)<\/div>/gi; let it;
    while ((it = itemRe.exec(blk))) {
      const name = plain((it[1].match(/alt="([^"]*)"/i) || [, ''])[1]);
      if (!name) continue;
      let detail = plain(it[2]); if (detail.toLowerCase().indexOf(name.toLowerCase()) === 0) detail = detail.slice(name.length).trim();
      detail = detail.replace(/^[\s:–-]+/, '').replace(/\*+$/, '').trim();
      // dedup op naam+detail (niet enkel naam): zo blijven varianten met dezelfde alt maar
      // verschillende tekst behouden — bv. Ramki "Swisspacer Ultimate" × 6 RAL-kleuren —
      // terwijl echte carrousel-duplicaten (zelfde naam én tekst) wél wegvallen.
      const key = (name + '|' + detail).toLowerCase();
      if (seen[key]) continue; seen[key] = 1;
      const src = (it[1].match(/src="([^"]*)"/i) || [, ''])[1];
      items.push({ name, detail, img: src ? abs(src) : null });
    }
    // "Zobacz wszystkie" → de VOLLEDIGE lijst van dit blok (carrousel toont maar een subset)
    const seeAll = (blk.match(/href="(\/pl\/produkty\/addons\/type\/\d+\/?)"/i) || [, ''])[1];
    if (items.length) out.push({ title, items, seeAll: seeAll ? abs(seeAll) : null });
  }
  return out;
}
// splits "Aereco AMO 6-30 m³/h" / "Szpros naklejany 27/45/65 mm" / "Swisspacer … RAL 9016"
// in naam + detail (meeteenheid achteraan). Anders volledige tekst als naam.
function splitNameDetail(s) {
  s = plain(s).replace(/\*+$/, '').trim();
  const m = s.match(/^(.*?)(\s+(?:[\d.,/–-]+\s*m[³3]\/h.*|[\d.,/–-]+\s*mm\b.*|wymiary:.*|RAL\s*\d+.*))$/i);
  if (m && m[1].trim().length > 1) return { name: m[1].trim(), detail: m[2].trim() };
  return { name: s, detail: '' };
}
// volledige optie-lijst van een "addons/type/N"-pagina: res-img-items. Schone NAAM uit de
// alt-tekst (niet het langere #sub-html-blok), detail = meeteenheid (uit alt of sub-html).
function parseAddons(html) {
  const out = []; const seen = {};
  const re = /<div class="res-img"([^>]*)>\s*<img\b([^>]*)>/gi; let m;
  while ((m = re.exec(html))) {
    const img = (m[2].match(/src="([^"]+)"/i) || [, ''])[1];
    const alt = plain((m[2].match(/alt="([^"]*)"/i) || [, ''])[1]);
    if (!img || !alt) continue;
    const nd = splitNameDetail(alt);
    let detail = nd.detail;
    if (!detail) { // meeteenheid uit het gekoppelde #sub-html-blok
      const sub = (m[1].match(/data-sub-html="#([^"]+)"/i) || [, ''])[1];
      if (sub) { const sm = html.match(new RegExp('id="' + sub + '"[^>]*>\\s*<div class="text">([\\s\\S]*?)<\\/div>', 'i'));
        if (sm) { const mm = plain(sm[1]).match(/[\d.,]+\s*[-–]\s*[\d.,]+\s*m³\/h|[\d.,]+\s*m³\/h|[\d/]+\s*mm/i); if (mm) detail = mm[0]; } }
    }
    if (seen[nd.name.toLowerCase()]) continue; seen[nd.name.toLowerCase()] = 1;
    out.push({ name: nd.name, detail: detail || '', img: abs(img) });
  }
  return out;
}
async function getAddons(url) {
  if (!url) return null;
  if (addonsCache[url] !== undefined) return addonsCache[url];
  const h = await fetchText(url); const list = h ? parseAddons(h) : null;
  addonsCache[url] = (list && list.length) ? list : null;
  return addonsCache[url];
}
// glas-keuze met foto's: de "glazing-samples"-galerij (changeImage-knoppen) — bv. 33.1, 44.4,
// Antisol, Ornament Cathedral, Stopsol, Float, Waterfall… elk met een glasfoto. Verbatim van Drutex.
function parseGlassSamples(html) {
  const out = []; const seen = {};
  const re = /changeImage\([0-9]+,\s*'([^']+)'\)[^>]*>\s*<img[^>]*alt="([^"]*)"/gi; let m;
  while ((m = re.exec(html))) {
    const name = plain(m[2]); if (!name || seen[name.toLowerCase()]) continue; seen[name.toLowerCase()] = 1;
    out.push({ name, img: abs(m[1]) });
  }
  return out;
}
function parseOptions(html) {
  let glas = parseGlassSamples(html);
  if (!glas.length) glas = parseGlassTypes(html).map(function (g) { return { name: g, img: null }; });
  return { std: parseStdEquip(html), glas: glas, boxes: parseInfoBoxes(html) };
}
// downloadt de optie-afbeeldingen (glas + blokken) gedeeld/gededupliceerd → lokale paden.
// numerieke "Przykład N"-voorbeelden (zandstraal) slaan we over (worden niet als keuze getoond).
async function collectOptions(html) {
  const o = parseOptions(html);
  async function dl(items) {
    const todo = (items || []).filter(function (x) { return x.img && !/^Przyk[lł]ad\s*\d+/i.test(x.name); });
    await pool(todo, 6, async function (it) { const rel = await downloadShared(it.img, 'opts'); it.img = rel || null; });
  }
  await dl(o.glas);
  for (const b of o.boxes) {
    // MERGE carrousel-subset + volledige "Zobacz wszystkie"-lijst (geen van beide is altijd compleet:
    // ventilatie/szprosy zitten vollediger in addons; ramki-kleurvarianten enkel in de carrousel).
    const full = await getAddons(b.seeAll);
    if (full && full.length) {
      const have = {}; b.items.forEach(function (it) { have[it.name.toLowerCase()] = 1; });
      full.forEach(function (it) { if (!have[it.name.toLowerCase()]) b.items.push(it); });
    }
    delete b.seeAll;
    await dl(b.items);
  }
  return o;
}

async function collectFills(html) {
  let patterns = parseFills(html);
  if (!patterns.length) { // design-deuren: grote design-renders als enkelvoudige patronen
    patterns = parseDesignFills(html).map(d => ({ name: d.name, apps: { inox: d.url } }));
  }
  const out = [];
  for (const f of patterns) {
    const apps = {};
    for (const a of Object.keys(f.apps)) { const rel = await downloadShared(f.apps[a], 'fills'); if (rel) apps[a] = rel; }
    if (Object.keys(apps).length) out.push({ n: out.length + 1, name: f.name, apps });
  }
  return out;
}
async function collectHandles(html) {
  const list = parseHandles(html); const out = [];
  await pool(list, 6, async (h) => { const rel = await downloadShared(h.url, 'handles'); if (rel) out.push({ name: h.name, img: rel }); });
  // volgorde van de pagina behouden
  const ord = list.map(h => h.name);
  out.sort((a, b) => ord.indexOf(a.name) - ord.indexOf(b.name));
  return out;
}

async function scrapeOne(t) {
  const dir = path.join(MEDIA, t.slug);
  const html = await fetchText(t.url);
  if (!html) return { ...t, error: 'page-fetch-failed' };
  const name = parseName(html, t.slug);
  let type = TYPE_BY_CAT[t.category] || 'window';
  if (/d-gate|brama|gara[zż]/i.test(t.slug + ' ' + name)) type = 'gate'; // garagedeur → eigen schema
  let video = null, videoUrl = null;
  for (const cand of parseVideoCandidates(html, type)) {
    const ext = (cand.match(/\.(mp4|webm)(?:$|\?)/i) || [, 'mp4'])[1].toLowerCase();
    if (await download(cand, path.join(dir, 'animation.' + ext))) { video = `/media/drutex/${t.slug}/animation.${ext}`; videoUrl = cand; break; }
  }

  // ---- kleuren ----
  const rawColors = parseColors(html);
  let colorMode = 'none', colors = [], mask = null, ralEndpoint = null;
  if (rawColors.length) {
    colorMode = 'image';
    await pool(rawColors, 6, async (c) => {
      const okR = c.img && await download(c.img, path.join(dir, 'renders', c.slug + '.webp'));
      const okS = c.bg && await download(c.bg, path.join(dir, 'swatches', c.slug + '.webp'));
      if (okR) colors.push({ slug: c.slug, name: c.name, code: c.code,
        render: `/media/drutex/${t.slug}/renders/${c.slug}.webp`,
        swatch: okS ? `/media/drutex/${t.slug}/swatches/${c.slug}.webp` : `/media/drutex/${t.slug}/renders/${c.slug}.webp` });
    });
    colors.sort((a, b) => rawColors.findIndex(x => x.slug === a.slug) - rawColors.findIndex(x => x.slug === b.slug));
  } else {
    const maskUrl = parseMask(html); let m2 = null;
    if (maskUrl && await download(maskUrl, path.join(dir, 'mask.webp'))) m2 = `/media/drutex/${t.slug}/mask.webp`;
    if (m2) { mask = m2; colorMode = 'ral'; const ep = parseRalEndpoint(html); ralEndpoint = ep || RAL_API; if (ep && !isFullRal(ep)) colors = await getRalSet(ep); else await getRAL(); }
  }

  // ---- drewniano-aluminiowe: buitenkant = alu-masker (RAL), binnenkant = hout-decors (colors) ----
  let dual = false, maskOuter = null, maskOuterHex = null;
  if (colorMode === 'image' && colors.length && isDualWoodAlu(html)) {
    const ou = parseOuterMask(html);
    if (ou && await download(ou, path.join(dir, 'mask-outer.webp'))) {
      maskOuter = `/media/drutex/${t.slug}/mask-outer.webp`; maskOuterHex = parseOuterHex(html); dual = true;
    }
  }

  // ---- extra: vulpatronen (alleen deuren) · krukken/pochwyty (ramen, deuren én schuif) ----
  let fills = [], handles = [];
  if (type === 'door') fills = await collectFills(html);
  handles = await collectHandles(html); // #handles kan op elk producttype voorkomen

  // ---- opties exact van de modelpagina (glas-galerij + szprosy, ventilatie, ramki, standaarduitrusting), met foto's ----
  const options = await collectOptions(html);

  const vakken = type === 'window' ? (SINGLE_SASH.has(t.slug) ? 1 : 2) : undefined;
  return { slug: t.slug, name, category: t.category, type, productUrl: t.url, video, videoSrc: videoUrl, colorMode, mask, ralEndpoint, vakken, colors, fills, handles, options, dual, maskOuter, maskOuterHex };
}

function writeModelsJs(map, ral) {
  const head = '/* AUTO-GEGENEREERD door scripts/scrape-drutex.js uit de officiele Drutex-productpaginas.\n'
    + '   colorMode: image (eigen render/kleur) | ral (masker + window.DRUTEX_RAL) | none.\n'
    + '   deuren: fills[] (vulpatronen, apps inox/czarny) · ramen: handles[] (krukken).\n'
    + '   Nieuw model = scripts/drutex-targets.json + scraper opnieuw draaien. */\n';
  fs.writeFileSync(MODELS_JS, head + 'window.DRUTEX_RAL = ' + JSON.stringify(ral || []) + ';\n' + 'window.DRUTEX_MODELS = ' + JSON.stringify(map, null, 2) + ';\n');
}

// exporteer parsers zodat ze los te testen zijn (zonder de scrape te draaien)
module.exports = { parseOptions, parseStdEquip, parseGlassTypes, parseGlassSamples, parseInfoBoxes, parseAddons, splitNameDetail, parseColors, parseVideoCandidates };
if (require.main !== module) return;

(async function main() {
  const targets = JSON.parse(fs.readFileSync(TARGETS, 'utf8'));
  const onlyArg = (process.argv.find(a => a.startsWith('--only=')) || '').split('=')[1]
    || (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '');
  const only = onlyArg ? onlyArg.split(',') : null;
  const todo = only ? targets.filter(t => only.includes(t.slug)) : targets;

  let map = {};
  if (fs.existsSync(MODELS_JSON)) { try { map = JSON.parse(fs.readFileSync(MODELS_JSON, 'utf8')); } catch (e) { } }

  console.log('scraping', todo.length, 'model(s)…');
  for (const t of todo) {
    const r = await scrapeOne(t);
    if (r.error) { console.log('  ✗', t.slug, '—', r.error); continue; }
    map[r.slug] = r;
    const extra = r.fills.length ? ' | fills=' + r.fills.length : (r.handles.length ? ' | krukken=' + r.handles.length : '');
    const kl = r.colorMode === 'ral' ? 'RAL' : (r.colors.length + ' kl');
    console.log('  ✓', r.slug, '| ' + r.type + ' | video=' + (r.video ? 'ja' : 'nee') + ' | ' + r.colorMode + ' ' + kl + extra);
    fs.writeFileSync(MODELS_JSON, JSON.stringify(map, null, 2));
  }
  writeModelsJs(map, await getRAL());
  console.log('klaar — modellen:', Object.keys(map).length);
})();
