"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

/**
 * Thin redirect page used by the Capacitor iOS in-app browser.
 *
 * Browser.open() can only do GET requests, so we can't hit
 * /api/auth/signin/google directly (it requires a CSRF-token POST).
 * Instead, we open this page in SFSafariViewController. It immediately calls
 * signIn("google"), which fetches the CSRF token and POSTs to NextAuth — all
 * from within the browser context where cookies/CSRF are available.
 * NextAuth then redirects to Google, the user consents, and Google redirects
 * back to /api/auth/callback/google → /auth/callback?native=1.
 */
export default function GoogleRedirectPage() {
  useEffect(() => {
    signIn("google", { callbackUrl: "/api/mobile-token/generate" });
  }, []);

  return (
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
      <p className="text-white/50 text-sm font-medium">Connecting to Google…</p>
    </div>
  );
}
