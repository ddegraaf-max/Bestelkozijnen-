const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const db = require('../db');

const ISSUER = 'bestelkozijnenopmaat.nl';
const dest = (u) => (u && u.role === 'beheer' ? '/beheer' : '/portaal');
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

module.exports = function (company, mailer) {
  const router = express.Router();

  // ---------- Registreren ----------
  router.get('/registreren', (req, res) =>
    res.render('auth_register', { company, active: '', title: 'Account aanmaken', error: null, vals: {} }));

  router.post('/registreren', async (req, res) => {
    const { naam, email, telefoon, wachtwoord } = req.body;
    const vals = { naam, email, telefoon };
    const err = (m) => res.render('auth_register', { company, active: '', title: 'Account aanmaken', error: m, vals });
    if (!naam || !email || !wachtwoord) return err('Vul naam, e-mail en wachtwoord in.');
    if (wachtwoord.length < 6) return err('Wachtwoord moet minstens 6 tekens zijn.');
    if (await db.findUserByEmail(email)) return err('Er bestaat al een account met dit e-mailadres.');

    const passwordHash = bcrypt.hashSync(wachtwoord, 10);
    const user = await db.createUser({ naam, email, telefoon, passwordHash });
    req.session.uid = user.id;            // direct ingelogd
    // Tweestapsverificatie is optioneel: alleen naar de instelpagina als de
    // gebruiker daar bij registratie zelf voor kiest, anders meteen het portaal in.
    if (req.body.tweefa) return res.redirect('/2fa/instellen');
    res.redirect(dest(user));
  });

  // ---------- Inloggen (stap 1: wachtwoord) ----------
  router.get('/inloggen', (req, res) =>
    res.render('auth_login', { company, active: '', title: 'Inloggen', error: null, vals: {} }));

  router.post('/inloggen', async (req, res) => {
    const { email, wachtwoord } = req.body;
    const user = await db.findUserByEmail(email || '');
    if (!user || !bcrypt.compareSync(wachtwoord || '', user.passwordHash))
      return res.render('auth_login', { company, active: '', title: 'Inloggen', error: 'Onjuist e-mailadres of wachtwoord.', vals: { email } });

    if (user.totpEnabled) {                // stap 2 vereist
      req.session.uid = null;
      req.session.pending = user.id;
      return res.redirect('/2fa');
    }
    req.session.uid = user.id;             // geen 2FA -> direct inloggen
    res.redirect(dest(user));
  });

  // ---------- Wachtwoord vergeten (stap 1: e-mail invoeren) ----------
  router.get('/wachtwoord-vergeten', (req, res) =>
    res.render('auth_forgot', { company, active: '', title: 'Wachtwoord vergeten', sent: false, error: null }));

  router.post('/wachtwoord-vergeten', async (req, res) => {
    const email = String(req.body.email || '').trim();
    if (!email) return res.render('auth_forgot', { company, active: '', title: 'Wachtwoord vergeten', sent: false, error: 'Vul je e-mailadres in.' });

    const user = await db.findUserByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await db.updateUser(user.id, { resetTokenHash: sha256(token), resetTokenExp: Date.now() + 60 * 60 * 1000 });
      const base = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
      const url = `${base}/wachtwoord-herstellen/${token}`;
      if (mailer) mailer.sendPasswordReset({ to: user.email, naam: user.naam, url }).catch(() => {});
    }
    // Altijd dezelfde bevestiging tonen (verklap niet of een e-mailadres bestaat).
    res.render('auth_forgot', { company, active: '', title: 'Wachtwoord vergeten', sent: true, error: null });
  });

  // ---------- Wachtwoord herstellen (stap 2: nieuw wachtwoord via link) ----------
  router.get('/wachtwoord-herstellen/:token', async (req, res) => {
    const user = await db.findUserByResetToken(sha256(req.params.token));
    res.render('auth_reset', {
      company, active: '', title: 'Nieuw wachtwoord instellen',
      valid: !!user, done: false, error: null, token: req.params.token
    });
  });

  router.post('/wachtwoord-herstellen/:token', async (req, res) => {
    const user = await db.findUserByResetToken(sha256(req.params.token));
    const view = (data) => res.render('auth_reset', { company, active: '', title: 'Nieuw wachtwoord instellen', token: req.params.token, ...data });
    if (!user) return view({ valid: false, done: false, error: null });

    const { wachtwoord, wachtwoord2 } = req.body;
    if (!wachtwoord || wachtwoord.length < 6) return view({ valid: true, done: false, error: 'Wachtwoord moet minstens 6 tekens zijn.' });
    if (wachtwoord !== wachtwoord2) return view({ valid: true, done: false, error: 'De twee wachtwoorden komen niet overeen.' });

    await db.updateUser(user.id, {
      passwordHash: bcrypt.hashSync(wachtwoord, 10),
      resetTokenHash: null, resetTokenExp: null
    });
    view({ valid: true, done: true, error: null });
  });

  // ---------- Inloggen (stap 2: authenticator-code) ----------
  router.get('/2fa', (req, res) => {
    if (!req.session.pending) return res.redirect('/inloggen');
    res.render('auth_2fa_verify', { company, active: '', title: 'Verificatiecode', error: null });
  });

  router.post('/2fa', async (req, res) => {
    const uid = req.session.pending;
    if (!uid) return res.redirect('/inloggen');
    const user = await db.findUserById(uid);
    const code = String(req.body.code || '').replace(/\s/g, '');
    if (!user || !user.totpSecret || !authenticator.verify({ token: code, secret: user.totpSecret }))
      return res.render('auth_2fa_verify', { company, active: '', title: 'Verificatiecode', error: 'Onjuiste of verlopen code. Probeer opnieuw.' });
    req.session.pending = null;
    req.session.uid = user.id;
    res.redirect(dest(user));
  });

  // ---------- 2FA instellen (QR scannen + bevestigen) ----------
  router.get('/2fa/instellen', async (req, res) => {
    const user = req.session.uid ? await db.findUserById(req.session.uid) : null;
    if (!user) return res.redirect('/inloggen');
    if (!req.session.totpTmp) req.session.totpTmp = authenticator.generateSecret();
    const secret = req.session.totpTmp;
    const otpauth = authenticator.keyuri(user.email, ISSUER, secret);
    let qr = '';
    try { qr = await QRCode.toDataURL(otpauth, { margin: 1, width: 220 }); } catch { qr = ''; }
    res.render('auth_2fa_setup', {
      company, active: '', title: 'Tweestapsverificatie instellen',
      error: null, qr, secret, otpauth, reconfig: user.totpEnabled
    });
  });

  router.post('/2fa/instellen', async (req, res) => {
    const user = req.session.uid ? await db.findUserById(req.session.uid) : null;
    if (!user) return res.redirect('/inloggen');
    const secret = req.session.totpTmp;
    const code = String(req.body.code || '').replace(/\s/g, '');
    const otpauth = secret ? authenticator.keyuri(user.email, ISSUER, secret) : '';
    const render = (m) => QRCode.toDataURL(otpauth, { margin: 1, width: 220 })
      .then(qr => res.render('auth_2fa_setup', { company, active: '', title: 'Tweestapsverificatie instellen', error: m, qr, secret, otpauth, reconfig: user.totpEnabled }))
      .catch(() => res.render('auth_2fa_setup', { company, active: '', title: 'Tweestapsverificatie instellen', error: m, qr: '', secret, otpauth, reconfig: user.totpEnabled }));
    if (!secret) return res.redirect('/2fa/instellen');
    if (!authenticator.verify({ token: code, secret })) return render('Onjuiste code. Scan de QR opnieuw en probeer de actuele 6-cijferige code.');
    await db.updateUser(user.id, { totpSecret: secret, totpEnabled: true });
    req.session.totpTmp = null;
    res.redirect(dest(user));
  });

  router.get('/uitloggen', (req, res) => { req.session = null; res.redirect('/'); });

  return router;
};
