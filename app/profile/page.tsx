"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { SavedPlace, getSavedPlaces } from "@/lib/saved-places";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import ExplorationStats from "@/components/ExplorationStats";
import { BadgesStats } from "@/components/BadgesStats";
import { useVibeVoting } from "@/components/providers/VibeVotingProvider";
import { useNeighborhoodReveal } from "@/components/providers/NeighborhoodRevealProvider";
import { useToast } from "@/components/Toast";
import { ApplyCreatorForm } from "@/components/ApplyCreatorForm";
import { CreatorDashboard } from "@/components/CreatorDashboard";
import { type Friend } from "@/components/CompatibilityDrawer";
import { FriendsListModal } from "@/components/FriendsListModal";
import { CreatorMyLists } from "@/components/CreatorMyLists";
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

const INTENT_LABELS: Record<string, string> = {
  study: "Study / Work",
  date: "Date / Chill",
  trending: "Trending Now",
  quiet: "Quiet Cafes",
  laptop: "Laptop-Friendly",
  group: "Group Hangouts",
  budget: "Budget Eats",
  coffee: "Coffee & Catch-Up",
  outdoor: "Outdoor / Patio",
};

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
export const BIO_KEY = "whereto_bio";

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

export function loadBio(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(BIO_KEY) || "";
  } catch {
    return "";
  }
}

function saveBioToStorage(bio: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(BIO_KEY, bio);
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
    <div className="rounded-2xl bg-gray-50 dark:bg-[#161B22] overflow-hidden divide-y divide-gray-100 dark:divide-white/8">
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 min-h-[52px]">
      <span className="text-sm font-medium text-[#0E1116] dark:text-[#e8edf4]">
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
      <span className="text-sm font-medium text-[#0E1116] dark:text-[#e8edf4]">
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
      <span className="text-sm font-medium text-[#0E1116] dark:text-[#e8edf4]">
        {label}
      </span>
      <div className="flex gap-0.5 p-0.5 rounded-xl bg-gray-100 dark:bg-[#1C2128]">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${value === o.value
              ? "bg-white dark:bg-[#161B22] text-[#0E1116] dark:text-[#e8edf4] shadow-sm"
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
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${checked ? "bg-[#E85D2A]" : "bg-gray-200 dark:bg-[#1C2128]"
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



function EditIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function BoardCardMini({ intent, label, items }: { intent: string, label: string, items: SavedPlace[] }) {
  const previewItem = items[0];
  const photoUrl = usePhotoUrl(previewItem?.photoRef ?? null);

  return (
    <Link href={`/boards/${intent}`} className="block shrink-0 snap-start">
      <div className="w-32 h-40 bg-white dark:bg-[#161B22] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/10 relative group cursor-pointer">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={label}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-[#1C2128] text-gray-400">
            <GridIcon size={24} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-bold text-sm text-white capitalize drop-shadow-md leading-tight">{label}</h3>
          <p className="text-[10px] text-gray-300 drop-shadow-md mt-0.5">{items.length} place{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saveCount, setSaveCount] = useState<number | null>(null);
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [joinedDate, setJoinedDate] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [saves, setSaves] = useState<SavedPlace[]>([]);
  const [visitCount, setVisitCount] = useState<number>(0);
  const [isCreator, setIsCreator] = useState<boolean>(false);

  // Modal system states
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);


  // Profile Edit States
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  const [editAvatarOpen, setEditAvatarOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit Hooks
  useEffect(() => {
    if (!editProfileOpen) return;
    if (editUsername === username) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(editUsername.toLowerCase())) {
      if (editUsername === "") setUsernameStatus("idle");
      else setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check-username?username=${editUsername.toLowerCase()}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [editUsername, editProfileOpen, username]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = 300;
        canvas.width = size;
        canvas.height = size;

        const scale = Math.max(size / img.width, size / img.height);
        const x = (size / scale - img.width) / 2;
        const y = (size / scale - img.height) / 2;

        ctx?.scale(scale, scale);
        ctx?.drawImage(img, x, y);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCustomAvatar(dataUrl);
        setEditAvatarOpen(false);

        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customAvatar: dataUrl })
        });
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAvatar = async () => {
    setCustomAvatar(null);
    setEditAvatarOpen(false);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customAvatar: null })
    });
  };

  const handleSaveProfile = async () => {
    if (usernameStatus === "checking" || usernameStatus === "taken" || usernameStatus === "invalid") return;
    setSavingProfile(true);

    try {
      const payload: Record<string, string> = { bio: editBio };
      if (editDisplayName !== displayName) payload.displayName = editDisplayName;
      if (editUsername !== username) payload.username = editUsername.toLowerCase();

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const { user } = await res.json();
        if (user.displayName) setDisplayName(user.displayName);
        setBio(user.creatorBio || "");
        if (user.username !== undefined) setUsername(user.username);
        setEditProfileOpen(false);
        showToast("Profile updated!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update profile");
      }
    } catch {
      alert("Network error");
    } finally {
      setSavingProfile(false);
    }
  };

  const { triggerVibeVoting } = useVibeVoting();
  const { triggerNeighborhoodReveal } = useNeighborhoodReveal();
  const { showToast } = useToast();

  const handleSimulateVisit = async () => {
    if (saves.length === 0) {
      alert("Please save at least one place first to simulate a visit.");
      return;
    }
    const randomPlace = saves[Math.floor(Math.random() * saves.length)];

    showToast(`Simulated visit to ${randomPlace.name}!`);

    try {
      // Create manual visit mock
      await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: randomPlace.placeId, lat: 43.65, lng: -79.38, method: "manual" })
      });

      const nhRes = await fetch(`/api/exploration-stats/check-new-neighborhood?placeId=${randomPlace.placeId}`);
      let triggeredReveal = false;
      if (nhRes.ok) {
        const nhData = await nhRes.json();
        if (nhData.isNewNeighborhood && nhData.neighborhood) {
          triggerNeighborhoodReveal(nhData, () => {
            triggerVibeVoting(randomPlace.placeId, randomPlace.name);
          });
          triggeredReveal = true;
        }
      }

      if (!triggeredReveal) {
        setTimeout(() => triggerVibeVoting(randomPlace.placeId, randomPlace.name), 1000);
      }
    } catch (e) {
      console.error(e);
      alert("Simulation failed");
    }
  };

  // Load prefs from localStorage on mount
  useEffect(() => {
    setPrefs(loadPrefs());
    setBio(loadBio());
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
      .then((data: SavedPlace[]) => {
        if (Array.isArray(data)) {
          setSaves(data);
          setSaveCount(data.length);
        } else {
          setSaveCount(0);
        }
      })
      .catch(() => {
        setSaveCount(0);
      });

    fetch("/api/user")
      .then((r) => r.json())
      .then((data: { createdAt?: string; isCreator?: boolean; displayName?: string; username?: string; customAvatar?: string; creatorBio?: string }) => {
        if (data.createdAt) setJoinedDate(formatJoinDate(data.createdAt));
        if (data.isCreator) setIsCreator(data.isCreator);
        if (data.displayName) setDisplayName(data.displayName);
        if (data.username) setUsername(data.username);
        if (data.customAvatar) setCustomAvatar(data.customAvatar);
        if (data.creatorBio) setBio(data.creatorBio);
      })
      .catch(() => { });

    fetch("/api/friends")
      .then((r) => r.json())
      .then((data: { friends: Friend[] }) => {
        if (data && Array.isArray(data.friends)) {
          setFriendCount(data.friends.length);
        } else {
          setFriendCount(0);
        }
      })
      .catch(() => setFriendCount(0));

    fetch("/api/visits")
      .then((r) => r.json())
      .then((data: unknown[]) => {
        if (Array.isArray(data)) setVisitCount(data.length);
      })
      .catch(() => { });
  }, [status]);

  // Get save count for unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      const places = getSavedPlaces();
      setSaves(places);
      setSaveCount(places.length);
      setFriendCount(0);
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

  // Compute board groupings for the Recent Boards carousel
  const boardGroups = saves.reduce((acc, save) => {
    if (!save.intent) return acc;
    if (!acc[save.intent]) acc[save.intent] = [];
    acc[save.intent].push(save);
    return acc;
  }, {} as Record<string, SavedPlace[]>);

  const recentBoards = Object.entries(boardGroups)
    .map(([intent, items]) => ({ intent, items }))
    .sort((a, b) => b.items.length - a.items.length); // Sort by most items for display

  if (status === "loading") {
    return (
      <div className="h-dvh bg-white dark:bg-[#0E1116] flex items-center justify-center pb-16">
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-24 md:pb-12 relative">
      <div className="absolute top-6 right-6 z-20 hidden md:block">
        <button onClick={() => setSettingsOpen(true)} className="p-2 text-gray-400 hover:text-[#E85D2A] transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>
      </div>
      <header className="px-5 pt-5 pb-1 h-16 md:hidden flex justify-end items-center">
        <button onClick={() => setSettingsOpen(true)} className="p-2 -mr-2 text-gray-400 hover:text-[#E85D2A] transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="px-5 md:px-8 md:pt-12 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 w-full">

        {/* ── LEFT COLUMN (User Profile) ── */}
        <div className="md:col-span-5 flex flex-col items-center text-center pt-2 pb-6 px-1">
          <div className="relative mb-4">
            {customAvatar || session?.user?.image ? (
              <Image
                src={customAvatar || session?.user?.image || ""}
                alt={displayName || session?.user?.name || ""}
                width={120}
                height={120}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-white dark:ring-[#0E1116] shadow-sm object-cover"
                unoptimized
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-100 dark:bg-[#161B22] flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-[#0E1116]">
                {session?.user ? (
                  <div className="w-full h-full rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                    {session.user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                )}
              </div>
            )}
            <button
              onClick={() => setEditAvatarOpen(true)}
              className="absolute bottom-0 right-0 bg-[#0E1116] dark:bg-white text-white dark:text-[#0E1116] p-2.5 rounded-full shadow-md border-2 border-white dark:border-[#0E1116] hover:scale-105 transition-transform cursor-pointer"
            >
              <EditIcon size={16} />
            </button>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-[#0E1116] dark:text-[#e8edf4]">
            {displayName || session?.user?.name || "Guest User"}
          </h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
            {username ? (
              <span className="cursor-pointer" onClick={() => {
                setEditDisplayName(displayName || session?.user?.name || "");
                setEditUsername(username || "");
                setEditBio(bio || "");
                setEditProfileOpen(true);
              }}>@{username} • Toronto, ON</span>
            ) : session?.user ? (
              <span className="cursor-pointer text-[#E85D2A] hover:underline" onClick={() => {
                setEditDisplayName(displayName || session?.user?.name || "");
                setEditUsername(username || "");
                setEditBio(bio || "");
                setEditProfileOpen(true);
              }}>Set username</span>
            ) : "Sign in to save your places"}
          </p>

          {/* User Bio */}
          {session?.user && (
            <div className="w-full max-w-sm mt-4 flex flex-col items-center">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={() => saveBioToStorage(bio)}
                placeholder="Add a short bio..."
                className="w-full text-center text-sm text-[#0E1116] dark:text-[#e8edf4] bg-transparent border-none resize-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none leading-relaxed"
                rows={2}
                maxLength={150}
              />
              <button
                onClick={() => {
                  setEditDisplayName(displayName || session?.user?.name || "");
                  setEditUsername(username || "");
                  setEditBio(bio || "");
                  setEditProfileOpen(true);
                }}
                className="mt-3 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-1.5 text-sm text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-8 md:gap-10 mt-6 w-full max-w-sm border-y border-gray-100 dark:border-white/5 py-4">
            <Link href="/boards" className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-[#E85D2A] transition-colors">
                <HeartIcon size={20} />
                <span className="font-bold text-xl text-[#0E1116] dark:text-gray-200 leading-none">{saveCount || 0}</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">Saved</span>
            </Link>

            <Link href="/places/visited" className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-amber-500 transition-colors">
                <MapPinIcon size={20} />
                <span className="font-bold text-xl text-[#0E1116] dark:text-gray-200 leading-none">{visitCount}</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">Visited</span>
            </Link>

            <button onClick={() => setFriendsModalOpen(true)} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-blue-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="font-bold text-xl text-[#0E1116] dark:text-gray-200 leading-none">{friendCount || 0}</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">Friends</span>
            </button>
          </div>

          {session?.user && (
            <div className="mt-8 w-full max-w-sm mx-auto flex flex-col gap-6">
              {isCreator && <CreatorMyLists />}
              <BadgesStats />
              <ExplorationStats />
              {isCreator && <CreatorDashboard />}
              {!isCreator && <ApplyCreatorForm />}
            </div>
          )}

          {!session?.user && (
            <div className="mt-8 w-full max-w-sm mx-auto">
              <button
                onClick={() => signIn("google")}
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 font-semibold text-sm text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-[#1C2128] transition-colors cursor-pointer shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (Settings & Content) ── */}
        <div className="md:col-span-7 flex flex-col pb-8">

          {/* Recent Boards (Visible prominently here) */}
          {recentBoards.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="text-sm font-bold text-[#0E1116] dark:text-gray-200">Recent Boards</h3>
                <Link href="/boards" className="text-xs font-semibold text-[#E85D2A] hover:underline">See all</Link>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {recentBoards.map((board) => (
                  <BoardCardMini
                    key={board.intent}
                    intent={board.intent}
                    label={INTENT_LABELS[board.intent] || board.intent}
                    items={board.items}
                  />
                ))}
              </div>
            </div>
          )}




          <p className="text-center md:text-left text-xs text-gray-400 dark:text-gray-500 mt-8 pb-2 px-1">
            Made with love in Toronto
          </p>

        </div>
      </div>

      {/* Friends List Modal Overlay */}
      {friendsModalOpen && (
        <FriendsListModal onClose={() => setFriendsModalOpen(false)} />
      )}

      {/* Editor Overlays */}
      {editAvatarOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]" onClick={() => setEditAvatarOpen(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#161B22] rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center mb-4 text-[#0E1116] dark:text-white">Change Profile Photo</h3>
            <div className="flex flex-col gap-2">
              <label className="w-full py-3.5 bg-gray-100 dark:bg-white/5 text-center font-bold text-[#E85D2A] rounded-2xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              <button onClick={handleRemoveCustomAvatar} className="w-full py-3.5 bg-gray-100 dark:bg-white/5 text-center font-bold text-[#0E1116] dark:text-gray-200 rounded-2xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                Use Google Photo
              </button>
              <button onClick={() => setEditAvatarOpen(false)} className="w-full py-3.5 mt-2 text-center font-bold text-gray-500 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={() => setEditProfileOpen(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#161B22] rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#0E1116] dark:text-white">Edit Profile</h3>
              <button onClick={() => setEditProfileOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
                <input type="text" value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1C2128] border-none rounded-xl px-4 py-3 text-sm text-[#0E1116] dark:text-[#e8edf4] placeholder-gray-400 focus:ring-2 focus:ring-[#E85D2A] outline-none" placeholder="Your Name" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))} className="w-full bg-gray-50 dark:bg-[#1C2128] border-none rounded-xl pl-9 pr-4 py-3 text-sm text-[#0E1116] dark:text-[#e8edf4] focus:ring-2 focus:ring-[#E85D2A] outline-none" placeholder="username" />
                </div>
                {editUsername.length > 0 && editUsername !== username && (
                  <div className="mt-2 text-xs font-medium">
                    {usernameStatus === "checking" && <span className="text-gray-400">Checking availability...</span>}
                    {usernameStatus === "invalid" && <span className="text-red-500">3-20 lowercase letters, numbers, or underscores.</span>}
                    {usernameStatus === "available" && <span className="text-green-500">✓ Available</span>}
                    {usernameStatus === "taken" && <span className="text-red-500">✗ Username taken</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bio</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} maxLength={150} className="w-full bg-gray-50 dark:bg-[#1C2128] border-none rounded-xl px-4 py-3 text-sm text-[#0E1116] dark:text-[#e8edf4] placeholder-gray-400 focus:ring-2 focus:ring-[#E85D2A] outline-none resize-none" placeholder="Add a short bio..." />
                <p className="text-right text-[10px] text-gray-400 mt-1">{editBio.length}/150</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || usernameStatus === "taken" || usernameStatus === "invalid"}
                className="w-full mt-4 bg-[#E85D2A] text-white font-bold py-3.5 rounded-2xl hover:bg-[#d45222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end flex-col">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="relative bg-gray-50 dark:bg-[#0E1116] rounded-t-3xl p-5 md:p-8 w-full max-w-2xl mx-auto animate-slide-up h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10 shrink-0">
              <h2 className="text-xl md:text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar pt-2 pb-10">
              {/* Discovery Preferences */}
              <SectionHeader title="Discovery Preferences" />
              <SettingsCard>
                <SelectRow label="Default Intent" options={INTENT_OPTIONS.map(o => ({ label: o.label, value: o.id }))} value={prefs.defaultIntent} onChange={v => updatePref("defaultIntent", v)} />
                <SelectRow label="Default Distance" options={DISTANCE_OPTIONS} value={prefs.defaultDistance} onChange={v => updatePref("defaultDistance", Number(v))} />
                <Row label="Auto-detect location"><Toggle checked={prefs.autoDetectLocation} onChange={v => updatePref("autoDetectLocation", v)} /></Row>
                <SegmentedRow label="Theme" options={THEME_OPTIONS} value={prefs.theme} onChange={handleThemeChange} />
              </SettingsCard>

              {/* Account */}
              <SectionHeader title="Account" />
              <SettingsCard>
                {session?.user && <Row label="Joined"><span className="text-sm text-gray-400 dark:text-gray-500">{joinedDate ?? "—"}</span></Row>}
                {session?.user && <button onClick={() => signOut()} className="flex items-center px-4 py-3.5 min-h-[52px] w-full text-left text-red-500 font-semibold text-sm cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">Sign Out</button>}
              </SettingsCard>

              {/* About */}
              <SectionHeader title="About" />
              <SettingsCard>
                <Row label="App Version"><span className="text-sm text-gray-400 dark:text-gray-500">1.0.0 (Beta)</span></Row>
                <a href="mailto:hello@whereto.app?subject=WhereTo%20Feedback" className="flex items-center justify-between px-4 py-3.5 min-h-[52px]"><span className="text-sm font-medium text-[#0E1116] dark:text-[#e8edf4]">Send Feedback</span><ChevronRight /></a>
                <button className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><span className="text-sm font-medium text-[#0E1116] dark:text-[#e8edf4]">Rate WhereTo</span><ChevronRight /></button>
                <Link href="/privacy" className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><span className="text-sm font-medium text-[#0E1116] dark:text-[#e8edf4]">Privacy Policy</span><ChevronRight /></Link>
                <Link href="/terms" className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><span className="text-sm font-medium text-[#0E1116] dark:text-[#e8edf4]">Terms of Service</span><ChevronRight /></Link>
              </SettingsCard>

              {/* Dev Tools - Only visible locally */}
              {process.env.NODE_ENV === "development" && (
                <>
                  <SectionHeader title="Dev Tools" />
                  <SettingsCard>
                    <button onClick={() => triggerVibeVoting("dummy_place_id", "Test Cafe")} className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer border-b border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><span className="text-sm font-medium text-blue-500">Test Vibe Voting</span><ChevronRight /></button>
                    <button onClick={handleSimulateVisit} className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer border-b border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><span className="text-sm font-medium text-amber-500">Simulate Visit</span><ChevronRight /></button>
                    <button onClick={async () => { try { await fetch('/api/creators/dev-toggle', { method: 'POST' }); setIsCreator(!isCreator); window.location.reload(); } catch { } }} className="flex items-center justify-between px-4 py-3.5 min-h-[52px] w-full text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><span className="text-sm font-medium text-purple-500">Toggle Creator Status {isCreator ? "(On)" : "(Off)"}</span><ChevronRight /></button>
                  </SettingsCard>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
