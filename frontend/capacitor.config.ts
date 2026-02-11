import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fyahtrakz.app',
  appName: 'FyahTrakz',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#09090b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#f97316',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      backgroundColor: '#09090b',
      style: 'DARK'
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#09090b'
  },
  android: {
    backgroundColor: '#09090b',
    allowMixedContent: true
  }
};

export default config;
