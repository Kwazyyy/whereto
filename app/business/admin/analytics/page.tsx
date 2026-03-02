"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ─── Types ──────────────────────────────────────────────────── */
interface AnalyticsData {
  totalUsers: number;
  totalBusinessUsers: number;
  totalSaves: number;
  totalVisits: number;
  totalPlaces: number;
  totalClaims: number;
  pendingClaims: number;
  userGrowth: { week: string; count: number }[];
  savesGrowth: { week: string; count: number }[];
  topPlaces: { name: string; googlePlaceId: string; saveCount: number }[];
  topIntents: { intent: string; count: number }[];
}

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  saveCount: number;
  visitCount: number;
}

interface SaveRecord {
  id: string;
  userName: string;
  placeName: string;
  intent: string;
  createdAt: string;
}

interface VisitRecord {
  id: string;
  userName: string;
  placeName: string;
  method: string;
  createdAt: string;
}

interface PlaceRecord {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  googlePlaceId: string;
  saveCount: number;
  visitCount: number;
}

type DetailType =
  | "users"
  | "businessUsers"
  | "saves"
  | "visits"
  | "places"
  | "claims"
  | null;

/* ─── Icons ──────────────────────────────────────────────────── */
function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}

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

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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

/* ─── Admin Sub Nav ──────────────────────────────────────────── */
function AdminSubNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/business/admin", label: "Claims" },
    { href: "/business/admin/analytics", label: "Analytics" },
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
function AnalyticsSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#161B22] rounded-xl p-4 border border-white/5 animate-pulse">
            <div className="h-3 w-16 bg-white/10 rounded mb-3" />
            <div className="h-7 w-12 bg-white/10 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 animate-pulse h-56" />
        <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 animate-pulse h-56" />
      </div>
    </div>
  );
}

/* ─── Bar Chart ──────────────────────────────────────────────── */
function formatWeekLabel(week: string): string {
  const d = new Date(week + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function BarChart({ data }: { data: { week: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-36">
        {data.map((d) => (
          <div key={d.week} className="flex-1 flex flex-col items-center justify-end h-full">
            {d.count > 0 && <span className="text-[10px] text-gray-400 mb-1">{d.count}</span>}
            <div
              className="w-full bg-[#E85D2A] rounded-t-sm min-h-[3px] transition-all"
              style={{ height: `${Math.max((d.count / maxCount) * 100, 2)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d) => (
          <div key={d.week} className="flex-1 text-center">
            <span className="text-[9px] text-gray-500">{formatWeekLabel(d.week)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Intent Bars ────────────────────────────────────────────── */
function IntentBreakdown({ data }: { data: { intent: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (data.length === 0) return <p className="text-gray-500 text-sm text-center py-8">No intent data</p>;
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        const opacity = Math.max(1 - i * 0.12, 0.3);
        return (
          <div key={d.intent}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300 capitalize">{d.intent}</span>
              <span className="text-sm text-gray-400">{pct}% ({d.count})</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-[#E85D2A] transition-all" style={{ width: `${pct}%`, opacity }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Time Ago ───────────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── Role Badge ─────────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const styles =
    role === "admin"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : role === "business"
        ? "bg-[#E85D2A]/10 text-[#E85D2A] border-[#E85D2A]/20"
        : "bg-white/5 text-gray-400 border-white/10";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles}`}>
      {role}
    </span>
  );
}

/* ─── Intent Pill ────────────────────────────────────────────── */
function IntentPill({ intent }: { intent: string }) {
  return (
    <span className="bg-[#E85D2A]/10 text-[#E85D2A] text-xs px-2 py-0.5 rounded-full capitalize">
      {intent}
    </span>
  );
}

/* ─── Detail Panel Wrapper ───────────────────────────────────── */
function DetailPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="bg-[#161B22] rounded-xl p-5 border border-white/5 mt-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Mini Stat ──────────────────────────────────────────────── */
function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#0E1116] rounded-lg p-3 border border-white/5 text-center">
      <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Users Detail ───────────────────────────────────────────── */
function UsersDetail({ filterRole }: { filterRole?: string }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business/admin/users");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { users: UserRecord[] };
        setUsers(data.users);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-20 bg-white/5 rounded-lg" />;
  }

  let filtered = filterRole ? users.filter((u) => u.role === filterRole) : users;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        (u.name?.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q)
    );
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="bg-[#0E1116] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-full mb-3 focus:outline-none focus:border-[#E85D2A] transition"
      />
      <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="space-y-0">
          {filtered.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No users found</p>
          )}
          {filtered.map((user, i) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                i % 2 === 1 ? "bg-white/[0.02]" : ""
              }`}
            >
              <span className="text-gray-500 text-xs w-5 text-right shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-medium truncate block">
                  {user.name || "—"}
                </span>
                <span className="text-gray-500 text-xs truncate block">
                  {user.email}
                </span>
              </div>
              <RoleBadge role={user.role} />
              <div className="text-right shrink-0 hidden sm:block">
                <span className="text-gray-400 text-xs">
                  {user.saveCount}s · {user.visitCount}v
                </span>
              </div>
              <span className="text-gray-600 text-xs shrink-0 hidden md:block">
                {formatDate(user.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Saves Detail ───────────────────────────────────────────── */
function SavesDetail() {
  const [data, setData] = useState<{
    totalSaves: number;
    savesToday: number;
    savesThisWeek: number;
    savesThisMonth: number;
    saves: SaveRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business/admin/saves");
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="animate-pulse h-20 bg-white/5 rounded-lg" />;
  if (!data) return <p className="text-gray-500 text-sm">Failed to load</p>;

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MiniStat label="Today" value={data.savesToday} />
        <MiniStat label="This Week" value={data.savesThisWeek} />
        <MiniStat label="This Month" value={data.savesThisMonth} />
        <MiniStat label="All Time" value={data.totalSaves} />
      </div>
      <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {data.saves.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No saves yet</p>
        )}
        {data.saves.map((save, i) => (
          <div
            key={save.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg ${
              i % 2 === 1 ? "bg-white/[0.02]" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white text-sm truncate">{save.userName}</span>
              <span className="text-gray-500 text-sm shrink-0">saved</span>
              <span className="text-[#E85D2A] text-sm truncate">{save.placeName}</span>
              <IntentPill intent={save.intent} />
            </div>
            <span className="text-gray-600 text-xs shrink-0 ml-3">
              {timeAgo(save.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Visits Detail ──────────────────────────────────────────── */
function VisitsDetail() {
  const [data, setData] = useState<{
    totalVisits: number;
    visitsToday: number;
    visitsThisWeek: number;
    visitsThisMonth: number;
    visits: VisitRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business/admin/visits");
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="animate-pulse h-20 bg-white/5 rounded-lg" />;
  if (!data) return <p className="text-gray-500 text-sm">Failed to load</p>;

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MiniStat label="Today" value={data.visitsToday} />
        <MiniStat label="This Week" value={data.visitsThisWeek} />
        <MiniStat label="This Month" value={data.visitsThisMonth} />
        <MiniStat label="All Time" value={data.totalVisits} />
      </div>
      <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {data.visits.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No visits yet</p>
        )}
        {data.visits.map((visit, i) => (
          <div
            key={visit.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg ${
              i % 2 === 1 ? "bg-white/[0.02]" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white text-sm truncate">{visit.userName}</span>
              <span className="text-gray-500 text-sm shrink-0">visited</span>
              <span className="text-[#E85D2A] text-sm truncate">{visit.placeName}</span>
              <span className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                {visit.method}
              </span>
            </div>
            <span className="text-gray-600 text-xs shrink-0 ml-3">
              {timeAgo(visit.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Places Detail ──────────────────────────────────────────── */
function PlacesDetail() {
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business/admin/places");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { places: PlaceRecord[] };
        setPlaces(data.places);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="animate-pulse h-20 bg-white/5 rounded-lg" />;

  const filtered = search
    ? places.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : places.slice(0, 30);

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search places..."
        className="bg-[#0E1116] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-full mb-3 focus:outline-none focus:border-[#E85D2A] transition"
      />
      <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No places found</p>
        )}
        {filtered.map((place, i) => (
          <div
            key={place.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              i % 2 === 1 ? "bg-white/[0.02]" : ""
            }`}
          >
            <span className="text-gray-500 text-xs w-5 text-right shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium truncate block">
                {place.name}
              </span>
              <span className="text-gray-500 text-xs truncate block">
                {place.address}
              </span>
            </div>
            {place.rating && (
              <span className="text-yellow-400 text-xs shrink-0">
                ★ {place.rating}
              </span>
            )}
            <div className="text-right shrink-0">
              <span className="text-[#E85D2A] text-xs font-semibold">
                {place.saveCount}s
              </span>
              <span className="text-gray-500 text-xs ml-1">
                {place.visitCount}v
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Claims Detail ──────────────────────────────────────────── */
function ClaimsDetail() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-400 text-sm mb-4">
        View and manage claims in the Claims tab
      </p>
      <Link
        href="/business/admin"
        className="inline-block bg-[#E85D2A] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#d4522a] transition"
      >
        Go to Claims
      </Link>
    </div>
  );
}

/* ─── Stat Card (Clickable) ──────────────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  valueColor,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueColor?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#161B22] rounded-xl p-4 border relative overflow-hidden text-left w-full cursor-pointer transition-colors ${
        active ? "border-[#E85D2A]" : "border-white/5 hover:border-[#E85D2A]/50"
      }`}
    >
      <div className="absolute top-3 right-3">{icon}</div>
      <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColor || "text-white"}`}>
        {value.toLocaleString()}
      </p>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */
export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDetail, setActiveDetail] = useState<DetailType>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/business/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = (await res.json()) as AnalyticsData;
      setData(json);
    } catch {
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleDetail(type: DetailType) {
    setActiveDetail((prev) => (prev === type ? null : type));
  }

  const detailTitles: Record<string, string> = {
    users: "All Users",
    businessUsers: "Business Users",
    saves: "All Saves",
    visits: "All Visits",
    places: "All Indexed Places",
    claims: "All Business Claims",
  };

  return (
    <div>
      <AdminSubNav />

      <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
      <p className="text-gray-400 mt-1">Real-time overview of WhereTo</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mt-4">
          {error}
          <button onClick={fetchData} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {loading && <AnalyticsSkeleton />}

      {!loading && data && (
        <>
          {/* Top row — 6 clickable stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            <StatCard
              label="Total Users"
              value={data.totalUsers}
              icon={<PersonIcon className="w-7 h-7 text-[#E85D2A] opacity-20" />}
              active={activeDetail === "users"}
              onClick={() => toggleDetail("users")}
            />
            <StatCard
              label="Business Users"
              value={data.totalBusinessUsers}
              icon={<BriefcaseIcon className="w-7 h-7 text-[#E85D2A] opacity-20" />}
              active={activeDetail === "businessUsers"}
              onClick={() => toggleDetail("businessUsers")}
            />
            <StatCard
              label="Total Saves"
              value={data.totalSaves}
              icon={<HeartIcon className="w-7 h-7 text-[#E85D2A] opacity-20" />}
              active={activeDetail === "saves"}
              onClick={() => toggleDetail("saves")}
            />
            <StatCard
              label="Total Visits"
              value={data.totalVisits}
              icon={<MapPinIcon className="w-7 h-7 text-[#E85D2A] opacity-20" />}
              active={activeDetail === "visits"}
              onClick={() => toggleDetail("visits")}
            />
            <StatCard
              label="Places Indexed"
              value={data.totalPlaces}
              icon={<BuildingIcon className="w-7 h-7 text-[#E85D2A] opacity-20" />}
              active={activeDetail === "places"}
              onClick={() => toggleDetail("places")}
            />
            <StatCard
              label="Pending Claims"
              value={data.pendingClaims}
              valueColor={data.pendingClaims > 0 ? "text-yellow-400" : "text-white"}
              icon={<ClockIcon className="w-7 h-7 text-[#E85D2A] opacity-20" />}
              active={activeDetail === "claims"}
              onClick={() => toggleDetail("claims")}
            />
          </div>

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            {activeDetail && (
              <DetailPanel
                key={activeDetail}
                title={detailTitles[activeDetail]}
                onClose={() => setActiveDetail(null)}
              >
                {activeDetail === "users" && <UsersDetail />}
                {activeDetail === "businessUsers" && <UsersDetail filterRole="business" />}
                {activeDetail === "saves" && <SavesDetail />}
                {activeDetail === "visits" && <VisitsDetail />}
                {activeDetail === "places" && <PlacesDetail />}
                {activeDetail === "claims" && <ClaimsDetail />}
              </DetailPanel>
            )}
          </AnimatePresence>

          {/* Growth charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-[#161B22] rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">User Growth (12 weeks)</h3>
              {data.userGrowth.some((w) => w.count > 0) ? (
                <BarChart data={data.userGrowth} />
              ) : (
                <p className="text-gray-500 text-sm text-center py-12">No user signups in this period</p>
              )}
            </div>
            <div className="bg-[#161B22] rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Saves Growth (12 weeks)</h3>
              {data.savesGrowth.some((w) => w.count > 0) ? (
                <BarChart data={data.savesGrowth} />
              ) : (
                <p className="text-gray-500 text-sm text-center py-12">No saves in this period</p>
              )}
            </div>
          </div>

          {/* Top places + Intent breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-[#161B22] rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Top 10 Places</h3>
              {data.topPlaces.length > 0 ? (
                <div>
                  {data.topPlaces.map((place, i) => (
                    <div key={place.googlePlaceId || i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-b-0">
                      <span className="text-gray-500 text-sm w-5 text-right shrink-0">{i + 1}</span>
                      <span className="text-white font-medium text-sm flex-1 truncate">{place.name}</span>
                      <span className="text-[#E85D2A] font-semibold text-sm shrink-0">{place.saveCount}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No save data yet</p>
              )}
            </div>
            <div className="bg-[#161B22] rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Intent Breakdown</h3>
              <IntentBreakdown data={data.topIntents} />
            </div>
          </div>

        </>
      )}
    </div>
  );
}
