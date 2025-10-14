import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amiko.app',
  appName: 'Amiko App',
  webDir: 'public',
  server: {
    // Production: Vercel 서버
    url: 'https://www.helloamiko.com',
    cleartext: false
  }
};

export default config;
