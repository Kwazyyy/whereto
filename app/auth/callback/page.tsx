"use client";

import { useEffect, useState } from "react";

/**
 * Post-OAuth landing page.
 *
 * Web: NextAuth has set the session cookie — redirect to Discover.
 *
 * Capacitor iOS (native=1): This page runs in SFSafariViewController. 
 * It POSTs to /api/mobile-token to generate a short-lived token using its session.
 * Then it redirects to savrd://auth-done to dismiss the SFSafariViewController.
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Completing sign in...");

  useEffect(() => {
    const isNative = new URLSearchParams(window.location.search).get("native") === "1";

    if (!isNative) {
      window.location.href = "/";
      return;
    }

    async function exchangeToken() {
      try {
        const res = await fetch("/api/mobile-token", { method: "POST" });
        if (res.ok) {
          setStatus("Signed in successfully!");
          // Try to auto-redirect. If blocked by iOS, they can use the UI.
          window.location.href = "savrd://auth-done";
        } else {
          setStatus("Sign in failed. Please try again.");
        }
      } catch (err) {
        console.error("Token exchange failed:", err);
        setStatus("Sign in failed. Please try again.");
      }
    }

    exchangeToken();
  }, []);

  return (
    <div className="min-h-screen bg-[#0E1116] flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-full bg-[#E85D2A]/15 flex items-center justify-center transform transition-transform duration-500 animate-pulse">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E85D2A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="text-white font-semibold text-lg">{status}</p>
      
      {status === "Signed in successfully!" && (
        <div className="flex flex-col items-center gap-6 mt-2">
          <p className="text-[#8B949E] text-sm text-center max-w-xs px-4">
            You can now safely tap the <strong className="text-white">&quot;X&quot;</strong> in the top-left corner to return to the app.
          </p>
          <button
            onClick={() => {
              window.location.href = "savrd://auth-done";
            }}
            className="px-6 py-3 bg-[#E85D2A] hover:bg-[#D14E1F] text-white rounded-xl font-semibold text-sm transition-colors duration-200"
          >
            Return to App
          </button>
        </div>
      )}
    </div>
  );
}
