import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.groceryshop.app',
  appName: 'Grocerlytics',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      permissions: ["location"]
    },
    App: {
      launchAutoHide: false
    },
    Browser: {
      windowName: '_blank',
      toolbarColor: '#2d6b6b',
      showTitle: true,
      showUrl: false
    },
    // Improve WebView handling
    WebView: {
      allowMixedContent: true
    }
  },
  // Add better OAuth handling
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
