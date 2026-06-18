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

// Loopt 1 model door de wizard, pakt telkens de eerste zichtbare optie, en leest
// de maatlimieten (totalDimensions) zodra die gevuld zijn. Geeft {dim, steps}.
async function walkModel(group, materialIdentity) {
  const sid = await newSession();
  await initProduct(group, sid);
  let j = await selectFeature(sid, materialIdentity);
  let dim = null; const steps = [];
  for (let guard = 0; guard < 30 && j; guard++) {
    const pd = j.productData; if (!pd) break;
    const td = pd.totalDimensions;
    if (td && (td.minWidth > 0 || td.maxWidth > 0)) dim = { minW: td.minWidth, maxW: td.maxWidth, minH: td.minHeight, maxH: td.maxHeight };
    const ns = pd.nextStepData; if (!ns) break;
    steps.push({ group: ns.featureGroupIdentity, visible: ns.visibleFeatures || [] });
    if (ns.featureGroupIdentity === 'ProductSummary') break;
    const next = (ns.visibleFeatures || [])[0];
    if (!next) break;                              // bv. ProductDimensions/Connectors: geen feature -> stop
    if (/^ProductDimensions/.test(ns.featureGroupIdentity)) break;
    j = await selectFeature(sid, next);
  }
  return { dim, steps };
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

    // maatlimieten per model (lichte walk)
    const dims = {};
    const models = fg.Material ? fg.Material.elements : [{ identity: '__default' }];
    for (const m of models) {
      if (m.identity === '__default') continue;
      try { const w = await walkModel(group, m.identity); if (w.dim) dims[m.identity] = w.dim; }
      catch (e) { /* skip */ }
    }

    catalog.productGroups[group] = {
      label: GROUPS[group],
      productGroupUrl: j.productData && j.productData.productGroupUrl,
      stepsOrder, featureGroups, dimensionLimits: dims
    };
    console.log(Object.keys(featureGroups).length + ' stappen, ' + (fg.Material ? fg.Material.elements.length : 0) + ' modellen, maatlimieten: ' + Object.keys(dims).length);
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
