/**
 * Zero-dependency Analytics & Performance Ads Conversion Tracking Utility
 * Safely dispatches events to Google Ads / GA4 (window.gtag),
 * Meta Pixel (window.fbq), and TikTok Pixel (window.ttq) when present.
 */

const GOOGLE_ADS_ID = 'AW-18437444247';

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        send_to: GOOGLE_ADS_ID,
        ...params
      });
    }
  } catch (_) {}

  try {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, params);
    }
  } catch (_) {}

  try {
    if (typeof window.ttq === 'object' && window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track(eventName, params);
    }
  } catch (_) {}
}

export function trackRoomCreated(roomType = 'video', maxUsers = 2) {
  trackEvent('RoomCreated', {
    event_category: 'engagement',
    room_type: roomType,
    max_users: Number(maxUsers) || 2
  });
}

export function trackInviteShared(channel = 'share_button') {
  trackEvent('InviteShared', {
    event_category: 'viral_loop',
    share_channel: channel
  });
}

export function trackVipModalOpened() {
  trackEvent('VipModalOpened', {
    event_category: 'monetization'
  });
}

export function trackAdCtaClicked(sourcePage = 'landing') {
  trackEvent('AdCtaClicked', {
    event_category: 'acquisition',
    source_page: sourcePage
  });
}
