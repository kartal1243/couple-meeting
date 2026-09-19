// backend/src/services/youtube.service.js - YouTube ve müzik arama servisi
const logger = require('../../utils/logger');

let Innertube, UniversalCache;
try {
  ({ Innertube, UniversalCache } = require('youtubei.js'));
  logger.info('youtubei.js yuklendi');
} catch (e) {
  logger.warn('youtubei.js yuklenemedi: ' + e.message);
}

let innertube = null;
async function getInnertube() {
  if (!innertube && Innertube) {
    innertube = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      retrieve_player: true,
      fetch: fetch.bind(globalThis)
    });
  }
  return innertube;
}

module.exports = {
  getInnertube
};
