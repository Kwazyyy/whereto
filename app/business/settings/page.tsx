"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Claim {
  id: string;
  googlePlaceId: string;
  businessName: string;
  status: string;
  createdAt: string;
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function SettingsSkeleton() {
  return (
    <div className="max-w-3xl space-y-8 mt-8">
      <div className="bg-[#161B22] rounded-xl p-6 border border-white/5 animate-pulse">
        <div className="h-5 w-24 bg-white/10 rounded mb-6" />
        <div className="space-y-4">
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-3/4 bg-white/10 rounded" />
        </div>
      </div>
      <div className="bg-[#161B22] rounded-xl p-6 border border-white/5 animate-pulse">
        <div className="h-5 w-40 bg-white/10 rounded mb-6" />
        <div className="h-16 w-full bg-white/10 rounded" />
      </div>
    </div>
  );
}

/* ─── Password Change Form ───────────────────────────────────── */
function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/business/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Failed to update password");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-3 text-sm">
          Password updated successfully
        </div>
      )}

      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm text-gray-400 mb-1"
        >
          Current Password
        </label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="bg-[#0E1116] border border-[#30363D] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B949E] w-full focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm text-gray-400 mb-1"
        >
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          className="bg-[#0E1116] border border-[#30363D] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B949E] w-full focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
        />
        {passwordTooShort && (
          <p className="text-red-400 text-xs mt-1">
            Password must be at least 8 characters
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmNewPassword"
          className="block text-sm text-gray-400 mb-1"
        >
          Confirm New Password
        </label>
        <input
          id="confirmNewPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-[#0E1116] border border-[#30363D] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B949E] w-full focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
        />
        {passwordsMismatch && (
          <p className="text-red-400 text-xs mt-1">
            Passwords don&apos;t match
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="bg-[#E85D2A] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#d4522a] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

/* ─── Delete Confirmation Modal ──────────────────────────────── */
function DeleteModal({ onClose }: { onClose: () => void }) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-white">
          Are you sure?
        </h3>
        <p className="text-gray-400 text-sm mt-2">
          This action cannot be undone. This will permanently delete your
          business account and all associated claims.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Type{" "}
          <span className="text-red-400 font-mono font-medium">DELETE</span>{" "}
          to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE"
          className="bg-[#0E1116] border border-[#30363D] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B949E] w-full focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-colors duration-200 mt-3"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border border-white/10 text-gray-300 text-sm py-2.5 rounded-lg hover:border-white/20 transition"
          >
            Cancel
          </button>
          <button
            disabled={confirmText !== "DELETE"}
            className="flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: session } = useSession();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch("/api/business/claim");
      if (!res.ok) return;
      const data = (await res.json()) as { claims: Claim[] };
      setClaims(data.claims);
    } catch {
      // silently fail — claims section will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  if (loading || !session?.user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">
          Manage your account and business claims
        </p>
        <SettingsSkeleton />
      </div>
    );
  }

  const user = session.user;
  const joinedDate = user.id
    ? new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="text-gray-400 mt-1">
        Manage your account and business claims
      </p>

      <div className="max-w-3xl space-y-8 mt-8">
        {/* ── Section 1: Account ──────────────────────────────── */}
        <div className="bg-[#161B22] rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Account</h2>

          <div>
            {/* Name */}
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-gray-400">Name</span>
              <span className="text-sm text-white">
                {user.name || "—"}
              </span>
            </div>

            {/* Email */}
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-gray-400">Email</span>
              <span className="text-sm text-white">{user.email}</span>
            </div>

            {/* Role */}
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-gray-400">Role</span>
              <span className="bg-[#E85D2A]/10 text-[#E85D2A] text-xs px-2 py-1 rounded-full">
                Business
              </span>
            </div>

            {/* Joined */}
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-400">Joined</span>
              <span className="text-sm text-white">{joinedDate}</span>
            </div>
          </div>

          {/* Change Password toggle */}
          <button
            onClick={() => setShowPasswordForm((v) => !v)}
            className="text-sm text-[#E85D2A] hover:underline cursor-pointer mt-4"
          >
            {showPasswordForm ? "Cancel" : "Change Password"}
          </button>

          {showPasswordForm && <PasswordChangeForm />}
        </div>

        {/* ── Section 2: Business Claims ─────────────────────── */}
        <div className="bg-[#161B22] rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Your Business Claims
          </h2>

          {claims.length === 0 ? (
            <div>
              <p className="text-gray-400 text-sm">
                You haven&apos;t claimed any businesses yet.
              </p>
              <Link
                href="/business/claim"
                className="text-[#E85D2A] text-sm hover:underline mt-2 inline-block"
              >
                Claim Your Business
              </Link>
            </div>
          ) : (
            <div>
              {claims.map((claim) => {
                const date = new Date(claim.createdAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                );

                let statusBadge: React.ReactNode;
                if (claim.status === "approved") {
                  statusBadge = (
                    <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full">
                      Approved
                    </span>
                  );
                } else if (claim.status === "rejected") {
                  statusBadge = (
                    <span className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-full">
                      Rejected
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded-full">
                      Pending Review
                    </span>
                  );
                }

                return (
                  <div
                    key={claim.id}
                    className="flex items-center gap-4 py-4 border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {claim.businessName}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Claimed {date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {statusBadge}
                      {claim.status === "approved" ? (
                        <Link
                          href="/business/dashboard"
                          className="text-[#E85D2A] text-sm hover:underline"
                        >
                          View Dashboard
                        </Link>
                      ) : claim.status === "pending" ? (
                        <span className="text-gray-500 text-sm">
                          Under Review
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 3: Danger Zone ─────────────────────────── */}
        <div className="bg-[#161B22] rounded-xl p-6 border border-red-500/20">
          <h2 className="text-lg font-semibold text-red-400 mb-4">
            Danger Zone
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white font-medium">Delete Account</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Permanently delete your business account and all claims
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-transparent border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg hover:bg-red-500/10 transition shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}
