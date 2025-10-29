import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amiko.app',
  appName: 'Amiko App',
  webDir: 'public',
  server: {
    // Production: Vercel 서버
    url: 'https://www.helloamiko.com',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  },
  // Deep linking 설정
  app: {
    // Android Intent URI scheme
    customUrlScheme: 'amiko',
    // iOS Universal Links
    // universalLinks: ['https://www.helloamiko.com']
  }
};

export default config;
