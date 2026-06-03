const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const db = require('../db');

const ISSUER = 'bestelkozijnenopmaat.nl';
const dest = (u) => (u && u.role === 'beheer' ? '/beheer' : '/portaal');

module.exports = function (company) {
  const router = express.Router();

  // ---------- Registreren ----------
  router.get('/registreren', (req, res) =>
    res.render('auth_register', { company, active: '', title: 'Account aanmaken', error: null, vals: {} }));

  router.post('/registreren', (req, res) => {
    const { naam, email, telefoon, wachtwoord } = req.body;
    const vals = { naam, email, telefoon };
    const err = (m) => res.render('auth_register', { company, active: '', title: 'Account aanmaken', error: m, vals });
    if (!naam || !email || !wachtwoord) return err('Vul naam, e-mail en wachtwoord in.');
    if (wachtwoord.length < 6) return err('Wachtwoord moet minstens 6 tekens zijn.');
    if (db.findUserByEmail(email)) return err('Er bestaat al een account met dit e-mailadres.');

    const passwordHash = bcrypt.hashSync(wachtwoord, 10);
    const user = db.createUser({ naam, email, telefoon, passwordHash });
    req.session.uid = user.id;            // ingelogd, maar 2FA nog niet ingesteld
    res.redirect('/2fa/instellen');
  });

  // ---------- Inloggen (stap 1: wachtwoord) ----------
  router.get('/inloggen', (req, res) =>
    res.render('auth_login', { company, active: '', title: 'Inloggen', error: null, vals: {} }));

  router.post('/inloggen', (req, res) => {
    const { email, wachtwoord } = req.body;
    const user = db.findUserByEmail(email || '');
    if (!user || !bcrypt.compareSync(wachtwoord || '', user.passwordHash))
      return res.render('auth_login', { company, active: '', title: 'Inloggen', error: 'Onjuist e-mailadres of wachtwoord.', vals: { email } });

    if (user.totpEnabled) {                // stap 2 vereist
      req.session.uid = null;
      req.session.pending = user.id;
      return res.redirect('/2fa');
    }
    req.session.uid = user.id;             // nog geen 2FA -> verplicht instellen
    res.redirect('/2fa/instellen');
  });

  // ---------- Inloggen (stap 2: authenticator-code) ----------
  router.get('/2fa', (req, res) => {
    if (!req.session.pending) return res.redirect('/inloggen');
    res.render('auth_2fa_verify', { company, active: '', title: 'Verificatiecode', error: null });
  });

  router.post('/2fa', (req, res) => {
    const uid = req.session.pending;
    if (!uid) return res.redirect('/inloggen');
    const user = db.findUserById(uid);
    const code = String(req.body.code || '').replace(/\s/g, '');
    if (!user || !user.totpSecret || !authenticator.verify({ token: code, secret: user.totpSecret }))
      return res.render('auth_2fa_verify', { company, active: '', title: 'Verificatiecode', error: 'Onjuiste of verlopen code. Probeer opnieuw.' });
    req.session.pending = null;
    req.session.uid = user.id;
    res.redirect(dest(user));
  });

  // ---------- 2FA instellen (QR scannen + bevestigen) ----------
  router.get('/2fa/instellen', async (req, res) => {
    const user = req.session.uid ? db.findUserById(req.session.uid) : null;
    if (!user) return res.redirect('/inloggen');
    if (!req.session.totpTmp) req.session.totpTmp = authenticator.generateSecret();
    const secret = req.session.totpTmp;
    const otpauth = authenticator.keyuri(user.email, ISSUER, secret);
    let qr = '';
    try { qr = await QRCode.toDataURL(otpauth, { margin: 1, width: 220 }); } catch { qr = ''; }
    res.render('auth_2fa_setup', {
      company, active: '', title: 'Tweestapsverificatie instellen',
      error: null, qr, secret, reconfig: user.totpEnabled
    });
  });

  router.post('/2fa/instellen', (req, res) => {
    const user = req.session.uid ? db.findUserById(req.session.uid) : null;
    if (!user) return res.redirect('/inloggen');
    const secret = req.session.totpTmp;
    const code = String(req.body.code || '').replace(/\s/g, '');
    const render = (m) => QRCode.toDataURL(authenticator.keyuri(user.email, ISSUER, secret), { margin: 1, width: 220 })
      .then(qr => res.render('auth_2fa_setup', { company, active: '', title: 'Tweestapsverificatie instellen', error: m, qr, secret, reconfig: user.totpEnabled }))
      .catch(() => res.render('auth_2fa_setup', { company, active: '', title: 'Tweestapsverificatie instellen', error: m, qr: '', secret, reconfig: user.totpEnabled }));
    if (!secret) return res.redirect('/2fa/instellen');
    if (!authenticator.verify({ token: code, secret })) return render('Onjuiste code. Scan de QR opnieuw en probeer de actuele 6-cijferige code.');
    db.updateUser(user.id, { totpSecret: secret, totpEnabled: true });
    req.session.totpTmp = null;
    res.redirect(dest(user));
  });

  router.get('/uitloggen', (req, res) => { req.session = null; res.redirect('/'); });

  return router;
};
