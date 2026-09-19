// backend/src/config/index.js - Proje konfigürasyonu
const logger = require('../../utils/logger');

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  ...(process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  'https://www.couplemeeting.com.tr',
  'https://couplemeeting.com.tr',
  'http://localhost:5173',
  'http://localhost:3000'
];

const ADMIN_PASSWORD = process.env.ADMIN_PASS;
if (!ADMIN_PASSWORD) {
  logger.warn('ADMIN_PASS ayarlanmadi! Güvenlik riski! Varsayilan kullaniliyor.');
}
const EFFECTIVE_ADMIN_PASS = ADMIN_PASSWORD || null;
if (!EFFECTIVE_ADMIN_PASS && isProd) {
  logger.error('PRODUCTION modda ADMIN_PASS tanimli degil! Admin paneli calismaz.');
}

const VIP_PLANS = {
  monthly: { price: 29.90, duration: 30 * 24 * 60 * 60 * 1000, label: 'Aylik VIP' },
  yearly: { price: 199.90, duration: 365 * 24 * 60 * 60 * 1000, label: 'Yillik VIP' }
};

let stripe = null;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (STRIPE_KEY && STRIPE_KEY !== 'sk_test_BURAYA_STRIPE_ANAHTARINI_YAZ') {
  try {
    stripe = require('stripe')(STRIPE_KEY);
    logger.info('Stripe entegrasyonu aktif.');
  } catch (e) {
    logger.warn('Stripe yuklenemedi: ' + e.message);
  }
} else {
  logger.warn('Stripe tanimli degil. Test modu.');
}

module.exports = {
  isProd,
  PORT,
  ALLOWED_ORIGINS,
  EFFECTIVE_ADMIN_PASS,
  VIP_PLANS,
  stripe,
  TOKEN_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000,
  TOKEN_MAX_AGE: 7 * 24 * 60 * 60 * 1000,
  ROOM_CLEANUP_INTERVAL: 60 * 1000,
  ROOM_EMPTY_TIMEOUT: 5 * 60 * 1000
};
