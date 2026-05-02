import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kivo.app',
  appName: 'Kivo',
  webDir: 'out',
  server: {
    url: 'https://ai-life-operator.vercel.app',
    cleartext: false
  }
};

export default config;
