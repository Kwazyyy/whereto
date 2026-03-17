// Extends the Window interface with Capacitor's global, which is injected
// by the native WebView before any JS runs.
interface Window {
  Capacitor?: {
    isNativePlatform: () => boolean;
    getPlatform: () => string;
  };
}
