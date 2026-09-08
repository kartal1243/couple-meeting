import { Capacitor } from '@capacitor/core';

export const isApp = () => Capacitor.isNativePlatform();
export const isPlatform = (p) => Capacitor.getPlatform() === p;
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isWeb = () => Capacitor.getPlatform() === 'web';
