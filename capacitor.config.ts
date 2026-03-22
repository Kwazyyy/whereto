import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ca.savrd.app",
  appName: "Savrd",
  webDir: "public",
  server: {
    url: "https://savrd.ca",
    cleartext: false,
  },
  ios: {
    // "never" lets the WebView extend edge-to-edge behind the status bar.
    // Safe-area padding is handled in CSS via env(safe-area-inset-*).
    contentInset: "never",
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#0E1116",
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0E1116",
    },
  },
};

export default config;
