"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useSavePlace } from "@/lib/use-save-place";
import PlaceDetailSheet from "@/components/PlaceDetailSheet";
import type { CompatibilityResult, SharedPlace } from "@/lib/tasteScore";
import type { Place } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface Friend {
  friendshipId: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  friendsSince: string;
  compatibility?: CompatibilityResult | null;
}

interface FriendRequest {
  friendshipId: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  sentAt: string;
}

interface MissedRec {
  recommendationId: string;
  note: string | null;
  seen: boolean;
  createdAt: string;
  sender: { name: string | null; image: string | null };
  place: Place;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const UNSEEN_ACTIVITY_KEY = "whereto_unseen_activity";

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
  if (score >= 50) return "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400";
  return "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400";
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Avatar({
  image,
  name,
  size = 44,
}: {
  image: string | null;
  name: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? ""}
        width={size}
        height={size}
        className="rounded-full shrink-0 object-cover"
        unoptimized
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#E85D2A] flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── Shared Place Card ──────────────────────────────────────────────────────

function SharedPlaceCard({ place }: { place: SharedPlace }) {
  const photoUrl = usePhotoUrl(place.photoRef);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-[#22223b] relative">
        {photoUrl ? (
          <Image src={photoUrl} alt={place.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0E1116] dark:text-[#e8edf4] truncate">{place.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{place.intent}</p>
      </div>
    </div>
  );
}

// ── Compatibility Drawer ───────────────────────────────────────────────────

function CompatibilityDrawer({
  friend,
  compat,
  onClose,
}: {
  friend: Friend;
  compat: CompatibilityResult | null | undefined;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-t-3xl px-6 pt-4 pb-10 max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar image={friend.image} name={friend.name} size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0E1116] dark:text-[#e8edf4] truncate">{friend.name ?? friend.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Taste Compatibility</p>
          </div>
        </div>

        {!compat ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }} />
          </div>
        ) : compat.noData || compat.sharedCount === 0 ? (
          <div className="text-center py-10 flex flex-col items-center gap-3">
            <div className="text-4xl">🗺️</div>
            <p className="text-base font-semibold text-[#0E1116] dark:text-[#e8edf4]">Keep exploring!</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
              Save more places and discover your taste match with {friend.name?.split(" ")[0] ?? "your friend"}.
            </p>
          </div>
        ) : (
          <>
            {/* Score ring */}
            <div className="flex justify-center mb-6">
              <div className="relative flex items-center justify-center w-28 h-28">
                <svg className="absolute inset-0" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="48" fill="none" stroke="#F3F4F6" strokeWidth="8" className="dark:stroke-white/10" />
                  <circle
                    cx="55" cy="55" r="48"
                    fill="none"
                    stroke={compat.score >= 80 ? "#22c55e" : compat.score >= 50 ? "#E85D2A" : "#9CA3AF"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(compat.score / 100) * 301.6} 301.6`}
                    transform="rotate(-90 55 55)"
                  />
                </svg>
                <div className="text-center z-10">
                  <p className="text-2xl font-black text-[#0E1116] dark:text-[#e8edf4] leading-none">{compat.score}%</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">match</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#22223b]">
                <span className="text-xl">🏠</span>
                <p className="text-sm text-[#0E1116] dark:text-[#e8edf4] font-medium">
                  You both saved <span className="font-bold">{compat.sharedCount} place{compat.sharedCount !== 1 ? "s" : ""}</span>
                </p>
              </div>

              {compat.sharedIntents.length > 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#22223b]">
                  <span className="text-xl">✨</span>
                  <div>
                    <p className="text-sm text-[#0E1116] dark:text-[#e8edf4] font-medium">Top shared vibes</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{compat.sharedIntents.join(", ")}</p>
                  </div>
                </div>
              )}

              {compat.sharedPrice && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#22223b]">
                  <span className="text-xl">💰</span>
                  <p className="text-sm text-[#0E1116] dark:text-[#e8edf4] font-medium">
                    You both love <span className="font-bold">{compat.sharedPrice}</span> restaurants
                  </p>
                </div>
              )}
            </div>

            {/* Shared places */}
            {compat.sharedPlaces.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Shared Saves
                </p>
                <div className="divide-y divide-gray-100 dark:divide-white/8">
                  {compat.sharedPlaces.map((p) => (
                    <SharedPlaceCard key={p.placeId} place={p} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Add Friend Modal ───────────────────────────────────────────────────────

function AddFriendModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setSuccess(true);
        onSent();
        setTimeout(onClose, 1200);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-t-3xl px-6 pt-4 pb-28"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-6" />

        <h2 className="text-lg font-bold mb-1 text-[#0E1116] dark:text-[#e8edf4]">
          Add a Friend
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
          Enter their email address to send a friend request.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="friend@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#22223b] text-sm font-medium outline-none border-2 border-transparent focus:border-[#E85D2A] transition-colors text-[#0E1116] dark:text-[#e8edf4] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />

          {error && (
            <p className="text-xs text-red-500 font-medium px-1">{error}</p>
          )}

          {success && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium px-1">
              Friend request sent!
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-opacity disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: "#E85D2A" }}
          >
            {loading ? "Sending…" : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<"friends" | "activity">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [hasUnseenActivity, setHasUnseenActivity] = useState(false);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json() as { friends: Friend[]; incoming: FriendRequest[] };
        const fetchedFriends = data.friends ?? [];
        setFriends(fetchedFriends);
        setIncoming(data.incoming ?? []);

        // Fetch compatibility scores for all friends in parallel
        if (fetchedFriends.length > 0) {
          const scores = await Promise.all(
            fetchedFriends.map(async (f) => {
              try {
                const r = await fetch(`/api/friends/${f.userId}/compatibility`);
                if (!r.ok) return { userId: f.userId, compat: null };
                const compat = await r.json() as CompatibilityResult;
                return { userId: f.userId, compat };
              } catch {
                return { userId: f.userId, compat: null };
              }
            })
          );
          const scoreMap = Object.fromEntries(scores.map((s) => [s.userId, s.compat]));
          setFriends((prev) =>
            prev.map((f) => ({ ...f, compatibility: scoreMap[f.userId] }))
          );
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchFriends();
    else if (status === "unauthenticated") setLoading(false);
  }, [status, fetchFriends]);

  // Check for unseen activity badge
  useEffect(() => {
    if (status !== "authenticated") return;
    const stored = localStorage.getItem(UNSEEN_ACTIVITY_KEY);
    if (stored) {
      setHasUnseenActivity(true);
    } else {
      // Fetch to see if there is new activity
      fetch("/api/activity")
        .then(r => r.ok ? r.json() : [])
        .then((data: ActivityItem[]) => {
          if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem(UNSEEN_ACTIVITY_KEY, "1");
            setHasUnseenActivity(true);
          }
        })
        .catch(() => { });
    }
  }, [status]);

  async function handleRequest(friendshipId: string, action: "accept" | "decline") {
    await fetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    fetchFriends();
  }

  async function handleRemove(friendshipId: string) {
    setRemovingId(null);
    await fetch("/api/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId }),
    });
    fetchFriends();
  }

  // ── Loading ──
  if (status === "loading" || loading) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] pb-24">
        <header className="px-5 pt-5 pb-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
            Friends
          </h1>
        </header>
        <div className="px-5 mt-4">
          <div className="rounded-2xl bg-gray-50 dark:bg-[#1a1a2e] overflow-hidden divide-y divide-gray-100 dark:divide-white/8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                <div className="flex-1">
                  <div className="w-1/2 h-4 bg-gray-200 dark:bg-white/10 rounded mb-2" />
                  <div className="w-1/3 h-3 bg-gray-200 dark:bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not signed in ──
  if (!session?.user) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] pb-20">
        <header className="px-5 pt-5 pb-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
            Friends
          </h1>
        </header>
        <div className="flex flex-col items-center justify-center px-8 pt-24 text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#1a1a2e] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Sign in to see friends</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs">
              Add friends and see what places they&apos;re saving.
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-white dark:bg-[#1a1a2e] border-2 border-gray-200 dark:border-white/10 font-semibold text-sm text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-[#22223b] transition-colors cursor-pointer"
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
    );
  }

  const hasContent = friends.length > 0 || incoming.length > 0;

  // ── Main friends list ──
  return (
    <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] pb-24">
      {/* Header */}
      <header className="px-5 pt-5 pb-0 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
          Friends
        </h1>
        {tab === "friends" && (
          <button
            onClick={() => setAddFriendOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white cursor-pointer transition-opacity active:opacity-80"
            style={{ backgroundColor: "#E85D2A" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Add Friend
          </button>
        )}
      </header>

      {/* Tab switcher */}
      <div className="flex gap-1 px-5 pt-4 pb-1">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${tab === "friends"
            ? "bg-[#E85D2A] text-white shadow-sm"
            : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15"
            }`}
        >
          Friends
        </button>
        <button
          onClick={() => {
            setTab("activity");
            setHasUnseenActivity(false);
            localStorage.removeItem(UNSEEN_ACTIVITY_KEY);
          }}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer relative ${tab === "activity"
            ? "bg-[#E85D2A] text-white shadow-sm"
            : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15"
            }`}
        >
          Activity
          {hasUnseenActivity && tab !== "activity" && (
            <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {/* Tab content */}
      {tab === "activity" ? (
        <ActivityFeed />
      ) : !hasContent ? (
        <div className="flex flex-col items-center justify-center px-8 pt-28 text-center gap-5">
          <div className="text-5xl">👫</div>
          <div>
            <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">No friends yet</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 max-w-xs">
              Add friends by email to see what places they love!
            </p>
          </div>
          <button
            onClick={() => setAddFriendOpen(true)}
            className="px-6 py-3 rounded-full text-sm font-semibold text-white cursor-pointer"
            style={{ backgroundColor: "#E85D2A" }}
          >
            Add Your First Friend
          </button>
        </div>
      ) : (
        <div className="px-5">
          {/* ── Friend Requests ── */}
          {incoming.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mt-5 mb-2">
                Friend Requests ({incoming.length})
              </p>
              <div className="rounded-2xl bg-gray-50 dark:bg-[#1a1a2e] overflow-hidden divide-y divide-gray-100 dark:divide-white/8">
                {incoming.map((req) => (
                  <div key={req.friendshipId} className="flex items-center gap-3 px-4 py-3.5">
                    <Avatar image={req.image} name={req.name} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-[#0E1116] dark:text-[#e8edf4]">
                        {req.name ?? req.email}
                      </p>
                      {req.name && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{req.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRequest(req.friendshipId, "decline")}
                        className="px-3 py-1.5 rounded-full bg-gray-200 dark:bg-white/10 text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-300 dark:hover:bg-white/15 transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRequest(req.friendshipId, "accept")}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-white cursor-pointer transition-opacity active:opacity-80"
                        style={{ backgroundColor: "#E85D2A" }}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Friends ── */}
          {friends.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mt-7 mb-2">
                Friends ({friends.length})
              </p>
              <div className="rounded-2xl bg-gray-50 dark:bg-[#1a1a2e] overflow-hidden divide-y divide-gray-100 dark:divide-white/8">
                {friends.map((friend) => {
                  const compat = friend.compatibility;
                  const hasScore = compat && compat.sharedCount > 0;

                  return (
                    <div
                      key={friend.friendshipId}
                      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors active:bg-gray-100 dark:active:bg-white/5"
                      onClick={() => setSelectedFriend(friend)}
                    >
                      <Avatar image={friend.image} name={friend.name} size={44} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[#0E1116] dark:text-[#e8edf4] truncate">
                            {friend.name ?? friend.email}
                          </p>
                          {/* Score badge */}
                          {hasScore && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${scoreBadgeClass(compat.score)}`}>
                              {compat.score}% match
                            </span>
                          )}
                          {/* Score loading placeholder */}
                          {compat === undefined && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 animate-pulse shrink-0">
                              …
                            </span>
                          )}
                        </div>
                        {friend.name && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{friend.email}</p>
                        )}
                      </div>

                      {/* Remove or chevron */}
                      {removingId === friend.friendshipId ? (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleRemove(friend.friendshipId)}
                            className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold cursor-pointer hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setRemovingId(null)}
                            className="px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-bold cursor-pointer hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setRemovingId(friend.friendshipId); }}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Remove friend"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <line x1="17" y1="11" x2="23" y2="11" />
                            </svg>
                          </button>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Missed Recs Section */}
      {hasContent && <MissedRecsSection />}

      {/* Compatibility Drawer */}
      {selectedFriend && (
        <CompatibilityDrawer
          friend={selectedFriend}
          compat={selectedFriend.compatibility}
          onClose={() => setSelectedFriend(null)}
        />
      )}

      {/* Add Friend Modal */}
      {addFriendOpen && (
        <AddFriendModal
          onClose={() => setAddFriendOpen(false)}
          onSent={fetchFriends}
        />
      )}
    </div>
  );
}

// ── Activity Feed ──────────────────────────────────────────────────────────

type PlaceShape = {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  price: string;
  rating: number;
  photoRef: string | null;
  type: string;
  tags: string[];
  openNow: boolean;
  hours: string[];
  distance: string;
};

type ActivityItem =
  | {
    id: string;
    type: "save_group";
    actorName: string | null;
    actorImage: string | null;
    actorId: string;
    createdAt: string;
    day: string;
    places: PlaceShape[];
  }
  | {
    id: string;
    type: "recommendation";
    actorName: string | null;
    actorImage: string | null;
    actorId: string;
    place: PlaceShape;
    note: string | null;
    createdAt: string;
  };

function ActivityPlaceThumbnail({ photoRef }: { photoRef?: string | null }) {
  const url = usePhotoUrl(photoRef ?? null);
  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-[#22223b] relative">
      {url ? (
        <Image src={url} alt="" fill className="object-cover" unoptimized />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-base">📍</div>
      )}
    </div>
  );
}

function SaveGroupRow({ item, onTap }: {
  item: ActivityItem & { type: "save_group" };
  onTap: (place: PlaceShape) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const firstName = item.actorName?.split(" ")[0] ?? "A friend";
  const count = item.places.length;
  const actionText = count === 1
    ? `${firstName} saved ${item.places[0].name} 📍`
    : `${firstName} saved ${count} places`;

  return (
    <div className="border-b border-gray-100 dark:border-white/8 last:border-0">
      {/* Group header row */}
      <button
        onClick={() => count === 1 ? onTap(item.places[0]) : setExpanded(e => !e)}
        className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors active:bg-gray-100 cursor-pointer"
      >
        <div className="shrink-0">
          <Avatar image={item.actorImage} name={item.actorName} size={36} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#0E1116] dark:text-[#e8edf4] leading-snug font-medium">
            {actionText}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            {relativeTime(item.createdAt)}
          </p>
        </div>
        {count === 1 ? (
          <ActivityPlaceThumbnail photoRef={item.places[0].photoRef} />
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Stacked thumbnails preview */}
            <div className="flex -space-x-2">
              {item.places.slice(0, 3).map((p) => (
                <MiniThumb key={p.placeId} photoRef={p.photoRef} />
              ))}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg" width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="#9CA3AF"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        )}
      </button>

      {/* Expanded place list */}
      {expanded && count > 1 && (
        <div className="bg-white dark:bg-[#0f0f1a]/60 mx-3 mb-2 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/8">
          {item.places.map((place) => (
            <button
              key={place.placeId}
              onClick={() => onTap(place)}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors active:bg-gray-100 cursor-pointer"
            >
              <ActivityPlaceThumbnail photoRef={place.photoRef} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0E1116] dark:text-[#e8edf4] truncate">{place.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{place.address}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniThumb({ photoRef }: { photoRef?: string | null }) {
  const url = usePhotoUrl(photoRef ?? null);
  return (
    <div className="w-7 h-7 rounded-lg overflow-hidden border-2 border-white dark:border-[#1a1a2e] bg-gray-100 dark:bg-[#22223b] relative shrink-0">
      {url
        ? <Image src={url} alt="" fill className="object-cover" unoptimized />
        : <div className="w-full h-full flex items-center justify-center text-[10px]">📍</div>
      }
    </div>
  );
}

function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPlace, setDetailPlace] = useState<PlaceShape | null>(null);
  const { handleSave } = useSavePlace();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/activity")
      .then(r => r.ok ? r.json() : [])
      .then((data: ActivityItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const FALLBACK_GRADIENT = "from-amber-800 via-orange-700 to-yellow-600";

  if (loading) {
    return (
      <div className="px-5 pt-5 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
            <div className="flex-1">
              <div className="h-3.5 w-3/4 bg-gray-200 dark:bg-white/10 rounded mb-1.5" />
              <div className="h-3 w-1/3 bg-gray-100 dark:bg-white/8 rounded" />
            </div>
            <div className="flex -space-x-2">
              {[1, 2].map(j => <div key={j} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-8 pt-24 text-center gap-4">
        <div className="text-5xl">🌍</div>
        <h2 className="text-lg font-bold text-[#0E1116] dark:text-[#e8edf4]">No activity yet</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
          Your friends haven&apos;t been exploring yet. Check back later!
        </p>
      </div>
    );
  }

  const detailAsPlace: Place | null = detailPlace ? {
    placeId: detailPlace.placeId,
    name: detailPlace.name,
    address: detailPlace.address,
    location: detailPlace.location,
    price: detailPlace.price,
    rating: detailPlace.rating,
    photoRef: detailPlace.photoRef,
    type: detailPlace.type,
    tags: detailPlace.tags,
    openNow: detailPlace.openNow,
    hours: detailPlace.hours,
    distance: detailPlace.distance,
  } : null;

  return (
    <div className="px-5 pt-4">
      <div className="rounded-2xl bg-gray-50 dark:bg-[#1a1a2e] overflow-hidden">
        {items.map((item) => {
          if (item.type === "save_group") {
            return (
              <SaveGroupRow
                key={item.id}
                item={item}
                onTap={(place) => setDetailPlace(place)}
              />
            );
          }
          // Recommendation row
          const firstName = item.actorName?.split(" ")[0] ?? "A friend";
          return (
            <button
              key={item.id}
              onClick={() => setDetailPlace(item.place)}
              className="flex items-center gap-3 px-4 py-3.5 w-full text-left border-b border-gray-100 dark:border-white/8 last:border-0 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors active:bg-gray-100 cursor-pointer"
            >
              <div className="shrink-0">
                <Avatar image={item.actorImage} name={item.actorName} size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#0E1116] dark:text-[#e8edf4] leading-snug font-medium">
                  {firstName} recommended {item.place.name} to you 💌
                </p>
                {item.note && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic line-clamp-1 mt-0.5">
                    &ldquo;{item.note}&rdquo;
                  </p>
                )}
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {relativeTime(item.createdAt)}
                </p>
              </div>
              <ActivityPlaceThumbnail photoRef={item.place.photoRef} />
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {detailAsPlace && (
          <PlaceDetailSheet
            place={detailAsPlace}
            fallbackGradient={FALLBACK_GRADIENT}
            isSaved={false}
            onClose={() => setDetailPlace(null)}
            onSave={(action) => { handleSave(detailAsPlace, "trending", action); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Missed Recs Section ───────────────────────────────────────────────────

function MissedRecCard({ rec, onSave }: { rec: MissedRec; onSave: (rec: MissedRec) => void }) {
  const photoUrl = usePhotoUrl(rec.place.photoRef);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-[#22223b] relative">
        {photoUrl ? (
          <Image src={photoUrl} alt={rec.place.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-lg">📍</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#0E1116] dark:text-[#e8edf4] truncate">{rec.place.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
          From {rec.sender.name?.split(" ")[0] ?? "a friend"}
          {rec.note ? ` · "${rec.note}"` : ""}
        </p>
      </div>
      <button
        onClick={() => onSave(rec)}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full text-white cursor-pointer"
        style={{ backgroundColor: "#E85D2A" }}
      >
        Save
      </button>
    </div>
  );
}

function MissedRecsSection() {
  const [open, setOpen] = useState(false);
  const [recs, setRecs] = useState<MissedRec[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const { handleSave } = useSavePlace();

  function toggle() {
    setOpen(prev => !prev);
    if (!fetched) {
      setLoading(true);
      fetch("/api/recommendations?all=true")
        .then(r => r.ok ? r.json() : [])
        .then((data: MissedRec[]) => {
          const seen = Array.isArray(data) ? data.filter(r => r.seen) : [];
          setRecs(seen);
          setFetched(true);
        })
        .catch(() => setRecs([]))
        .finally(() => setLoading(false));
    }
  }

  async function handleSaveRec(rec: MissedRec) {
    await handleSave(rec.place, "trending", "save", rec.recommendationId);
    setRecs(prev => prev.filter(r => r.recommendationId !== rec.recommendationId));
  }

  return (
    <div className="px-5 mt-6">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2 cursor-pointer hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
      >
        <span>Missed Recs</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="rounded-2xl bg-gray-50 dark:bg-[#1a1a2e] px-4 py-1 divide-y divide-gray-100 dark:divide-white/8">
          {loading ? (
            <div className="py-6 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }} />
            </div>
          ) : recs.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-5">
              No missed recommendations — you&apos;re all caught up!
            </p>
          ) : (
            recs.map(rec => (
              <MissedRecCard key={rec.recommendationId} rec={rec} onSave={handleSaveRec} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
