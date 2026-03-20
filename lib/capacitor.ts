import { Capacitor } from "@capacitor/core";

/**
 * Returns true when running inside a Capacitor native shell (iOS/Android).
 * Safe to call during SSR — returns false on the server.
 */
export function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform();
}

/**
 * The base URL to use for constructing OAuth URLs in native builds.
 * In Capacitor, window.location.origin may be capacitor://localhost, so we
 * fall back to NEXT_PUBLIC_NEXTAUTH_URL (set to https://savrd.ca in production).
 */
export function getAuthBaseUrl(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // Capacitor dev server proxies through localhost:3000
    if (origin.startsWith("http://localhost") || origin.startsWith("https://")) {
      return origin;
    }
  }
  return process.env.NEXT_PUBLIC_NEXTAUTH_URL ?? "https://savrd.ca";
}
