"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getSavedPlaces } from "@/lib/saved-places";

// ── Constants ──────────────────────────────────────────────────────────────

const INTENT_OPTIONS = [
  { id: "trending", label: "Trending Now" },
  { id: "study",   label: "Study / Work" },
  { id: "date",    label: "Date / Chill" },
  { id: "quiet",   label: "Quiet Cafés" },
  { id: "laptop",  label: "Laptop-Friendly" },
  { id: "group",   label: "Group Hangouts" },
  { id: "budget",  label: "Budget Eats" },
  { id: "coffee",  label: "Coffee & Catch-Up" },
  { id: "outdoor", label: "Outdoor / Patio" },
];

const DISTANCE_OPTIONS = [
  { label: "1 km",  value: 1000 },
  { label: "2 km",  value: 2000 },
  { label: "5 km",  value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "25 km", value: 25000 },
];

export const PREFS_KEY = "whereto_prefs";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Prefs {
  defaultIntent: string;
  defaultDistance: number;
  autoDetectLocation: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: Prefs = {
  defaultIntent: "trending",
  defaultDistance: 5000,
  autoDetectLocation: true,
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
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mt-7 mb-2">
      {title}
    </p>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gray-50 overflow-hidden divide-y divide-gray-100">
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 min-h-[52px]">
      <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>
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
      <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>
        {label}
      </span>
      <div className="relative flex items-center gap-1.5">
        <span className="text-sm text-gray-400">{currentLabel}</span>
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
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
        checked ? "bg-[#E85D2A]" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
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

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saveCount, setSaveCount] = useState<number | null>(null);
  const [joinedDate, setJoinedDate] = useState<string | null>(null);

  // Load prefs from localStorage on mount
  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  // Fetch user data when authenticated
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/saves")
      .then((r) => r.json())
      .then((data) => setSaveCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setSaveCount(0));

    fetch("/api/user")
      .then((r) => r.json())
      .then((data: { createdAt?: string }) => {
        if (data.createdAt) setJoinedDate(formatJoinDate(data.createdAt));
      })
      .catch(() => {});
  }, [status]);

  // Get save count for unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      setSaveCount(getSavedPlaces().length);
    }
  }, [status]);

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    savePrefsToStorage(updated);
  }

  if (status === "loading") {
    return (
      <div className="h-dvh bg-white flex items-center justify-center pb-16">
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="px-5 pt-5 pb-1">
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: "#E85D2A" }}
        >
          Profile
        </h1>
      </header>

      <div className="px-5">
        {/* ── Profile Section ── */}
        {session?.user ? (
          <div className="flex flex-col items-center text-center pt-5 pb-4">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ""}
                width={80}
                height={80}
                className="rounded-full ring-2 ring-gray-100"
                unoptimized
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-2xl font-bold">
                {session.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <h2
              className="text-xl font-bold mt-3"
              style={{ color: "#1B2A4A" }}
            >
              {session.user.name}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{session.user.email}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center pt-5 pb-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
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
            <p className="text-sm text-gray-500 mt-3 mb-4 max-w-xs">
              Sign in to save your places across devices
            </p>
            <button
              onClick={() => signIn("google")}
              className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-white border-2 border-gray-200 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ color: "#1B2A4A" }}
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
        </SettingsCard>

        {/* ── Account ── */}
        <SectionHeader title="Account" />
        <SettingsCard>
          <Link
            href="/boards"
            className="flex items-center justify-between px-4 py-3.5 min-h-[52px]"
          >
            <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>
              Your Saves
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {saveCount !== null
                  ? `${saveCount} ${saveCount === 1 ? "place" : "places"}`
                  : "—"}
              </span>
              <ChevronRight />
            </div>
          </Link>
          {session?.user && (
            <Row label="Joined">
              <span className="text-sm text-gray-400">{joinedDate ?? "—"}</span>
            </Row>
          )}
        </SettingsCard>

        {session?.user && (
          <button
            onClick={() => signOut()}
            className="mt-3 w-full py-3.5 rounded-2xl bg-gray-50 text-red-500 font-semibold text-sm cursor-pointer hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        )}

        {/* ── About ── */}
        <SectionHeader title="About" />
        <SettingsCard>
          <Row label="App Version">
            <span className="text-sm text-gray-400">1.0.0 (Beta)</span>
          </Row>
          <a
            href="mailto:hello@whereto.app?subject=WhereTo%20Feedback"
            className="flex items-center justify-between px-4 py-3.5 min-h-[52px]"
          >
            <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>
              Send Feedback
            </span>
            <ChevronRight />
          </a>
          <button className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer">
            <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>
              Rate WhereTo
            </span>
            <ChevronRight />
          </button>
          <button className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer">
            <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>
              Privacy Policy
            </span>
            <ChevronRight />
          </button>
          <button className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-full cursor-pointer">
            <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>
              Terms of Service
            </span>
            <ChevronRight />
          </button>
        </SettingsCard>

        <p className="text-center text-xs text-gray-300 mt-8 pb-2">
          Made with love in Toronto
        </p>
      </div>
    </div>
  );
}
