// backend/src/routes/health.routes.js - Sağlık ve ana durum rotaları
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).send('Couple Meeting Backend Active!');
});

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'couple-meeting-backend',
    time: Date.now(),
    db: 'sqlite'
  });
});

module.exports = router;
