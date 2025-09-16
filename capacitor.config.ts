import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.groceryshop.app',
  appName: 'Grocerlytics',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      permissions: ["location"]
    },
    App: {
      launchAutoHide: false
    }
  }
};

export default config;
