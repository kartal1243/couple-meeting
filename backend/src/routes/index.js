// backend/src/routes/index.js - Tüm REST API rotalarını birleştirici
const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const uploadRoutes = require('./upload.routes');
const vipRoutes = require('./vip.routes');
const profileRoutes = require('./profile.routes');
const adminRoutes = require('./admin.routes');

router.use(healthRoutes);
router.use(uploadRoutes);
router.use(vipRoutes);
router.use(profileRoutes);
router.use(adminRoutes);

module.exports = router;
