"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { usePhotoUrl } from "@/lib/use-photo-url";

// ── Types ──────────────────────────────────────────────────────────────────

interface Friend {
  friendshipId: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  friendsSince: string;
}

interface FriendRequest {
  friendshipId: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  sentAt: string;
}

interface FriendSave {
  saveId: string;
  placeId: string;
  name: string;
  address: string;
  photoRef: string | null;
  price: string;
  rating: number;
  tags: string[];
  intent: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const INTENT_LABELS: Record<string, string> = {
  study: "Study / Work",
  date: "Date / Chill",
  trending: "Trending Now",
  quiet: "Quiet Cafés",
  laptop: "Laptop-Friendly",
  group: "Group Hangouts",
  budget: "Budget Eats",
  coffee: "Coffee & Catch-Up",
  outdoor: "Outdoor / Patio",
};

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
        className="rounded-full shrink-0"
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

function PlacePhoto({ photoRef }: { photoRef: string | null }) {
  const url = usePhotoUrl(photoRef);
  if (!url) {
    return <div className="w-full h-full bg-gradient-to-br from-gray-200 dark:from-[#22223b] to-gray-300 dark:to-[#2d2d44]" />;
  }
  return <Image src={url} alt="" fill className="object-cover" unoptimized />;
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-t-3xl px-6 pt-4 pb-28"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-6" />

        <h2 className="text-lg font-bold mb-1 text-[#1B2A4A] dark:text-[#e8edf4]">
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
            className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#22223b] text-sm font-medium outline-none border-2 border-transparent focus:border-[#E85D2A] transition-colors text-[#1B2A4A] dark:text-[#e8edf4] placeholder:text-gray-400 dark:placeholder:text-gray-500"
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

// ── Friend's Saves View ────────────────────────────────────────────────────

function FriendSavesView({
  friend,
  onBack,
}: {
  friend: Friend;
  onBack: () => void;
}) {
  const [saves, setSaves] = useState<FriendSave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/friends/${friend.userId}/saves`)
      .then((r) => r.json())
      .then((data) => setSaves(Array.isArray(data) ? data : []))
      .catch(() => setSaves([]))
      .finally(() => setLoading(false));
  }, [friend.userId]);

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] flex flex-col pb-20">
      {/* Header */}
      <header className="shrink-0 px-5 pt-5 pb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-[#1B2A4A] dark:stroke-[#e8edf4]"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar image={friend.image} name={friend.name} size={36} />
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate text-[#1B2A4A] dark:text-[#e8edf4]">
              {friend.name ?? friend.email}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {saves.length} saved {saves.length === 1 ? "place" : "places"}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="flex-1 px-5 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-white/8 last:border-b-0 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-[#22223b] shrink-0" />
              <div className="flex-1">
                <div className="w-2/3 h-4 bg-gray-200 dark:bg-[#22223b] rounded mb-2" />
                <div className="w-1/2 h-3 bg-gray-200 dark:bg-[#22223b] rounded mb-2" />
                <div className="w-1/3 h-3 bg-gray-200 dark:bg-[#22223b] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : saves.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
          <div className="text-4xl">🔖</div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {friend.name ?? "This friend"} hasn&apos;t saved any places yet.
          </p>
        </div>
      ) : (
        <div className="flex-1 px-5">
          {saves.map((place) => (
            <SaveRow key={place.saveId} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}

function SaveRow({ place }: { place: FriendSave }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-white/8 last:border-b-0">
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-gray-200 dark:bg-[#22223b]">
        <PlacePhoto photoRef={place.photoRef} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold truncate text-[#1B2A4A] dark:text-[#e8edf4]">
          {place.name}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{place.address}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {place.intent && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 dark:bg-[#E85D2A]/15 text-[#E85D2A]">
              {INTENT_LABELS[place.intent] ?? place.intent}
            </span>
          )}
          {place.rating > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              ★ {place.rating.toFixed(1)}
            </span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{place.price}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json() as { friends: Friend[]; incoming: FriendRequest[] };
        setFriends(data.friends ?? []);
        setIncoming(data.incoming ?? []);
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
            <h2 className="text-xl font-bold text-[#1B2A4A] dark:text-[#e8edf4]">Sign in to see friends</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs">
              Add friends and see what places they&apos;re saving.
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-white dark:bg-[#1a1a2e] border-2 border-gray-200 dark:border-white/10 font-semibold text-sm text-[#1B2A4A] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-[#22223b] transition-colors cursor-pointer"
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

  // ── Friend's saves view ──
  if (selectedFriend) {
    return (
      <FriendSavesView
        friend={selectedFriend}
        onBack={() => setSelectedFriend(null)}
      />
    );
  }

  const hasContent = friends.length > 0 || incoming.length > 0;

  // ── Main friends list ──
  return (
    <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] pb-24">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
          Friends
        </h1>
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
      </header>

      {/* Empty state */}
      {!hasContent ? (
        <div className="flex flex-col items-center justify-center px-8 pt-28 text-center gap-5">
          <div className="text-5xl">👫</div>
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A] dark:text-[#e8edf4]">No friends yet</h2>
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
                      <p className="text-sm font-bold truncate text-[#1B2A4A] dark:text-[#e8edf4]">
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
                {friends.map((friend) => (
                  <div key={friend.friendshipId} className="flex items-center gap-3 px-4 py-3.5">
                    {/* Tappable main area */}
                    <button
                      onClick={() => setSelectedFriend(friend)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <Avatar image={friend.image} name={friend.name} size={44} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-[#1B2A4A] dark:text-[#e8edf4]">
                          {friend.name ?? friend.email}
                        </p>
                        {friend.name && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{friend.email}</p>
                        )}
                      </div>
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
                        className="shrink-0"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>

                    {/* Remove with inline confirmation */}
                    {removingId === friend.friendshipId ? (
                      <div className="flex items-center gap-1 shrink-0">
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
                      <button
                        onClick={() => setRemovingId(friend.friendshipId)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
                        title="Remove friend"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="17" y1="11" x2="23" y2="11" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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
