// backend/src/app.js - Express uygulama yapılandırması
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { ALLOWED_ORIGINS } = require('./config');
const { uploadsDir } = require('./middlewares/upload.middleware');
const routes = require('./routes');

const app = express();

app.set('trust proxy', 1);

// Güvenlik & Sıkıştırma
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// CORS
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true
  })
);

// JSON Gövde Ayrıştırıcı (Webhook hariç router içinde halledilir)
app.use(express.json({ limit: '1mb' }));

// Global Hız Sınırlayıcıları
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { ok: false, message: 'Çok fazla istek.' },
  validate: { xForwardedForHeader: false }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, message: 'Çok fazla deneme.' },
  validate: { xForwardedForHeader: false }
});

app.use('/api/', apiLimiter);
app.use('/api/vip/create-checkout', authLimiter);
app.use('/api/vip/admin-grant', authLimiter);

// Statik Dosyalar (Yüklemeler)
app.use('/uploads', express.static(uploadsDir));

// Ana Rotalar
app.use(routes);

module.exports = app;
