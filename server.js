require('dotenv').config();
const express = require('express');
const path = require('path');
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
app.get('/configurator', (req, res) => render(res, 'configurator', { active: 'configurator', title: 'Configurator – stel je kozijn samen', assistantEnabled: !!process.env.ANTHROPIC_API_KEY }));
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
