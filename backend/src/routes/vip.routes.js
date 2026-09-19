// backend/src/routes/vip.routes.js - VIP ve ödeme rotaları
const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const db = require('../../utils/database');
const { VIP_PLANS, stripe } = require('../config');
const { getVipLevel, isValidUsername } = require('../utils/helpers');
const { emitToUser, broadcastOnlineStatus } = require('../services/state');

// Stripe Webhook
router.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(200).send('Stripe pasif');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === 'whsec_BURAYA_WEBHOOK_SECRET_YAZ') {
    return res.status(200).send('Webhook secret yok');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook imza hatasi', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { username, plan } = session.metadata || {};
    const user = db.getUser(username);
    if (user && VIP_PLANS[plan]) {
      const now = Date.now();
      const startFrom = (user.vipExpiry || 0) > now ? user.vipExpiry : now;
      db.updateUser(username, {
        is_vip: 1,
        vip_expiry: startFrom + VIP_PLANS[plan].duration,
        vip_plan: plan,
        vip_activated_at: now,
        vip_level: 1,
        stripe_customer_id: session.customer || '',
        stripe_subscription_id: session.subscription || ''
      });
      logger.info(`[STRIPE] VIP aktif: ${username} (${VIP_PLANS[plan].label})`);
      emitToUser(username, 'vip_activated', { isVip: true, vipExpiry: startFrom + VIP_PLANS[plan].duration, plan });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const allUsers = db.getDb().prepare('SELECT username FROM users WHERE stripe_subscription_id = ?').all(sub.id);
    for (const u of allUsers) {
      db.updateUser(u.username, { is_vip: 0, vip_expiry: Date.now() });
      logger.info(`[STRIPE] VIP iptal: ${u.username}`);
      emitToUser(u.username, 'vip_activated', { isVip: false, vipExpiry: Date.now(), plan: null });
    }
  }

  res.status(200).json({ received: true });
});

// Checkout oluştur
router.post('/api/vip/create-checkout', async (req, res) => {
  const { token, plan } = req.body;
  if (!token || !plan || !VIP_PLANS[plan]) return res.json({ ok: false, message: 'Gecersiz plan.' });
  const user = db.getUserByToken(token);
  if (!user) return res.json({ ok: false, message: 'Giris yapmalisin.' });

  if (process.env.VIP_MAINTENANCE === '1') {
    return res.json({ ok: false, message: 'VIP sistemi su an bakimda. Lutfen daha sonra tekrar deneyin.' });
  }

  if (!stripe) {
    const duration = VIP_PLANS[plan].duration;
    const currentExpiry = user.vip_expiry || 0;
    const newExpiry = Math.max(currentExpiry, Date.now()) + duration;
    db.getDb().prepare('UPDATE users SET is_vip = 1, vip_expiry = ?, vip_plan = ?, vip_activated_at = ?, vip_level = ? WHERE username = ?')
      .run(newExpiry, plan, Date.now(), getVipLevel(Date.now()), user.username);
    
    emitToUser(user.username, 'vip_activated', { isVip: true, vipExpiry: newExpiry, plan });
    logger.info('VIP test mode aktif', { username: user.username, plan, expiry: new Date(newExpiry).toISOString() });
    return res.json({ ok: true, testMode: true, vipExpiry: newExpiry });
  }

  try {
    const priceId = plan === 'monthly' ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'https://couple-meeting-flax.vercel.app'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://couple-meeting-flax.vercel.app'}/payment-cancel`,
      metadata: { username: user.username, plan }
    });
    res.json({ ok: true, sessionId: session.id, url: session.url });
  } catch (err) {
    logger.error('Stripe checkout hatasi', { error: err.message });
    res.json({ ok: false, message: 'Odeme baslatilamadi.' });
  }
});

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

// Admin VIP verme
router.post('/api/vip/admin-grant', (req, res) => {
  if (process.env.VIP_MAINTENANCE === '1') {
    return res.status(503).json({ ok: false, message: 'VIP sistemi su an bakimda.' });
  }
  const { secret, username, plan } = req.body;
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(403).json({ ok: false, message: 'Yetkisiz erisim.' });
  }
  if (!username || !isValidUsername(username) || !VIP_PLANS[plan || 'yearly']) {
    return res.json({ ok: false, message: 'Gecersiz parametre.' });
  }
  const user = db.getUser(username);
  if (!user) return res.json({ ok: false, message: 'Kullanici bulunamadi.' });

  const now = Date.now();
  const startFrom = (user.vipExpiry || 0) > now ? user.vipExpiry : now;
  const newExpiry = startFrom + VIP_PLANS[plan || 'yearly'].duration;
  db.updateUser(username, {
    is_vip: 1,
    vip_expiry: newExpiry,
    vip_plan: plan || 'yearly',
    vip_activated_at: now,
    vip_level: getVipLevel(now)
  });
  logger.info(`[ADMIN] VIP verildi: ${username} (${VIP_PLANS[plan || 'yearly'].label})`);
  emitToUser(username, 'vip_activated', { isVip: true, vipExpiry: newExpiry, plan: plan || 'yearly' });
  res.json({ ok: true, message: `${username} VIP aktif!`, vipExpiry: newExpiry });
});

// VIP Görünmez Mod Aç/Kapat
router.post('/api/vip/toggle-invisible', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ ok: false });
  const user = db.getUserByToken(token);
  if (!user) return res.status(401).json({ ok: false });
  if (!user.isVip) return res.status(403).json({ ok: false, message: 'VIP uyelik gerekiyor.' });
  const newMode = !user.invisibleMode;
  db.updateUser(user.username, { invisible_mode: newMode });
  broadcastOnlineStatus(user.username);
  res.json({ ok: true, invisibleMode: newMode });
});

module.exports = router;
