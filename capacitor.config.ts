import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amiko.app',
  appName: 'Amiko App',
  webDir: 'public',
  // Server config: allow overriding with CAPACITOR_SERVER_URL environment variable
  // Example for physical device dev testing: export CAPACITOR_SERVER_URL="http://192.168.1.100:3000"
  server: {
    url: 'https://www.helloamiko.com',
    // If URL is http (not https), enable cleartext so Android can load it
    // cleartext: (process.env.CAPACITOR_SERVER_URL || '').startsWith('http://') || false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '392429655544-gkro4u100tsilt2seoqdrs1oadcvnv9g.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
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
