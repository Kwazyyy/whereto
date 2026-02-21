"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getSavedPlaces } from "@/lib/saved-places";
import { useTheme, type Theme } from "@/components/ThemeProvider";

// ── Constants ──────────────────────────────────────────────────────────────

const INTENT_OPTIONS = [
  { id: "trending", label: "Trending Now" },
  { id: "study", label: "Study / Work" },
  { id: "date", label: "Date / Chill" },
  { id: "quiet", label: "Quiet Cafés" },
  { id: "laptop", label: "Laptop-Friendly" },
  { id: "group", label: "Group Hangouts" },
  { id: "budget", label: "Budget Eats" },
  { id: "coffee", label: "Coffee & Catch-Up" },
  { id: "outdoor", label: "Outdoor / Patio" },
];

const DISTANCE_OPTIONS = [
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "25 km", value: 25000 },
];

const THEME_OPTIONS: { label: string; value: Theme }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export const PREFS_KEY = "whereto_prefs";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Prefs {
  defaultIntent: string;
  defaultDistance: number;
  autoDetectLocation: boolean;
  theme: Theme;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: Prefs = {
  defaultIntent: "trending",
  defaultDistance: 5000,
  autoDetectLocation: true,
  theme: "system",
};

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefsToStorage(prefs: Prefs) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }
}

function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mt-7 mb-2">
      {title}
    </p>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gray-50 dark:bg-[#1a1a2e] overflow-hidden divide-y divide-gray-100 dark:divide-white/8">
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 min-h-[52px]">
      <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
        {label}
      </span>
      {children}
    </div>
  );
}

function SelectRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (v: string) => void;
}) {
  const currentLabel = options.find((o) => String(o.value) === String(value))?.label ?? "";
  return (
    <div className="flex items-center justify-between px-4 py-3.5 min-h-[52px]">
      <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
        {label}
      </span>
      <div className="relative flex items-center gap-1.5">
        <span className="text-sm text-gray-400 dark:text-gray-500">{currentLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <select
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SegmentedRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 min-h-[52px]">
      <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
        {label}
      </span>
      <div className="flex gap-0.5 p-0.5 rounded-xl bg-gray-100 dark:bg-[#22223b]">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${value === o.value
              ? "bg-white dark:bg-[#1a1a2e] text-[#1B2A4A] dark:text-[#e8edf4] shadow-sm"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${checked ? "bg-[#E85D2A]" : "bg-gray-200 dark:bg-[#22223b]"
        }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D1D5DB"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function HeartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function MapPinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function GridIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function CheckCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function BookmarkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function EditIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saveCount, setSaveCount] = useState<number | null>(null);
  const [boardCount, setBoardCount] = useState<number | null>(null);
  const [joinedDate, setJoinedDate] = useState<string | null>(null);

  // Load prefs from localStorage on mount
  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  // Keep local prefs theme in sync with ThemeProvider
  useEffect(() => {
    setPrefs((p) => ({ ...p, theme }));
  }, [theme]);

  // Fetch user data when authenticated
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/saves")
      .then((r) => r.json())
      .then((data: Array<{ intent?: string }>) => {
        if (Array.isArray(data)) {
          setSaveCount(data.length);
          const uniqueIntents = new Set(data.map((s) => s.intent).filter(Boolean));
          setBoardCount(uniqueIntents.size);
        } else {
          setSaveCount(0);
          setBoardCount(0);
        }
      })
      .catch(() => {
        setSaveCount(0);
        setBoardCount(0);
      });

    fetch("/api/user")
      .then((r) => r.json())
      .then((data: { createdAt?: string }) => {
        if (data.createdAt) setJoinedDate(formatJoinDate(data.createdAt));
      })
      .catch(() => { });
  }, [status]);

  // Get save count for unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      const places = getSavedPlaces();
      setSaveCount(places.length);
      const uniqueIntents = new Set(places.map((p) => p.intent).filter(Boolean));
      setBoardCount(uniqueIntents.size);
    }
  }, [status]);

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    savePrefsToStorage(updated);
  }

  function handleThemeChange(v: string) {
    const t = v as Theme;
    updatePref("theme", t);
    setTheme(t);
  }

  if (status === "loading") {
    return (
      <div className="h-dvh bg-white dark:bg-[#0f0f1a] flex items-center justify-center pb-16">
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] pb-24">
      <header className="flex items-center justify-between px-5 pt-5 pb-1 h-16">
        {/* Placeholder to balance the flex layout if we don't want the title */}
        <div className="w-10"></div>
        <button className="p-2.5 rounded-full bg-gray-50 dark:bg-[#1a1a2e] text-[#1B2A4A] dark:text-[#e8edf4] shadow-sm hover:scale-105 transition-transform cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>
      </header>

      <div className="px-5">
        {/* ── Profile Section ── */}
        {session?.user ? (
          <div className="flex flex-col items-center text-center pt-2 pb-6 px-1 relative">
            <div className="relative">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={96}
                  height={96}
                  className="rounded-full ring-4 ring-white dark:ring-[#0f0f1a] shadow-sm object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-3xl font-bold shadow-sm ring-4 ring-white dark:ring-[#0f0f1a]">
                  {session.user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <button className="absolute bottom-0 right-0 bg-[#1B2A4A] dark:bg-white text-white dark:text-[#1B2A4A] p-2 rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer">
                <EditIcon size={14} />
              </button>
            </div>

            <h2 className="text-2xl font-bold mt-4 text-[#1B2A4A] dark:text-[#e8edf4]">
              {session.user.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              @{session.user.email?.split('@')[0] || 'user'} • Toronto, ON
            </p>

            <div className="flex items-center justify-center gap-10 mt-6 w-full max-w-[280px]">
              <Link href="/boards" className="flex flex-col items-center gap-1.5 group cursor-pointer w-16">
                <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-[#E85D2A] transition-colors">
                  <HeartIcon size={18} />
                  <span className="font-bold text-lg text-[#1B2A4A] dark:text-gray-200 leading-none">{saveCount || 0}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Saved</span>
              </Link>

              <Link href="/places/visited" className="flex flex-col items-center gap-1.5 group cursor-pointer w-16">
                <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-amber-500 transition-colors">
                  <MapPinIcon size={18} />
                  <span className="font-bold text-lg text-[#1B2A4A] dark:text-gray-200 leading-none">0</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Visited</span>
              </Link>

              <Link href="/boards" className="flex flex-col items-center gap-1.5 group cursor-pointer w-16">
                <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <GridIcon size={18} />
                  <span className="font-bold text-lg text-[#1B2A4A] dark:text-gray-200 leading-none">{boardCount || 0}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Boards</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center pt-2 pb-6 px-1 relative">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1a1a2e] flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-[#0f0f1a]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-4 text-[#1B2A4A] dark:text-[#e8edf4]">
              Guest User
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign in to save your places
            </p>

            <div className="flex items-center justify-center gap-10 mt-6 w-full max-w-[280px]">
              <Link href="/boards" className="flex flex-col items-center gap-1.5 group cursor-pointer w-16">
                <div className="flex items-center gap-1.5 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-[#E85D2A]">
                  <HeartIcon size={18} />
                  <span className="font-bold text-lg leading-none">{saveCount || 0}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">Saved</span>
              </Link>

              <Link href="/places/visited" className="flex flex-col items-center gap-1.5 group cursor-pointer w-16">
                <div className="flex items-center gap-1.5 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-amber-500">
                  <MapPinIcon size={18} />
                  <span className="font-bold text-lg leading-none">0</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">Visited</span>
              </Link>

              <Link href="/boards" className="flex flex-col items-center gap-1.5 group cursor-pointer w-16">
                <div className="flex items-center gap-1.5 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-blue-500">
                  <GridIcon size={18} />
                  <span className="font-bold text-lg leading-none">{boardCount || 0}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">Boards</span>
              </Link>
            </div>

            <div className="mt-6 w-full max-w-xs">
              <button
                onClick={() => signIn("google")}
                className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 font-semibold text-sm text-[#1B2A4A] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-[#22223b] transition-colors cursor-pointer shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        )}

        {/* ── Discovery Preferences ── */}
        <SectionHeader title="Discovery Preferences" />
        <SettingsCard>
          <SelectRow
            label="Default Intent"
            options={INTENT_OPTIONS.map((o) => ({ label: o.label, value: o.id }))}
            value={prefs.defaultIntent}
            onChange={(v) => updatePref("defaultIntent", v)}
          />
          <SelectRow
            label="Default Distance"
            options={DISTANCE_OPTIONS}
            value={prefs.defaultDistance}
            onChange={(v) => updatePref("defaultDistance", Number(v))}
          />
          <Row label="Auto-detect location">
            <Toggle
              checked={prefs.autoDetectLocation}
              onChange={(v) => updatePref("autoDetectLocation", v)}
            />
          </Row>
          <SegmentedRow
            label="Theme"
            options={THEME_OPTIONS}
            value={prefs.theme}
            onChange={handleThemeChange}
          />
        </SettingsCard>

        {/* ── Your Places ── */}
        <SectionHeader title="Your Places" />
        <SettingsCard>
          <Link
            href="/places/visited"
            className="flex items-center justify-between px-4 py-3.5 min-h-[52px] group"
          >
            <div className="flex items-center gap-3">
              <div className="text-gray-400 group-hover:text-green-500 transition-colors">
                <CheckCircleIcon size={20} />
              </div>
              <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
                Been
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#1B2A4A] dark:text-gray-200">
                0
              </span>
              <ChevronRight />
            </div>
          </Link>
          <hr className="border-gray-100 dark:border-white/8 ml-12" />
          <Link
            href="/boards"
            className="flex items-center justify-between px-4 py-3.5 min-h-[52px] group"
          >
            <div className="flex items-center gap-3">
              <div className="text-gray-400 group-hover:text-[#E85D2A] transition-colors">
                <BookmarkIcon size={20} />
              </div>
              <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
                Want to Try
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#1B2A4A] dark:text-gray-200">
                {saveCount !== null ? saveCount : "—"}
              </span>
              <ChevronRight />
            </div>
          </Link>
        </SettingsCard>

        {/* ── Account ── */}
        <SectionHeader title="Account" />
        <SettingsCard>
          {session?.user && (
            <Row label="Joined">
              <span className="text-sm text-gray-400 dark:text-gray-500">{joinedDate ?? "—"}</span>
            </Row>
          )}
        </SettingsCard>

        {
          session?.user && (
            <button
              onClick={() => signOut()}
              className="mt-3 w-full py-3.5 rounded-2xl bg-gray-50 dark:bg-[#1a1a2e] text-red-500 font-semibold text-sm cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Sign Out
            </button>
          )
        }

        {/* ── About ── */}
        <SectionHeader title="About" />
        <SettingsCard>
          <Row label="App Version">
            <span className="text-sm text-gray-400 dark:text-gray-500">1.0.0 (Beta)</span>
          </Row>
          <a
            href="mailto:hello@whereto.app?subject=WhereTo%20Feedback"
            className="flex items-center justify-between px-4 py-3.5 min-h-[52px]"
          >
            <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
              Send Feedback
            </span>
            <ChevronRight />
          </a>
          <button className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer">
            <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
              Rate WhereTo
            </span>
            <ChevronRight />
          </button>
          <button className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer">
            <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
              Privacy Policy
            </span>
            <ChevronRight />
          </button>
          <button className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-full cursor-pointer">
            <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
              Terms of Service
            </span>
            <ChevronRight />
          </button>
        </SettingsCard>

        <p className="text-center text-xs text-gray-300 dark:text-gray-600 mt-8 pb-2">
          Made with love in Toronto
        </p>
      </div >
    </div >
  );
}
