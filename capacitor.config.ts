import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amiko.app',
  appName: 'Amiko App',
  webDir: 'public',
  server: {
    // 개발 중에는 로컬 서버를 가리킴
    url: 'http://172.30.1.79:3000',
    cleartext: true
  }
};

export default config;
