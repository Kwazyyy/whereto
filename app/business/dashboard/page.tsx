"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface AnalyticsBusiness {
  googlePlaceId: string;
  businessName: string;
  claimStatus: "approved" | "pending";
  analytics: {
    totalSaves: number;
    totalVisits: number;
    swipeRightRate: number | null;
    rating: number | null;
    priceLevel: number | null;
    intentBreakdown: Record<string, number>;
    savesOverTime: { week: string; count: number }[];
    vibeTags: { tag: string; count: number }[];
  };
}

// --- Icons ---

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
      <circle cx="12" cy="10" r="3" strokeWidth={1.5} />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

// --- Skeleton ---

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`bg-[#161B22] rounded-xl p-5 border border-white/5 animate-pulse ${className || ""}`}>
      <div className="h-3 w-20 bg-white/10 rounded mb-3" />
      <div className="h-8 w-16 bg-white/10 rounded" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 animate-pulse h-56" />
        <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 animate-pulse h-56" />
      </div>
      <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 animate-pulse h-24 mt-4" />
    </div>
  );
}

// --- Stat Card ---

function StatCard({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 relative overflow-hidden">
      <div className="absolute top-4 right-4">{icon}</div>
      <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// --- Bar Chart ---

function formatWeekLabel(week: string): string {
  const d = new Date(week + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function SavesBarChart({ data }: { data: { week: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => (
          <div key={d.week} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-xs text-gray-400 mb-1">{d.count > 0 ? d.count : ""}</span>
            <div
              className="w-full bg-[#E85D2A] rounded-t-md min-h-[4px] transition-all"
              style={{ height: `${Math.max((d.count / maxCount) * 100, 3)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d) => (
          <div key={d.week} className="flex-1 text-center">
            <span className="text-[10px] text-gray-500">{formatWeekLabel(d.week)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Intent Bars ---

function IntentBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (entries.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">No intent data yet</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([intent, count], i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const opacity = Math.max(1 - i * 0.15, 0.4);

        return (
          <div key={intent}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300 capitalize">{intent}</span>
              <span className="text-sm text-gray-400">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#E85D2A] transition-all"
                style={{ width: `${pct}%`, opacity }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main ---

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<AnalyticsBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/business/analytics");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = (await res.json()) as { businesses: AnalyticsBusiness[] };
      setBusinesses(data.businesses);
    } catch {
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-5 py-2.5 bg-[#E85D2A] text-white rounded-lg text-sm font-medium hover:bg-[#d4522a] transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state — no claims
  if (businesses.length === 0) {
    return (
      <div className="text-center py-20">
        <BuildingIcon className="w-12 h-12 text-gray-600 mx-auto" />
        <h2 className="text-xl font-bold text-white mt-4">No businesses claimed yet</h2>
        <p className="text-gray-400 mt-2 mb-6">Claim your first business to see analytics</p>
        <Link
          href="/business/claim"
          className="inline-block px-6 py-3 bg-[#E85D2A] text-white rounded-lg font-medium hover:bg-[#d4522a] transition"
        >
          Claim Your Business
        </Link>
      </div>
    );
  }

  // Show first business (primary). Could extend to tabs for multiple businesses later.
  const biz = businesses[0];
  const a = biz.analytics;
  const isPending = biz.claimStatus === "pending";
  const hasSavesData = a.savesOverTime.some((w) => w.count > 0);

  return (
    <div>
      {/* Pending banner */}
      {isPending && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3 mb-6">
          <ClockIcon className="w-5 h-5 text-yellow-400 shrink-0" />
          <p className="text-yellow-300 text-sm">
            Your claim for <span className="font-medium text-yellow-200">{biz.businessName}</span> is under review. We&apos;ll notify you within 24-48 hours.
          </p>
        </div>
      )}

      {/* Heading */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{biz.businessName}</h1>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            isPending
              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              : "bg-green-500/10 text-green-400 border border-green-500/20"
          }`}
        >
          {isPending ? "Pending" : "Approved"}
        </span>
      </div>

      {/* Top row — 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Saves"
          icon={<HeartIcon className="w-8 h-8 text-[#E85D2A] opacity-20" />}
        >
          <p className="text-3xl font-bold text-white">{a.totalSaves}</p>
        </StatCard>

        <StatCard
          label="Verified Visits"
          icon={<MapPinIcon className="w-8 h-8 text-[#E85D2A] opacity-20" />}
        >
          <p className="text-3xl font-bold text-white">{a.totalVisits}</p>
        </StatCard>

        <StatCard
          label="Rating"
          icon={<StarIcon className="w-8 h-8 text-[#E85D2A] opacity-20" />}
        >
          {a.rating ? (
            <p className="text-3xl font-bold text-yellow-400">★ {a.rating}</p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No rating yet</p>
          )}
        </StatCard>

        <StatCard
          label="Save Rate"
          icon={<TrendingUpIcon className="w-8 h-8 text-[#E85D2A] opacity-20" />}
        >
          {a.swipeRightRate !== null ? (
            <p className="text-3xl font-bold text-white">{Math.round(a.swipeRightRate * 100)}%</p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Coming soon</p>
          )}
        </StatCard>
      </div>

      {/* Middle row — Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-[#161B22] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Saves Over Time</h3>
          {hasSavesData ? (
            <SavesBarChart data={a.savesOverTime} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">No save data yet</p>
          )}
        </div>

        <div className="bg-[#161B22] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Discovery Intents</h3>
          <IntentBreakdown data={a.intentBreakdown} />
        </div>
      </div>

      {/* Bottom row — Vibe Tags */}
      <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 mt-4">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Community Vibes</h3>
        {a.vibeTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {a.vibeTags.map((vibe) => (
              <span
                key={vibe.tag}
                className="bg-white/5 rounded-full px-3 py-1.5 text-sm text-gray-300"
              >
                {vibe.tag} <span className="text-gray-500">{vibe.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            No vibe votes yet. Vibes appear after users visit and vote.
          </p>
        )}
      </div>
    </div>
  );
}
