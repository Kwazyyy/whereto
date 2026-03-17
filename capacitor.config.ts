import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.savrd.app",
  appName: "Savrd",
  webDir: "public",
  server: {
    // Development: loads the local Next.js dev server with live reload.
    // For production builds, remove this url field so the app uses the
    // bundled assets, or set it to your deployed Vercel URL.
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
    },
  },
};

export default config;
