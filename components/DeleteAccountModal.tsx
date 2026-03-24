"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { isNativePlatform } from "@/lib/is-native";

export default function DeleteAccountModal({ onClose, userEmail }: { onClose: () => void, userEmail?: string | null }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isConfirmed = confirmText === "DELETE";

  async function handleDelete() {
    if (!isConfirmed) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      if (res.ok) {
        await signOut({ callbackUrl: isNativePlatform() ? "/welcome" : "/landing" });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete account");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#161B22] rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-red-600 dark:text-red-500">Delete Account?</h3>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer disabled:opacity-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-[#0E1116] dark:text-[#e8edf4] text-sm leading-relaxed">
            This will permanently delete your account, all saved places, boards, friends, photos, and activity. This action cannot be undone.
          </p>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Type <span className="font-bold text-[#0E1116] dark:text-white">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={loading}
              className="w-full bg-white dark:bg-[#0E1116] border border-[#D0D7DE] dark:border-[#30363D] rounded-lg px-4 py-3 text-sm text-[#0E1116] dark:text-white placeholder-[#656D76] dark:placeholder-[#8B949E] focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-colors duration-200 disabled:opacity-50"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-[#0E1116] dark:text-gray-200 font-bold rounded-2xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmed || loading}
              className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
