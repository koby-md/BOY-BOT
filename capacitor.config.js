import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.company.Kobi',
  appName: 'Kobi',
  webDir: 'www',
  plugins: {
    LiveUpdates: {
      appId: '042a1261',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 2
    }
  }
};

export default config;