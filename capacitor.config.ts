import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ca.savrd.app",
  appName: "Savrd",
  webDir: "public",
  server: {
    // Development: loads the local Next.js dev server with live reload.
    // For production: remove this url block (app uses bundled assets) or set
    // url to "https://savrd.ca" so OAuth cookies are on the same domain as
    // the SFSafariViewController session.
    url: "http://localhost:3000",
    cleartext: true,
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
