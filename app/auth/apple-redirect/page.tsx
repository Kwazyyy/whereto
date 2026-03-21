"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

/**
 * Thin redirect page used by the Capacitor iOS in-app browser.
 * 
 * Similar to google-redirect, this page immediately triggers signIn("apple")
 * to initiate the SFSafariViewController OAuth flow and correctly set the
 * mobile-token callback.
 */
export default function AppleRedirectPage() {
  useEffect(() => {
    signIn("apple", { callbackUrl: "/api/mobile-token/generate" });
  }, []);

  return (
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
      <p className="text-white/50 text-sm font-medium">Connecting to Apple…</p>
    </div>
  );
}
