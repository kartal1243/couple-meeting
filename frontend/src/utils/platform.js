export const isApp = () => {
  try { return window.Capacitor?.isNativePlatform?.() || false; } catch { return false; }
};
export const isPlatform = (p) => {
  try { return window.Capacitor?.getPlatform?.() === p; } catch { return false; }
};
export const isAndroid = () => isPlatform('android');
export const isIOS = () => isPlatform('ios');
export const isWeb = () => !isApp();
