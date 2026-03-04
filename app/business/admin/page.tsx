"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ClaimUser {
  name: string | null;
  email: string;
}

interface AdminClaim {
  id: string;
  businessName: string;
  googlePlaceId: string;
  businessEmail: string;
  businessPhone: string | null;
  ownerRole: string;
  status: string;
  createdAt: string;
  user: ClaimUser;
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

/* ─── Admin Sub Nav ──────────────────────────────────────────── */
function AdminSubNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/business/admin", label: "Claims" },
    { href: "/business/admin/analytics", label: "Analytics" },
    { href: "/business/admin/photos", label: "Photos" },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/business/admin"
            ? pathname === "/business/admin"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              isActive
                ? "bg-[#E85D2A] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function ClaimSkeleton() {
  return (
    <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 mb-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-white/10 rounded" />
          <div className="h-3 w-64 bg-white/10 rounded" />
          <div className="h-3 w-40 bg-white/10 rounded" />
        </div>
        <div className="h-6 w-20 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function AdminPage() {
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<"approved" | "rejected" | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/business/admin/claims");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as { claims: AdminClaim[] };
      setClaims(data.claims);
    } catch {
      setError("Failed to load claims. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  async function handleAction(claimId: string, status: "approved" | "rejected") {
    setActionLoading(claimId);
    try {
      const res = await fetch("/api/business/admin/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, status }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Failed to update claim");
        return;
      }

      // Optimistic update
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status } : c))
      );

      // Flash effect
      setFlashId(claimId);
      setFlashType(status);
      setTimeout(() => {
        setFlashId(null);
        setFlashType(null);
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const filteredClaims =
    filter === "all"
      ? claims
      : claims.filter((c) => c.status === filter);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  return (
    <div>
      <AdminSubNav />

      <h1 className="text-2xl font-bold text-white">
        Admin — Claim Management
      </h1>
      <p className="text-gray-400 mt-1">Review and manage business claims</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === tab.key
                ? "bg-[#E85D2A] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
            {tab.key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mt-4">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Claims list */}
      <div className="mt-6">
        {loading && (
          <>
            <ClaimSkeleton />
            <ClaimSkeleton />
            <ClaimSkeleton />
          </>
        )}

        {!loading && filteredClaims.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            No {filter === "all" ? "" : filter} claims found.
          </p>
        )}

        {!loading &&
          filteredClaims.map((claim) => {
            const date = new Date(claim.createdAt).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }
            );

            let statusBadge: React.ReactNode;
            if (claim.status === "approved") {
              statusBadge = (
                <span className="bg-green-500/10 text-green-400 text-xs px-2.5 py-1 rounded-full border border-green-500/20">
                  Approved
                </span>
              );
            } else if (claim.status === "rejected") {
              statusBadge = (
                <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full border border-red-500/20">
                  Rejected
                </span>
              );
            } else {
              statusBadge = (
                <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2.5 py-1 rounded-full border border-yellow-500/20">
                  Pending
                </span>
              );
            }

            const isFlashing = flashId === claim.id;
            const flashBorder =
              isFlashing && flashType === "approved"
                ? "border-green-500/40"
                : isFlashing && flashType === "rejected"
                  ? "border-red-500/40"
                  : "border-white/5";

            return (
              <div
                key={claim.id}
                className={`bg-[#161B22] rounded-xl p-5 border mb-3 transition-colors duration-500 ${flashBorder}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side — details */}
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">
                      {claim.businessName}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Claimed by:{" "}
                      <span className="text-gray-300">
                        {claim.user.name || "—"}
                      </span>{" "}
                      · {claim.user.email}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Role: {claim.ownerRole}
                    </p>
                    <p className="text-sm text-gray-500">
                      Business email: {claim.businessEmail}
                    </p>
                    {claim.businessPhone && (
                      <p className="text-sm text-gray-500">
                        Phone: {claim.businessPhone}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      Claimed on {date}
                    </p>
                  </div>

                  {/* Right side — status + actions */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {statusBadge}

                    {claim.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(claim.id, "approved")}
                          disabled={actionLoading === claim.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {actionLoading === claim.id
                            ? "..."
                            : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(claim.id, "rejected")}
                          disabled={actionLoading === claim.id}
                          className="bg-transparent border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/10 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
