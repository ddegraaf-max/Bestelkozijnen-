// Genereert één zelfstandig, klikbaar demo.html van alle pagina's.
// CSS en JS worden ingesloten; navigatie en formulieracties worden client-side gesimuleerd.
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const { company, materials } = require('./data');
const { STATUS_LABELS } = require('./routes/api');

const V = p => path.join(__dirname, 'views', p);
const css = fs.readFileSync(path.join(__dirname, 'public/css/style.css'), 'utf8')
          + '\n' + fs.readFileSync(path.join(__dirname, 'public/css/configurator.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'public/js/configurator.js'), 'utf8');
const herojs = fs.readFileSync(path.join(__dirname, 'public/js/herowindow.js'), 'utf8');

const base = { company, materials, currentUser: null, active: '' };

// voorbeelddata voor portaal/beheer
const sampleUser = { naam: 'Jolanda de Vries', email: 'jolanda@voorbeeld.nl', telefoon: '06 12 34 56 78', role: 'klant' };
const adminUser = { naam: 'Daniël de Graaf', email: 'montage@creditline.nl', role: 'beheer' };
const now = Date.now();
const sampleReq = {
  id: 'demo1', ref: 'WEB-26-1024', status: 'offerte_klaar', createdAt: now - 86400000, offertePdf: 'offerte.pdf',
  statusHistory: [
    { status: 'ontvangen', at: now - 86400000 },
    { status: 'in_behandeling', at: now - 80000000 },
    { status: 'offerte_klaar', at: now - 79000000 }
  ],
  klant: { naam: sampleUser.naam, email: sampleUser.email, telefoon: sampleUser.telefoon, opmerking: 'Graag levering voor de zomer.' },
  elementen: [
    { positie: 'Woonkamer voorzijde', systeem: 'IGLO EDGE (premium)', materiaal: 'kunststof',
      indeling: 'bovenlicht + 2 vakken', vakken: ['Vak 1: Draaikiep rechts', 'Vak 2: Vast (FIX)'],
      kleur: 'buiten Antraciet (RAL 7016), binnen Wit', afdichting: 'Zwart', kern: 'Antraciet',
      glas: 'Triple HR+++ (Ug 0,5)', glaslat: 'Kantig', warmeRand: 'ja',
      kruk: 'Aluminium standaard', sleutel: 'nee', rc2: 'ja', scharnieren: 'verdekt',
      roedes: 'geen', ventilatie: 'Aereco zelfregelend', extras: 'rolluik',
      afmetingen: '2400 × 1500 mm', meet: 'B 2400/2402/2401 · H 1498/1500/1499', montage: 'ja', aantal: 1,
      label: 'Woonkamer voorzijde · IGLO EDGE · 2400×1500' },
    { positie: 'Achterzijde (tuin)', systeem: 'IGLO-HS (hefschuifpui)', materiaal: 'kunststof',
      indeling: '2-delig schuifsysteem', vakken: ['Deel 1: Schuivend (naar rechts)', 'Deel 2: Vast (FIX)'],
      kleur: 'Antraciet (RAL 7016)', afdichting: 'Zwart', kern: 'Antraciet',
      glas: 'Triple HR+++ (Ug 0,5) + gelaagd veiligheidsglas', glaslat: 'Kantig', warmeRand: 'ja',
      kruk: 'FKS dubbelzijdige klink met inzetstuk', sleutel: 'nee', rc2: 'ja', scharnieren: 'standaard',
      deurBeslag: 'ABUS SKG** Klasse D (met noodopening)', dorpel: '',
      roedes: 'geen', ventilatie: 'Geen', extras: 'geen',
      afmetingen: '3000 × 2200 mm', meet: '', montage: 'ja', aantal: 1,
      label: 'Achterzijde (tuin) · IGLO-HS · 3000×2200' },
    { positie: 'Voorgevel', systeem: 'Voordeur – PVC (wit)', materiaal: 'kunststof',
      indeling: 'Voordeurpaneel, zijlicht links, bovenlicht',
      vakken: ['Model: Standard ST-25/1', 'Draairichting: scharnier links, naar binnen', 'Paneeldikte: 36 mm'],
      kleur: 'buiten Antraciet (RAL 7016), binnen Wit',
      glas: 'Glas-in-lood – 211 Diami', kruk: 'RVS-trekker recht',
      deurBeslag: 'GU Secury Automatic (SKG**)', dorpel: 'Aluminium dorpel (deur)',
      rc2: 'ja', sleutel: 'ja', scharnieren: 'standaard', extras: 'brievenbus, huisnummer',
      afmetingen: '1100 × 2300 mm', meet: '', montage: 'ja', aantal: 1,
      label: 'Voorgevel · Voordeur Standard ST-25/1' }
  ]
};

// pagina-definities: key -> { view, locals }
const pages = [
  ['home',         'home.ejs',            { ...base, active: 'home', title: 'Home' }],
  ['configurator', 'configurator.ejs',    { ...base, active: 'configurator', title: 'Configurator' }],
  ['kunststof',    'materiaal.ejs',       { ...base, active: 'materialen', title: 'Kunststof', m: materials.kunststof }],
  ['hout',         'materiaal.ejs',       { ...base, active: 'materialen', title: 'Hout', m: materials.hout }],
  ['aluminium',    'materiaal.ejs',       { ...base, active: 'materialen', title: 'Aluminium', m: materials.aluminium }],
  ['werkwijze',    'werkwijze.ejs',       { ...base, active: 'werkwijze', title: 'Werkwijze' }],
  ['montage',      'montage.ejs',         { ...base, active: 'montage', title: 'Montage' }],
  ['faq',          'faq.ejs',             { ...base, active: 'faq', title: 'FAQ' }],
  ['contact',      'contact.ejs',         { ...base, active: 'contact', title: 'Contact' }],
  ['voorwaarden',  'voorwaarden.ejs',     { ...base, title: 'Algemene voorwaarden' }],
  ['privacy',      'privacy.ejs',         { ...base, title: 'Privacybeleid' }],
  ['inloggen',     'auth_login.ejs',      { ...base, title: 'Inloggen', error: null, vals: {} }],
  ['registreren',  'auth_register.ejs',   { ...base, title: 'Account aanmaken', error: null, vals: {} }],
  ['portaal',      'portal_dashboard.ejs',{ ...base, currentUser: sampleUser, user: sampleUser, requests: [sampleReq], STATUS_LABELS, active: 'portaal', title: 'Mijn portaal' }],
  ['portaalreq',   'portal_request.ejs',  { ...base, currentUser: sampleUser, user: sampleUser, r: sampleReq, STATUS_LABELS, active: 'portaal', title: 'Aanvraag' }],
  ['beheer',       'admin_dashboard.ejs', { ...base, currentUser: adminUser, user: adminUser, requests: [sampleReq], STATUS_LABELS, title: 'Beheer' }],
  ['beheerreq',    'admin_request.ejs',   { ...base, currentUser: adminUser, user: adminUser, r: sampleReq, STATUS_LABELS, title: 'Aanvraag (beheer)' }]
];

const innerMain = html => {
  const m = html.match(/<main>([\s\S]*?)<\/main>/);
  return m ? m[1] : html;
};

(async () => {
  // shell (nav + footer) uit de homepagina halen
  const homeHtml = await ejs.renderFile(V('home.ejs'), pages[0][2]);
  const header = (homeHtml.match(/<header class="site">[\s\S]*?<\/header>/) || [''])[0];
  const footer = (homeHtml.match(/<footer class="site">[\s\S]*?<\/footer>/) || [''])[0];

  let sections = '';
  for (const [key, view, locals] of pages) {
    const html = await ejs.renderFile(V(view), locals);
    sections += `\n<div class="demo-page" id="page-${key}" style="display:none">${innerMain(html)}</div>\n`;
  }

  const routeMap = {
    '/': 'home', '/configurator': 'configurator',
    '/kozijnen/kunststof': 'kunststof', '/kozijnen/hout': 'hout', '/kozijnen/aluminium': 'aluminium',
    '/werkwijze': 'werkwijze', '/montage': 'montage', '/veelgestelde-vragen': 'faq', '/contact': 'contact',
    '/algemene-voorwaarden': 'voorwaarden', '/privacybeleid': 'privacy',
    '/inloggen': 'inloggen', '/registreren': 'registreren',
    '/portaal': 'portaal', '/portaal/aanvraag/demo1': 'portaalreq',
    '/beheer': 'beheer', '/beheer/aanvraag/demo1': 'beheerreq'
  };

  const tabs = [
    ['home', 'Home'], ['configurator', 'Configurator'], ['kunststof', 'Kunststof'],
    ['hout', 'Hout'], ['aluminium', 'Aluminium'], ['werkwijze', 'Werkwijze'], ['montage', 'Montage'],
    ['faq', 'FAQ'], ['contact', 'Contact'], ['inloggen', 'Inloggen'],
    ['portaal', 'Mijn portaal'], ['portaalreq', 'Aanvraag (klant)'], ['beheer', 'Beheer'], ['beheerreq', 'Aanvraag (beheer)']
  ];
  const demoBar = `<div class="demo-bar"><strong>DEMO</strong>${tabs.map(t => `<button onclick="showPage('${t[0]}')">${t[1]}</button>`).join('')}</div>`;

  const html = `<!DOCTYPE html>
<html lang="nl"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Demo — bestelkozijnenopmaat.nl</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>${css}
.demo-bar{position:sticky;top:0;z-index:9999;display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#1B1B1A;padding:8px 14px}
.demo-bar strong{color:#C8502D;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;margin-right:6px}
.demo-bar button{background:#2a2a28;color:#f3f1ea;border:1px solid #3a3a37;border-radius:7px;padding:6px 10px;font-size:12px;font-family:'Hanken Grotesk',sans-serif;cursor:pointer}
.demo-bar button:hover{background:#C8502D;border-color:#C8502D}
.demo-note{background:#fff7f3;border-bottom:1px solid #f0d7cc;color:#8E3417;font-size:12.5px;text-align:center;padding:7px 14px}
</style></head><body>
${demoBar}
<div class="demo-note">Klikbare demo. Navigatie werkt; versturen, AI-assistent en downloads zijn hier gesimuleerd. De echte site draait op Node/Express.</div>
${header}
<main>${sections}</main>
${footer}
<script>
// fetch-stub voor demo
(function(){ var _f = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function(url, opts){
    if(typeof url==='string' && url.indexOf('/api/assistant')>=0)
      return Promise.resolve({ json:()=>Promise.resolve({ ok:true, reply:'(Demo) Meet de breedte op 3 hoogtes en de hoogte op 3 breedtes en noteer telkens de kleinste maat. Gaat het om de dagmaat van de muuropening of vervang je een bestaand kozijn?' }) });
    if(typeof url==='string' && url.indexOf('/api/aanvraag')>=0)
      return Promise.resolve({ status:200, json:()=>Promise.resolve({ ok:true, ref:'WEB-26-DEMO', id:'demo1' }) });
    return _f ? _f(url, opts) : Promise.reject('demo');
  };
})();
</script>
<script>${js}</script>
<script>
// router
function showPage(key){
  document.querySelectorAll('.demo-page').forEach(function(p){ p.style.display='none'; });
  var el=document.getElementById('page-'+key);
  if(el){ el.style.display='block'; window.scrollTo(0,0); }
}
var ROUTES=${JSON.stringify(routeMap)};
document.addEventListener('click', function(e){
  var a=e.target.closest && e.target.closest('a'); if(!a) return;
  var href=a.getAttribute('href')||'';
  if(href.indexOf('tel:')===0||href.indexOf('mailto:')===0) return;
  if(ROUTES[href]!==undefined){ e.preventDefault(); showPage(ROUTES[href]); return; }
  if(href.charAt(0)==='/'){ e.preventDefault(); } // onbekende interne link: niet navigeren in demo
});
// demo: aanvraag versturen -> toon portaal
submitAanvraag = function(){
  if(!cart.length){ toast('Voeg eerst een element toe', false); return; }
  cart=[]; saveCart(); renderCart(); closeCart();
  showPage('portaalreq');
  toast('Aanvraag verstuurd — bekijk je portaal (demo)');
};
showPage('home');
</script>
</body></html>`;

  // afbeeldingen uit /public/img inline base64 (zodat de demo zelfstandig blijft)
  let outHtml = html;
  outHtml = outHtml.replace('<script src="/js/herowindow.js" defer></script>', '<script>' + herojs + '</script>');
  const imgDir = path.join(__dirname, 'public/img');
  if (fs.existsSync(imgDir)) {
    for (const f of fs.readdirSync(imgDir)) {
      const ext = path.extname(f).slice(1).toLowerCase();
      const mime = ext === 'jpg' ? 'jpeg' : ext;
      const b64 = fs.readFileSync(path.join(imgDir, f)).toString('base64');
      outHtml = outHtml.split(`/img/${f}`).join(`data:image/${mime};base64,${b64}`);
    }
  }

  fs.writeFileSync(path.join(__dirname, 'demo.html'), outHtml);
  console.log('demo.html geschreven (' + Math.round(outHtml.length / 1024) + ' kB, ' + pages.length + ' paginas)');
})();
