// redis-config.js - Redis Multi-Instance Support
// 
// This module provides Redis adapter for Socket.IO to support
// multiple server instances. Install: npm install @socket.io/redis-adapter redis
//
// Usage in production:
//   1. Start Redis: redis-server
//   2. Set env: REDIS_URL=redis://localhost:6379
//   3. The adapter will automatically be used

let pubClient = null;
let subClient = null;

async function setupRedisAdapter(io) {
  if (!process.env.REDIS_URL) {
    console.log('[Redis] REDIS_URL ayarlanmadi, local mod calisiyor');
    return false;
  }

  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');

    pubClient = createClient({ url: process.env.REDIS_URL });
    subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Redis] Redis adapter baglandi:', process.env.REDIS_URL);
    return true;
  } catch (err) {
    console.error('[Redis] Baglanti hatasi:', err.message);
    return false;
  }
}

function getRedisStatus() {
  return {
    connected: pubClient?.isReady || false,
    url: process.env.REDIS_URL || 'yerel mod'
  };
}

async function disconnectRedis() {
  if (pubClient) await pubClient.quit().catch(() => {});
  if (subClient) await subClient.quit().catch(() => {});
}

module.exports = { setupRedisAdapter, getRedisStatus, disconnectRedis };
