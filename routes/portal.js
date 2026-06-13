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

  router.get('/', (req, res) => {
    res.render('portal_dashboard', {
      company, active: 'portaal', title: 'Mijn portaal',
      user: req.user, requests: db.getRequestsByUser(req.user.id), STATUS_LABELS
    });
  });

  router.get('/aanvraag/:id', (req, res) => {
    const r = db.getRequest(req.params.id);
    if (!r || r.userId !== req.user.id) return res.status(404).render('404', { company, active: '', title: 'Niet gevonden' });
    res.render('portal_request', { company, active: 'portaal', title: 'Aanvraag ' + r.ref, user: req.user, r, STATUS_LABELS });
  });

  // beveiligde PDF-download (alleen eigenaar)
  router.get('/aanvraag/:id/offerte', (req, res) => {
    const r = db.getRequest(req.params.id);
    if (!r || r.userId !== req.user.id || !r.offertePdf) return res.status(404).send('Niet gevonden');
    const file = path.join(db.UPLOAD_DIR, r.offertePdf);
    if (!fs.existsSync(file)) return res.status(404).send('Bestand niet gevonden');
    res.download(file, `offerte-${r.ref}.pdf`);
  });

  return router;
};
