const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { STATUS_LABELS } = require('./api');

module.exports = function (company) {
  const router = express.Router();

  // alle portaalroutes vereisen login
  router.use((req, res, next) => {
    if (!req.user) return res.redirect('/inloggen');
    next();
  });

  router.get('/', async (req, res) => {
    res.render('portal_dashboard', {
      company, active: 'portaal', title: 'Mijn portaal',
      user: req.user, requests: await db.getRequestsByUser(req.user.id), STATUS_LABELS
    });
  });

  // ---- Accountinstellingen (o.a. tweestapsverificatie aan/uit) ----
  router.get('/account', (req, res) => {
    res.render('portal_account', {
      company, active: 'portaal', title: 'Accountinstellingen',
      user: req.user, melding: req.query.m || null
    });
  });

  // Tweestapsverificatie uitschakelen (vereist de actuele code als bevestiging).
  router.post('/account/2fa-uit', async (req, res) => {
    const { authenticator } = require('otplib');
    const code = String(req.body.code || '').replace(/\s/g, '');
    if (!req.user.totpEnabled) return res.redirect('/portaal/account');
    if (!req.user.totpSecret || !authenticator.verify({ token: code, secret: req.user.totpSecret })) {
      return res.render('portal_account', {
        company, active: 'portaal', title: 'Accountinstellingen',
        user: req.user, melding: null, error: 'Onjuiste of verlopen code. Probeer opnieuw.'
      });
    }
    await db.updateUser(req.user.id, { totpEnabled: false, totpSecret: null });
    res.redirect('/portaal/account?m=2fa-uit');
  });

  router.get('/aanvraag/:id', async (req, res) => {
    const r = await db.getRequest(req.params.id);
    if (!r || r.userId !== req.user.id) return res.status(404).render('404', { company, active: '', title: 'Niet gevonden' });
    res.render('portal_request', { company, active: 'portaal', title: 'Aanvraag ' + r.ref, user: req.user, r, STATUS_LABELS });
  });

  // beveiligde PDF-download (alleen eigenaar)
  router.get('/aanvraag/:id/offerte', async (req, res) => {
    const r = await db.getRequest(req.params.id);
    if (!r || r.userId !== req.user.id || !r.offertePdf) return res.status(404).send('Niet gevonden');
    const file = path.join(db.UPLOAD_DIR, r.offertePdf);
    if (!fs.existsSync(file)) return res.status(404).send('Bestand niet gevonden');
    res.download(file, `offerte-${r.ref}.pdf`);
  });

  return router;
};
