export const isApp = () => {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;
  } catch {}
  // Test modu: ?mobile=1 ile mobil ozellikleri aktif et
  if (new URLSearchParams(window.location.search).get('mobile') === '1') return true;
  // Mobil ekranda da aktif et
  if (window.innerWidth <= 768) return true;
  return false;
};
export const isPlatform = (p) => {
  try { return window.Capacitor?.getPlatform?.() === p; } catch { return false; }
};
export const isAndroid = () => isPlatform('android');
export const isIOS = () => isPlatform('ios');
export const isWeb = () => !isApp();
