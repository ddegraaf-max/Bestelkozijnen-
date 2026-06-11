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
    const nieuw = req.body.status;
    const before = await db.getRequest(req.params.id);
    // Alleen wijzigen (en mailen) als de status echt verandert.
    if (before && STATUS_LABELS[nieuw] && before.status !== nieuw) {
      const r = await db.setStatus(req.params.id, nieuw);
      if (r && mailer) {
        mailer.notifyStatusUpdate({
          to: r.klant.email, ref: r.ref, statusLabel: STATUS_LABELS[r.status],
          prijs: r.prijs, notitie: r.prijsNotitie
        }).catch(() => {});
      }
    }
    res.redirect('/beheer/aanvraag/' + req.params.id);
  });

  // Prijs (met optionele notitie) vastleggen — zichtbaar voor de klant in het
  // portaal en per e-mail aan de klant gemeld.
  router.post('/aanvraag/:id/prijs', async (req, res) => {
    const raw = String(req.body.prijs || '').replace(',', '.').trim();
    const num = parseFloat(raw);
    const prijs = (raw === '' || !Number.isFinite(num) || num < 0) ? null : Math.round(num * 100) / 100;
    const notitie = String(req.body.notitie || '').trim().slice(0, 500) || null;
    const r = await db.setPrijs(req.params.id, prijs, notitie);
    if (r && mailer) {
      mailer.notifyStatusUpdate({
        to: r.klant.email, ref: r.ref, statusLabel: STATUS_LABELS[r.status],
        prijs: r.prijs, notitie: r.prijsNotitie
      }).catch(() => {});
    }
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
