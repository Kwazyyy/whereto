import { Capacitor } from "@capacitor/core";

/**
 * Returns true when the app is running inside a Capacitor native shell (iOS/Android).
 * Always false in a regular web browser.
 * Safe to call during SSR — returns false on the server.
 */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform();
}
