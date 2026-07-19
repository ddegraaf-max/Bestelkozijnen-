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

// ---- "AI Scan" automatisch in het menu van ELKE pagina ----
// We passen de header-partial niet aan; in plaats daarvan klonen we het
// bestaande Contact-menu-item (inclusief dezelfde CSS-classes, dus de
// stijl klopt altijd) en zetten er een "AI Scan"-link direct achter.
// Werkt op alle gerenderde pagina's én op de statische configurator-HTML.
// ---- "Kozi": AI-scan als persoon op de homepage ----
// Wordt automatisch tussen de hero en het Materialen-blok geplaatst;
// home.ejs hoeft niet aangepast te worden. Styling is kzp-genaamruimt.
const KOZI_HTML = `
<section id="kozi-intro">
<style>
#kozi-intro{max-width:1160px;margin:26px auto 10px;padding:0 20px;box-sizing:border-box}
#kozi-intro *{box-sizing:border-box;opacity:1 !important;filter:none !important;animation:none !important}
#kozi-intro .kzp-card{background:#fcfbf8;border:1px solid #e5e0d5;border-radius:16px;padding:28px;display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap}
#kozi-intro .kzp-avatar{flex:0 0 132px}
#kozi-intro .kzp-body{flex:1;min-width:280px}
#kozi-intro .kzp-tag{display:inline-block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#e8590c;background:#fdece1;border-radius:999px;padding:6px 13px;font-weight:600}
#kozi-intro h2{font-size:clamp(22px,3.2vw,30px);font-weight:800;margin:12px 0 0;color:#161616;line-height:1.1}
#kozi-intro .kzp-bubble{position:relative;background:#fff;border:1px solid #e5e0d5;border-radius:14px;padding:15px 18px;margin-top:14px;font-size:15px;line-height:1.6;color:#3a362f}
#kozi-intro .kzp-bubble:before{content:'';position:absolute;left:-9px;top:22px;width:16px;height:16px;background:#fff;border-left:1px solid #e5e0d5;border-bottom:1px solid #e5e0d5;transform:rotate(45deg)}
#kozi-intro .kzp-tipslabel{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:#6b6459;margin:16px 0 8px;font-weight:600}
#kozi-intro .kzp-tips{display:flex;gap:8px;flex-wrap:wrap}
#kozi-intro .kzp-tip{font-size:13px;background:#f5f2ec;border:1px solid #e5e0d5;border-radius:999px;padding:8px 14px;color:#3a362f}
#kozi-intro .kzp-cta{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:18px}
#kozi-intro .kzp-btn{display:inline-block;background:#e8590c;color:#fff;text-decoration:none;font-weight:600;font-size:15px;border-radius:12px;padding:13px 24px}
#kozi-intro .kzp-btn:hover{background:#d14e08}
#kozi-intro .kzp-sub{font-size:12.5px;color:#6b6459;line-height:1.5;max-width:420px}
@media(max-width:560px){#kozi-intro .kzp-avatar{flex-basis:96px}#kozi-intro .kzp-bubble:before{display:none}}
</style>
<div class="kzp-card">
  <div class="kzp-avatar">
    <svg viewBox="0 0 132 148" xmlns="http://www.w3.org/2000/svg" aria-label="Kozi, de AI-inmeetassistent">
      <line x1="66" y1="6" x2="66" y2="20" stroke="#161616" stroke-width="4" stroke-linecap="round"/>
      <circle cx="66" cy="6" r="5" fill="#e8590c" stroke="#161616" stroke-width="2.5"/>
      <rect x="16" y="20" width="100" height="100" rx="24" fill="#e8590c" stroke="#161616" stroke-width="4"/>
      <line x1="66" y1="26" x2="66" y2="114" stroke="#faf8f4" stroke-width="6"/>
      <line x1="22" y1="70" x2="110" y2="70" stroke="#faf8f4" stroke-width="6"/>
      <circle cx="44" cy="50" r="7.5" fill="#161616"/>
      <circle cx="88" cy="50" r="7.5" fill="#161616"/>
      <circle cx="46.5" cy="47.5" r="2.5" fill="#faf8f4"/>
      <circle cx="90.5" cy="47.5" r="2.5" fill="#faf8f4"/>
      <path d="M46 92 Q66 106 86 92" fill="none" stroke="#161616" stroke-width="5" stroke-linecap="round"/>
      <g transform="translate(96,110) rotate(-12)">
        <rect x="0" y="0" width="30" height="22" rx="5" fill="#faf8f4" stroke="#161616" stroke-width="3"/>
        <circle cx="10" cy="11" r="4.5" fill="none" stroke="#161616" stroke-width="3"/>
        <path d="M14 11 L34 14" stroke="#161616" stroke-width="3" stroke-linecap="round"/>
        <path d="M27 9 v4 M31 10 v4" stroke="#161616" stroke-width="2"/>
      </g>
    </svg>
  </div>
  <div class="kzp-body">
    <span class="kzp-tag">Nieuw &middot; AI Kozijnenscan</span>
    <h2>Maak kennis met Kozi, uw AI-inmeetassistent</h2>
    <div class="kzp-bubble">
      &ldquo;Hoi! Stuur mij een paar foto&rsquo;s van uw gevel, dan herken ik uw kozijnen en schat ik de afmetingen.
      <b>Hoe beter uw foto, hoe beter mijn schatting</b> &mdash; en hoe dichter de richtprijs bij de werkelijkheid ligt.
      Zo weet u binnen een minuut waar u aan toe bent, nog v&oacute;&oacute;r er iemand langskomt.&rdquo;
    </div>
    <div class="kzp-tipslabel">Zo helpt u Kozi aan de beste schatting</div>
    <div class="kzp-tips">
      <span class="kzp-tip">&#128247; Recht van voren fotograferen</span>
      <span class="kzp-tip">&#9728;&#65039; Bij daglicht</span>
      <span class="kzp-tip">&#127968; De hele gevel in beeld</span>
      <span class="kzp-tip">&#128207; Weet u &eacute;&eacute;n maat? Nog nauwkeuriger!</span>
    </div>
    <div class="kzp-cta">
      <a class="kzp-btn" href="/ai-kozijnenscan">Start de gratis AI-scan &rarr;</a>
      <span class="kzp-sub">Binnen 1 minuut resultaat &middot; richtprijs geheel vrijblijvend &middot; definitieve offerte volgt na gratis inmeting bij u thuis.</span>
    </div>
  </div>
</div>
</section>`;

function injectKozi(body) {
  if (body.includes('id="kozi-intro"')) return body;
  // Plaats vóór het Materialen-blok; met nette terugvalopties.
  let anchor = body.indexOf('Kies wat bij je woning past');
  if (anchor < 0) anchor = body.search(/>\s*Materialen\s*</i) >= 0 ? body.search(/<section[^>]*>(?:(?!<section)[\s\S])*?Materialen/i) : -1;
  let insertAt = -1;
  if (anchor > -1) insertAt = body.lastIndexOf('<section', anchor);
  if (insertAt < 0) insertAt = body.lastIndexOf('</main>');
  if (insertAt < 0) insertAt = body.lastIndexOf('<footer');
  if (insertAt < 0) return body;
  return body.slice(0, insertAt) + KOZI_HTML + '\n' + body.slice(insertAt);
}

app.use((req, res, next) => {
  const origSend = res.send.bind(res);
  res.send = function (body) {
    try {
      if (typeof body === 'string'
          && /<a\b[^>]*href=["']\/contact["']/.test(body)
          && !/<a\b[^>]*href=["']\/ai-kozijnenscan["']/.test(body)) {
        body = body.replace(/(<a\b[^>]*href=["']\/contact["'][^>]*>[\s\S]*?<\/a>)/g, (m, anchor) => {
          const clone = anchor
            .replace(/href=(["'])\/contact\1/, 'href=$1/ai-kozijnenscan$1')
            .replace(/>[\s\S]*?<\/a>$/, '>AI Scan</a>')
            .replace(/\b(actief|active|is-active|current)\b/g, '')
            .replace(/class=(["'])\s*\1/g, '');
          return anchor + clone;
        });
      }
      // Kozi-sectie alleen op de homepage
      const kzUrl = (req.originalUrl || req.url || '').split('?')[0];
      if (typeof body === 'string' && kzUrl === '/' && body.includes('</html>')) {
        body = injectKozi(body);
      }
    } catch (e) { /* menu-injectie mag een pagina nooit breken */ }
    return origSend(body);
  };
  next();
});



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
