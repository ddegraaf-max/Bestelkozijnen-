const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { STATUS_LABELS } = require('./api');

module.exports = function (company, mailer) {
  const router = express.Router();

  // alleen beheerders
  router.use((req, res, next) => {
    if (!req.user) return res.redirect('/inloggen');
    if (req.user.role !== 'beheer') return res.status(403).render('404', { company, active: '', title: 'Geen toegang' });
    next();
  });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, db.UPLOAD_DIR),
      filename: (req, file, cb) => cb(null, `${req.params.id}-${Date.now()}.pdf`)
    }),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf')
  });

  router.get('/', async (req, res) => {
    res.render('admin_dashboard', { company, active: '', title: 'Beheer', user: req.user, requests: await db.allRequests(), STATUS_LABELS });
  });

  router.get('/aanvraag/:id', async (req, res) => {
    const r = await db.getRequest(req.params.id);
    if (!r) return res.status(404).render('404', { company, active: '', title: 'Niet gevonden' });
    res.render('admin_request', { company, active: '', title: 'Aanvraag ' + r.ref, user: req.user, r, STATUS_LABELS });
  });

  router.post('/aanvraag/:id/status', async (req, res) => {
    await db.setStatus(req.params.id, req.body.status);
    res.redirect('/beheer/aanvraag/' + req.params.id);
  });

  router.post('/aanvraag/:id/offerte', upload.single('offerte'), async (req, res) => {
    if (req.file) {
      const r = await db.setOffertePdf(req.params.id, req.file.filename);
      if (r && mailer) mailer.notifyOfferteReady({ to: r.klant.email, ref: r.ref }).catch(() => {});
    }
    res.redirect('/beheer/aanvraag/' + req.params.id);
  });

  return router;
};
