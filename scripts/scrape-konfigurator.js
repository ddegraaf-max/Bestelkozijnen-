// Haalt de volledige Drutex-configuratordata 1:1 op (opties + afbeeldingen + maatlimieten)
// voor ALLE productgroepen van de officiele dealer-configurator. Reseller-gebruik:
// productcatalogusdata om de echte Drutex-producten mee te verkopen. Geen prijzen.
//
//   node scripts/scrape-konfigurator.js
//
// Flow (gereverse-engineerd uit product-wizard.js):
//   1. PUT  /session/                 -> { sessionId }
//   2. POST /product/<group>          -> volledige productSession (alle feature-groups + elementen)
//   3. POST /product { productFeatureIdentity } -> selectie maken (om maatlimieten per type te lezen)
// Afbeeldingen staan als absolute paden (/gfx/.., /product_images/..) op de host.

const fs = require('fs');
const path = require('path');

const HOST = 'https://www.okna-konfigurator.pl';
const API = HOST + '/api/okna-konfigurator.pl';

// productgroep -> NL-naam (uit de konfigurator-nav)
const GROUPS = {
  windows: 'Ramen',
  doors: 'Voordeuren (PVC)',
  balcony: 'Balkondeuren',
  suwanki: 'Schuiframen',
  HS: 'HS schuifpuien',
  roletyPortos: 'Rolluiken'
};

const H = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Origin': HOST,
  'Referer': HOST + '/konfigurator-produktu/okna/'
};

const OUT = path.join(__dirname, '..', 'public', 'media', 'konf');
const IMGROOT = path.join(OUT, 'img');

function imgLocal(url) {
  return url.replace(/^https?:\/\/[^/]+/, '').replace(/\/+/g, '/').replace(/^\//, '');
}
const toLocal = u => u ? '/media/konf/img/' + imgLocal(u) : '';

async function newSession() {
  const s = await fetch(API + '/session/', { method: 'PUT', headers: H });
  if (s.status !== 200) throw new Error('session ' + s.status);
  return (await s.json()).sessionId;
}
async function initProduct(group, sid) {
  const r = await fetch(API + '/product/' + group, { method: 'POST', headers: Object.assign({}, H, { UUID: sid }) });
  if (r.status !== 200) return null;
  return await r.json();
}
async function selectFeature(sid, identity) {
  const r = await fetch(API + '/product', {
    method: 'POST', headers: Object.assign({}, H, { UUID: sid }),
    body: JSON.stringify({ productFeatureIdentity: identity, rowDimensions: [], rowCellDimensions: [] })
  });
  if (r.status !== 200) return null;
  return await r.json();
}

function collectImages(el, set) {
  const out = [];
  if (el.previewImage) { out.push(el.previewImage); set.add(el.previewImage); }
  if (Array.isArray(el.images)) el.images.forEach(im => {
    const u = typeof im === 'string' ? im : (im && (im.url || im.previewImage || im.image));
    if (u) { out.push(u); set.add(u); }
  });
  return out;
}

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return 'skip';
  const r = await fetch(HOST + url, { headers: { 'User-Agent': H['User-Agent'], 'Referer': HOST + '/' } });
  if (r.status !== 200) return 'fail:' + r.status;
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.length) return 'empty';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return 'ok';
}
async function pool(items, n, worker) {
  const res = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length || 1) }, async () => {
    while (i < items.length) { const k = i++; res[k] = await worker(items[k], k); }
  }));
  return res;
}

// Loopt vanaf een set keuzes door tot de stap "Afmetingen" en leest de exacte
// maatstructuur: totale breedte-range + de afzonderlijke rij-hoogtes (met label
// "Wysokość - rząd N" en eigen min/max). Negeert vaste hulpvelden (min==max).
async function walkToDims(group, picks) {
  const sid = await newSession();
  let r = await initProduct(group, sid);
  for (const id of picks) { if (id) r = await selectFeature(sid, id); if (!r) return null; }
  let pd = r && r.productData;
  for (let g = 0; g < 18 && pd; g++) {
    const ns = pd.nextStepData;
    if (!ns || ns.featureGroupIdentity === 'ProductDimensions') break;
    const f = (ns.visibleFeatures || [])[0]; if (!f) break;
    const nx = await selectFeature(sid, f); if (!nx) break; pd = nx.productData;
  }
  if (!pd || !pd.totalDimensions) return null;
  const rows = (pd.rowDimensions || [])
    .filter(rd => rd.minHeight !== rd.maxHeight)
    .map(rd => ({ label: rd.translationLabel || '', minH: rd.minHeight, maxH: rd.maxHeight }));
  if (!rows.length) rows.push({ label: '', minH: pd.totalDimensions.minHeight, maxH: pd.totalDimensions.maxHeight });
  return { widthRange: { min: pd.totalDimensions.minWidth, max: pd.totalDimensions.maxWidth }, rows };
}

// Vangt de maatstructuur 1:1 per producttype (en per rij-aantal) voor een groep.
// Resultaat: { byType: {ProductType__X: {widthRange, rows[]}}, byRows: {1:{}, 2:{}, 3:{}} }.
async function captureDimModels(group) {
  const byType = {}, byRows = {};
  const sid0 = await newSession();
  const j0 = await initProduct(group, sid0);
  if (!j0 || !j0.productSession) return { byType, byRows };
  const fg = j0.productSession.productFeatureGroups;
  const materialId = (fg.Material && fg.Material.elements[0]) ? fg.Material.elements[0].identity : null;
  const irOpts = fg.IloscRzedow ? fg.IloscRzedow.elements.map(e => e.identity) : [null];

  // verzamel (rij-keuze, producttype)-paren door tot de ProductType-stap te lopen
  const pairs = [];
  for (const ir of irOpts) {
    const sid = await newSession();
    let r = await initProduct(group, sid);
    if (materialId) r = await selectFeature(sid, materialId);
    if (ir) r = await selectFeature(sid, ir);
    let types = null;
    for (let g = 0; g < 8 && r; g++) {
      const ns = r.productData && r.productData.nextStepData; if (!ns) break;
      if (ns.featureGroupIdentity === 'ProductType') { types = ns.visibleFeatures || []; break; }
      if (ns.featureGroupIdentity === 'ProductDimensions') break;
      const f = (ns.visibleFeatures || [])[0]; if (!f) break; r = await selectFeature(sid, f);
    }
    if (types && types.length) types.forEach(t => pairs.push([materialId, ir, t]));
    else pairs.push([materialId, ir, null]);
  }

  await pool(pairs, 8, async (picks) => {
    try {
      const m = await walkToDims(group, picks.filter(Boolean));
      if (!m) return;
      const t = picks[2];
      if (t) byType[t] = m;
      const rc = m.rows.length;
      if (!byRows[rc]) byRows[rc] = m;
    } catch (e) { /* skip */ }
  });
  return { byType, byRows };
}

(async () => {
  const catalog = { generated: 'scrape-konfigurator', productGroups: {} };
  const imgSet = new Set();

  for (const group of Object.keys(GROUPS)) {
    process.stdout.write('• ' + group + ' … ');
    const sid = await newSession();
    const j = await initProduct(group, sid);
    if (!j || !j.productSession) { console.log('overslaan (geen data)'); continue; }
    const fg = j.productSession.productFeatureGroups;
    const order = (j.productData && j.productData.missingRequiredChoices) || [];   // stapvolgorde op NAAM

    const featureGroups = {};
    for (const key in fg) {
      const g = fg[key];
      featureGroups[key] = {
        identity: g.identity, name: g.name,
        elements: g.elements.map(e => ({
          identity: e.identity, name: e.name, description: e.description || '',
          image: toLocal(collectImages(e, imgSet)[0] || ''),
          extra: collectImages(e, imgSet).slice(1).map(toLocal)
        }))
      };
    }
    // stapvolgorde: map namen uit missingRequiredChoices -> group-identity
    const byName = {}; for (const k in featureGroups) byName[featureGroups[k].name] = k;
    const stepsOrder = order.map(n => byName[n]).filter(Boolean);

    // maatstructuur 1:1 per producttype (welke rij-hoogtes + ranges) — kern voor de fabriek
    let dimModels = { byType: {}, byRows: {} };
    try { dimModels = await captureDimModels(group); } catch (e) { console.log('(dim-capture mislukt: ' + e.message + ')'); }

    catalog.productGroups[group] = {
      label: GROUPS[group],
      productGroupUrl: j.productData && j.productData.productGroupUrl,
      stepsOrder, featureGroups, dimModels
    };
    console.log(Object.keys(featureGroups).length + ' stappen · maten: ' + Object.keys(dimModels.byType).length + ' typen, rij-varianten: ' + Object.keys(dimModels.byRows).join('/'));
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, '_catalog.json'), JSON.stringify(catalog));
  console.log('\nUnieke afbeeldingen:', imgSet.size, '— downloaden…');
  let ok = 0, skip = 0, fail = 0;
  await pool([...imgSet], 12, async (u) => {
    const r = await download(u, path.join(IMGROOT, imgLocal(u)));
    if (r === 'ok') ok++; else if (r === 'skip') skip++; else { fail++; if (fail <= 15) console.log('  ', r, u); }
  });
  console.log('Afbeeldingen — ok:', ok, 'overgeslagen:', skip, 'mislukt:', fail);
  console.log('Catalogus:', path.relative(process.cwd(), path.join(OUT, '_catalog.json')));
})().catch(e => { console.error('FOUT:', e.message); process.exit(1); });
