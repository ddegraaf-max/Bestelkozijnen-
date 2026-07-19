require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieSession = require('cookie-session');
const db = require('./db');
const { company, materials } = require('./data.js');

const app = express();
const PORT = process.env.PORT || 3000;
// Asset-versie voor cache-busting: verandert bij elke (re)start/deploy, zodat
// browsers én CDN verse CSS/JS ophalen i.p.v. een oude gecachte versie.
const ASSET_VER = Date.now();

// Achter de Railway-proxy: vertrouw X-Forwarded-* zodat req.protocol 'https' is
// (nodig voor correcte herstellinks in e-mails).
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
// AI Kozijnenscan: foto-uploads (base64) zijn groter dan 1mb, dus deze route
// krijgt een eigen ruimere parser — MOET vóór de globale 1mb-parser staan,
// anders strandt de upload daar al.
app.use('/ai-kozijnenscan', express.json({ limit: '20mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
  name: 'bko',
  keys: [process.env.SESSION_SECRET || 'verander-deze-sleutel-in-productie'],
  maxAge: 30 * 24 * 60 * 60 * 1000
}));



// ---- huidige gebruiker beschikbaar maken ----
app.use(async (req, res, next) => {
  try { req.user = req.session.uid ? await db.findUserById(req.session.uid) : null; }
  catch (e) { console.error('[auth] gebruiker laden mislukt:', e.message); req.user = null; }
  res.locals.currentUser = req.user;
  res.locals.company = company;
  res.locals.materials = materials;
  res.locals.active = '';
  res.locals.assetVer = ASSET_VER;
  next();
});

const mailer = require('./mailer')(company);



function render(res, view, data = {}) { res.render(view, { active: '', ...data }); }

// ================= PUBLIEKE PAGINA'S =================
app.get('/', (req, res) => render(res, 'home', { active: 'home', title: 'Kozijnen op maat bestellen' }));
// /configurator = de oorspronkelijke (statische) kozijn-configurator (EJS-view).
// Toont het kozijn als stilstaande technische tekening met open-richting-symbolen.
app.get('/configurator', (req, res) => render(res, 'configurator', { active: 'configurator', title: 'Configurator – stel je kozijn samen', assistantEnabled: !!process.env.ANTHROPIC_API_KEY }));

// De Drutex-catalogus-configurator (standalone HTML) staat op /configurator2 en /drutex.
// Injecteer een versie (?v=) op de eigen JS/CSS zodat browsers na een (re)deploy verse
// bestanden ophalen i.p.v. een oude gecachte versie (anders zie je wijzigingen pas na
// een handmatige harde refresh).
function serveConfigPage(file) {
  return function (req, res) {
    let html = fs.readFileSync(path.join(__dirname, 'public', file), 'utf8');
    html = html.replace(/(["'])(\/(?:js|css)\/[A-Za-z0-9._\-]+\.(?:js|css))\1/g, '$1$2?v=' + ASSET_VER + '$1');
    // inlogstatus meegeven zodat de configurator pas een aanvraag verstuurt als de bezoeker is ingelogd
    html = html.replace('<body>', '<body>\n  <script>window.__loggedIn=' + (req.user ? 'true' : 'false') + ';</script>');
    res.type('html').send(html);
  };
}
app.get('/configurator2', serveConfigPage('configurator2.html'));  // nieuw "Precision Architectural"-design
app.get('/drutex', serveConfigPage('configurator.html'));          // originele Drutex-catalogus (directe toegang: /drutex/#model-slug)
app.get('/kozijnen/:slug', (req, res) => {
  const m = materials[req.params.slug];
  if (!m) return res.status(404).render('404', { active: '', title: 'Niet gevonden' });
  render(res, 'materiaal', { active: 'materialen', m, title: m.title });
});
app.get('/werkwijze', (req, res) => render(res, 'werkwijze', { active: 'werkwijze', title: 'Onze werkwijze' }));
app.get('/montage', (req, res) => render(res, 'montage', { active: 'montage', title: 'Montageservice' }));
app.get('/veelgestelde-vragen', (req, res) => render(res, 'faq', { active: 'faq', title: 'Veelgestelde vragen' }));
app.get('/contact', (req, res) => render(res, 'contact', { active: 'contact', title: 'Contact' }));
app.get('/algemene-voorwaarden', (req, res) => render(res, 'voorwaarden', { active: '', title: 'Algemene voorwaarden' }));
app.get('/privacybeleid', (req, res) => render(res, 'privacy', { active: '', title: 'Privacybeleid' }));

// contactformulier
app.post('/api/contact', async (req, res) => {
  const { naam, email, bericht, website, elapsed } = req.body;
  // Anti-spam: honeypot ingevuld of formulier verdacht snel verzonden -> stil negeren (bot niet wijzer maken)
  if (website) return res.json({ ok: true });
  if (typeof elapsed === 'number' && elapsed < 2500) return res.json({ ok: true });
  if (!naam || !email) return res.status(400).json({ ok: false, error: 'Vul naam en e-mail in.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) return res.status(400).json({ ok: false, error: 'Vul een geldig e-mailadres in.' });
  if (String(naam).length > 120 || String(email).length > 160 || String(bericht || '').length > 4000)
    return res.status(400).json({ ok: false, error: 'Bericht is te lang.' });
  mailer.notifyNewRequest({ ref: 'CONTACT', klant: { naam, email, telefoon: '', opmerking: bericht }, samenvatting: 'Contactformulier' }).catch(() => {});
  res.json({ ok: true });
});

// offerteaanvraag vanuit de configurator (/configurator)
app.post('/api/offerte', async (req, res) => {
  const { naam, email, telefoon, opmerking, samenvatting, model, website, elapsed } = req.body;
  if (website) return res.json({ ok: true });                                   // honeypot
  if (typeof elapsed === 'number' && elapsed < 2500) return res.json({ ok: true });
  if (!naam || !email) return res.status(400).json({ ok: false, error: 'Vul uw naam en e-mailadres in.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) return res.status(400).json({ ok: false, error: 'Vul een geldig e-mailadres in.' });
  if (String(naam).length > 120 || String(email).length > 160 || String(samenvatting || '').length > 8000 || String(opmerking || '').length > 4000)
    return res.status(400).json({ ok: false, error: 'Aanvraag is te lang.' });
  const sam = (model ? 'Model: ' + model + '\n' : '') + String(samenvatting || '');
  mailer.notifyNewRequest({ ref: 'CONFIGURATOR', klant: { naam, email, telefoon: telefoon || '', opmerking }, samenvatting: sam }).catch(() => {});
  res.json({ ok: true });
});

// ── Live maatstructuur (1:1) voor de configurator-stap "Afmetingen" ─────────────
// De Drutex-maatstap is dynamisch: aantal rijhoogtes, ranges en cel-breedtes hangen
// af van de gekozen rijen/producttype/voet. Wij spelen de keuzes 1:1 af op de
// Drutex-API en geven de exacte maatvelden terug. Resultaat wordt kort gecachet.
const KONF_API = 'https://www.okna-konfigurator.pl/api/okna-konfigurator.pl';
const KONF_HDRS = { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json', 'Accept': 'application/json', 'Origin': 'https://www.okna-konfigurator.pl', 'Referer': 'https://www.okna-konfigurator.pl/konfigurator-produktu/okna/' };
const _dimsCache = new Map();   // sleutel -> { t, data }
const ALLOWED_GROUPS = { windows: 1, doors: 1, balcony: 1, suwanki: 1, HS: 1, roletyPortos: 1 };

app.post('/api/konf/dims', async (req, res) => {
  try {
    const group = String((req.body && req.body.group) || '');
    const selIn = (req.body && req.body.sel) || {};
    if (!ALLOWED_GROUPS[group] || typeof selIn !== 'object') return res.status(400).json({ ok: false });
    // sanitiseer keuze-map {groupIdentity: featureIdentity}
    const sel = {};
    Object.keys(selIn).slice(0, 30).forEach(function (k) {
      const v = selIn[k];
      if (/^[A-Za-z0-9_]+$/.test(k) && typeof v === 'string' && /^[A-Za-z0-9_.\-]+$/.test(v)) sel[k] = v;
    });
    const key = group + '|' + Object.keys(sel).sort().map(function (k) { return k + '=' + sel[k]; }).join(',');
    const hit = _dimsCache.get(key);
    if (hit && Date.now() - hit.t < 36e5) return res.json(hit.data);   // 1u cache

    const put = await fetch(KONF_API + '/session/', { method: 'PUT', headers: KONF_HDRS });
    const sid = (await put.json()).sessionId;
    if (!sid) return res.status(502).json({ ok: false });
    const H2 = Object.assign({ UUID: sid }, KONF_HDRS);
    const init = await fetch(KONF_API + '/product/' + group, { method: 'POST', headers: H2 });
    let pd = (await init.json()).productData || null;
    // loop door de stappen tot "Afmetingen": respecteer de keuze van de klant
    // (rijen/producttype/voet), neem voor de rest de eerste optie.
    async function pick(fid) {
      const r = await fetch(KONF_API + '/product', { method: 'POST', headers: H2, body: JSON.stringify({ productFeatureIdentity: fid, rowDimensions: [], rowCellDimensions: [] }) });
      return r.status === 200 ? ((await r.json()).productData || null) : null;
    }
    for (let guard = 0; guard < 20 && pd; guard++) {
      const ns = pd.nextStepData;
      if (!ns || ns.featureGroupIdentity === 'ProductDimensions') break;
      const gid = ns.featureGroupIdentity;
      const fid = sel[gid] || (ns.visibleFeatures || [])[0];
      if (!fid) break;
      const next = await pick(fid);
      if (!next) break;
      pd = next;
    }
    if (!pd) return res.status(502).json({ ok: false });
    const HOST = 'https://www.okna-konfigurator.pl';
    const abs = function (u) { return u ? (u.charAt(0) === '/' ? HOST + u.replace(/\/+/g, '/') : u) : ''; };
    const data = {
      ok: true,
      total: pd.totalDimensions || null,
      rows: (pd.rowDimensions || []).map(function (r) { return { label: r.translationLabel || '', minH: r.minHeight, maxH: r.maxHeight, h: r.height }; }),
      widthRange: pd.totalDimensions ? { min: pd.totalDimensions.minWidth, max: pd.totalDimensions.maxWidth } : null,
      widthImage: abs(pd.widthImage), heightImage: abs(pd.heightImage), image: abs(pd.image)
    };
    _dimsCache.set(key, { t: Date.now(), data });
    res.json(data);
  } catch (e) { res.status(502).json({ ok: false }); }
});

// ================= AI KOZIJNENSCAN =================
// Publiek: klant uploadt gevelfoto's, AI herkent kozijnen + schat maten,
// klant vraagt een richtprijs aan. Aanvraag + scan komen in de database
// en jij krijgt een notificatiemail (NOTIFY_EMAIL).
app.use('/ai-kozijnenscan', require('./routes/kozijnscan-public'));

// Intern: beheertool (inmetingen invullen, kalibratie, dataset-export).
// Alleen toegankelijk voor ingelogde gebruikers met rol 'beheer'; voor
// anderen gedraagt de URL zich als een gewone 404.
app.use('/beheer/kozijnscan', (req, res, next) => {
  if (req.user && req.user.role === 'beheer') return next();
  return res.status(404).render('404', { active: '', title: 'Niet gevonden' });
}, require('./routes/kozijnscan'));

// ================= AUTH / PORTAAL / BEHEER / API =================
app.use('/', require('./routes/auth')(company, mailer));
// Tweestapsverificatie is optioneel: gebruikers kunnen het zelf aan- of
// uitzetten in hun accountinstellingen (/portaal/account).
app.use('/portaal', require('./routes/portal')(company));
app.use('/beheer', require('./routes/admin')(company, mailer));
app.use('/api', require('./routes/api')(company, mailer));

// ---- 404 ----
app.use((req, res) => res.status(404).render('404', { active: '', title: 'Niet gevonden' }));

// ---- Opstarten: database klaarzetten, beheerder seeden, dan luisteren ----
async function start() {
  await db.init();

  // Beheerder aanmaken bij start (zet ADMIN_EMAIL + ADMIN_PASSWORD in env)
  const email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD;
  if (email && pw && !(await db.findUserByEmail(email))) {
    const bcrypt = require('bcryptjs');
    await db.createUser({ naam: 'Beheerder', email, passwordHash: bcrypt.hashSync(pw, 10), role: 'beheer', verified: true });
    console.log('Beheerder aangemaakt:', email);
  }

  app.listen(PORT, () => console.log(`bestelkozijnenopmaat draait op poort ${PORT}`));
}
start().catch((e) => { console.error('Opstarten mislukt:', e); process.exit(1); });
