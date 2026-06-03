const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT = '/mnt/user-data/outputs/preview';
fs.mkdirSync(OUT, { recursive: true });

const css = {
  '/css/style.css': fs.readFileSync(path.join(__dirname, 'public/css/style.css'), 'utf8'),
  '/css/configurator.css': fs.readFileSync(path.join(__dirname, 'public/css/configurator.css'), 'utf8')
};
const js = {
  '/js/configurator.js': fs.readFileSync(path.join(__dirname, 'public/js/configurator.js'), 'utf8')
};

// route -> preview-bestandsnaam
const routes = {
  '/': 'home.html',
  '/configurator': 'configurator.html',
  '/kozijnen/kunststof': 'kunststof.html',
  '/kozijnen/hout': 'hout.html',
  '/kozijnen/aluminium': 'aluminium.html',
  '/werkwijze': 'werkwijze.html',
  '/veelgestelde-vragen': 'faq.html',
  '/offerte': 'offerte.html',
  '/contact': 'contact.html',
  '/algemene-voorwaarden': 'voorwaarden.html',
  '/privacybeleid': 'privacy.html'
};

function inline(html) {
  // CSS inline
  for (const [href, content] of Object.entries(css)) {
    html = html.split(`<link rel="stylesheet" href="${href}">`).join(`<style>\n${content}\n</style>`);
  }
  // JS inline
  for (const [src, content] of Object.entries(js)) {
    html = html.split(`<script src="${src}"></script>`).join(`<script>\n${content}\n</script>`);
  }
  // interne links omzetten naar lokale bestandsnamen (langste eerst)
  const keys = Object.keys(routes).sort((a, b) => b.length - a.length);
  for (const r of keys) {
    if (r === '/') continue;
    html = html.split(`href="${r}"`).join(`href="${routes[r]}"`);
  }
  html = html.split(`href="/"`).join(`href="home.html"`);
  return html;
}

function fetchPage(route) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${route}`, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

(async () => {
  for (const [route, file] of Object.entries(routes)) {
    const html = inline(await fetchPage(route));
    fs.writeFileSync(path.join(OUT, file), html);
    console.log('✓', file);
  }
  console.log('Preview klaar in', OUT);
})();
