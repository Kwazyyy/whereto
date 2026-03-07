"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useRouter } from "next/navigation";
import { useSavePlace } from "@/lib/use-save-place";
import PlaceDetailSheet from "@/components/PlaceDetailSheet";
import type { CompatibilityResult } from "@/lib/tasteScore";
import type { Place } from "@/lib/types";
import { Avatar, CompatibilityDrawer, scoreBadgeClass, type Friend } from "@/components/CompatibilityDrawer";
import { AddFriendModal } from "@/components/AddFriendModal";
import { FriendsListModal } from "@/components/FriendsListModal";
import { useToast } from "@/components/Toast";
import { relativeTime } from "@/lib/utils/time";

// ── Types ──────────────────────────────────────────────────────────────────

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
    actorUsername?: string | null;
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
    actorUsername?: string | null;
    place: PlaceShape;
    note: string | null;
    createdAt: string;
  }
  | {
    id: string;
    type: "visit";
    actorName: string | null;
    actorImage: string | null;
    actorId: string;
    actorUsername?: string | null;
    place: PlaceShape;
    createdAt: string;
  };

interface MatchItem {
  place: PlaceShape;
  friends: { id: string; name: string | null; image: string | null }[];
}

// ── Components ─────────────────────────────────────────────────────────────

function ActivityPlaceThumbnail({ photoRef }: { photoRef?: string | null }) {
  const url = usePhotoUrl(photoRef ?? null);
  return (
    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1C2128] relative">
      {url ? (
        <Image src={url} alt="" fill className="object-cover" unoptimized />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xl">📍</div>
      )}
    </div>
  );
}

function MiniThumb({ photoRef }: { photoRef?: string | null }) {
  const url = usePhotoUrl(photoRef ?? null);
  return (
    <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-[#161B22] bg-[#1C2128] relative shrink-0">
      {url ? (
        <Image src={url} alt="" fill className="object-cover" unoptimized />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[10px]">📍</div>
      )}
    </div>
  );
}

function ActivityCard({ item, onTap, index }: { item: ActivityItem; onTap: (p: PlaceShape) => void; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const firstName = item.actorName?.split(" ")[0] ?? "A friend";
  const username = item.actorUsername ? `@${item.actorUsername}` : null;

  if (item.type === "save_group") {
    const count = item.places.length;
    const isSingle = count === 1;
    const p = item.places[0];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white dark:bg-[#161B22] rounded-xl p-4 border border-gray-100 dark:border-[#30363D] cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors mb-3"
        onClick={() => (isSingle ? onTap(p) : setExpanded((e) => !e))}
      >
        <div className="flex items-start gap-3">
          <Avatar image={item.actorImage} name={item.actorName} size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap leading-none mb-1">
              <span className="font-bold text-[#0E1116] dark:text-[#e8edf4] text-sm">{item.actorName}</span>
              {username && <span className="text-xs text-gray-400 dark:text-gray-500">{username}</span>}
              <span className="text-xs text-[#8B949E] ml-1">{relativeTime(item.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-1.5 line-clamp-1">
              <span className="text-base leading-none">🔖</span> {firstName} saved {isSingle ? p.name : `${count} places`}
            </p>

            {isSingle ? (
              <div className="flex items-center gap-3">
                <ActivityPlaceThumbnail photoRef={p.photoRef} />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-[#0E1116] dark:text-[#e8edf4] text-sm truncate">{p.name}</span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                    {p.tags?.[0] && <span className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">{p.tags[0]}</span>}
                    {p.price && <span>{p.price}</span>}
                    {p.rating > 0 && <span>★ {p.rating}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {item.places.slice(0, 4).map((pl) => (
                    <MiniThumb key={pl.placeId} photoRef={pl.photoRef} />
                  ))}
                  {count > 4 && (
                    <div className="w-8 h-8 rounded-md border-2 border-[#161B22] bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                      +{count - 4}
                    </div>
                  )}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
              </div>
            )}
          </div>
        </div>

        {expanded && !isSingle && (
          <div className="mt-3 ml-[52px] border-l-2 border-gray-100 dark:border-[#30363D] pl-3 space-y-3">
            {item.places.map((place) => (
              <div key={place.placeId} onClick={(e) => { e.stopPropagation(); onTap(place); }} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 p-1.5 -ml-1.5 rounded-lg cursor-pointer transition-colors">
                <ActivityPlaceThumbnail photoRef={place.photoRef} />
                <div className="flex flex-col min-w-0 truncate">
                  <span className="font-semibold text-sm text-[#0E1116] dark:text-[#e8edf4] truncate">{place.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{place.address}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // Recommendation
  if (item.type === "recommendation") {
    const p = item.place;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white dark:bg-[#161B22] rounded-xl p-4 border border-gray-100 dark:border-[#30363D] cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors mb-3"
        onClick={() => onTap(p)}
      >
        <div className="flex items-start gap-3">
          <Avatar image={item.actorImage} name={item.actorName} size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap leading-none mb-1">
              <span className="font-bold text-[#0E1116] dark:text-[#e8edf4] text-sm">{item.actorName}</span>
              {username && <span className="text-xs text-gray-400 dark:text-gray-500">{username}</span>}
              <span className="text-xs text-[#8B949E] ml-1">{relativeTime(item.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-1.5 line-clamp-1">
              <span className="text-base leading-none">💌</span> {firstName} sent a recommendation
            </p>
            <div className="flex items-center gap-3">
              <ActivityPlaceThumbnail photoRef={p.photoRef} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-semibold text-[#0E1116] dark:text-[#e8edf4] text-sm truncate">{p.name}</span>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                  {p.tags?.[0] && <span className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">{p.tags[0]}</span>}
                  {p.price && <span>{p.price}</span>}
                  {p.rating > 0 && <span>★ {p.rating}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Visit (Fallback)
  return null;
}


// ── Main Page ──────────────────────────────────────────────────────────────

export default function SocialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"feed" | "friends" | "inbox">("feed");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [recs, setRecs] = useState<MissedRec[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & States
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [friendsListOpen, setFriendsListOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [detailPlace, setDetailPlace] = useState<PlaceShape | null>(null);
  const { handleSave } = useSavePlace();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [friendsRes, activityRes, recsRes, matchesRes] = await Promise.all([
        fetch("/api/friends").catch(() => null),
        fetch("/api/activity").catch(() => null),
        fetch("/api/recommendations?all=true").catch(() => null),
        fetch("/api/social/matches").catch(() => null)
      ]);

      if (friendsRes?.ok) {
        const data = await friendsRes.json();
        const fArray = data.friends || [];
        setFriends(fArray);

        if (fArray.length > 0) {
          const scores = await Promise.all(
            fArray.map(async (f: Friend) => {
              try {
                const r = await fetch(`/api/friends/${f.userId}/compatibility`);
                if (!r.ok) return { userId: f.userId, compat: null };
                const c = await r.json() as CompatibilityResult;
                return { userId: f.userId, compat: c };
              } catch { return { userId: f.userId, compat: null }; }
            })
          );
          const scoreMap = Object.fromEntries(scores.map(s => [s.userId, s.compat]));
          setFriends(prev => prev.map(f => ({ ...f, compatibility: scoreMap[f.userId] })));
        }
      }

      if (activityRes?.ok) {
        const data = await activityRes.json();
        setActivity(Array.isArray(data) ? data : []);
      }

      if (recsRes?.ok) {
        const data = await recsRes.json();
        setRecs(Array.isArray(data) ? data.filter((r: MissedRec) => !r.seen) : []);
      }

      if (matchesRes?.ok) {
        const data = await matchesRes.json();
        setMatches(Array.isArray(data) ? data : []);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData();
    else if (status === "unauthenticated") setLoading(false);
  }, [status, fetchData]);

  async function handleDismissRec(rec: MissedRec) {
    await fetch(`/api/recommendations/${rec.recommendationId}`, { method: "DELETE" });
    setRecs((prev) => prev.filter((r) => r.recommendationId !== rec.recommendationId));
  }

  async function handleSaveRec(rec: MissedRec) {
    await handleSave(rec.place, "trending", "save", rec.recommendationId);
    setRecs((prev) => prev.filter((r) => r.recommendationId !== rec.recommendationId));
  }

  const inviteUrl = `https://whereto-nu.vercel.app/invite?ref=${session?.user?.id ?? ""}`;
  const inviteShareText = "Check out WhereTo \u2014 discover the best caf\u00e9s and restaurants near you!";

  async function handleCopyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast("Link copied!");
    } catch {
      showToast("Failed to copy");
    }
  }

  function handleInviteWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${inviteShareText} ${inviteUrl}`)}`, "_blank");
  }

  function handleInviteTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${inviteShareText} ${inviteUrl}`)}`, "_blank");
  }

  const detailAsPlace: Place | null = detailPlace ? {
    placeId: detailPlace.placeId, name: detailPlace.name, address: detailPlace.address,
    location: detailPlace.location, price: detailPlace.price, rating: detailPlace.rating,
    photoRef: detailPlace.photoRef, type: detailPlace.type, tags: detailPlace.tags,
    openNow: detailPlace.openNow, hours: detailPlace.hours, distance: detailPlace.distance,
  } : null;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-24 max-w-6xl mx-auto px-6 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight mb-6 lg:hidden" style={{ color: "#E85D2A" }}>Social</h1>
        <div className="flex gap-8">
          <div className="w-full lg:w-[65%] space-y-3">
            <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
            <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0E1116] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#161B22] flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        </div>
        <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Sign in to see friends</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 mb-8 max-w-xs">Add friends and see what places they&apos;re saving.</p>
        <button onClick={() => signIn("google")} className="flex items-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-white dark:bg-[#161B22] border-2 border-gray-200 dark:border-white/10 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-[#1C2128] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" className="mx-auto"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          <span className="mx-auto pr-6">Sign in with Google</span>
        </button>
      </div>
    );
  }

  // Common UI Sections 
  const SidebarInbox = (
    <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-[#30363D] p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-base text-[#0E1116] dark:text-[#e8edf4]">📬 Inbox</h2>
        {recs.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{recs.length}</span>}
      </div>

      {recs.length === 0 ? (
        <p className="text-sm text-[#8B949E]">No recommendations yet. Your friends can send you places they think you&apos;d love!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {recs.slice(0, 5).map(rec => (
            <div key={rec.recommendationId} className="flex items-start gap-3">
              <Avatar image={rec.sender.image} name={rec.sender.name} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#0E1116] dark:text-[#e8edf4] leading-snug">
                  <span className="font-semibold">{rec.sender.name?.split(" ")[0] ?? "A friend"}</span> recommends <span className="font-semibold cursor-pointer hover:underline" onClick={() => setDetailPlace(rec.place)}>{rec.place.name}</span>
                </p>
                {rec.note && <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-2">&ldquo;{rec.note}&rdquo;</p>}
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => handleSaveRec(rec)} className="bg-[#E85D2A] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#d65222] transition-colors">Save</button>
                  <button onClick={() => handleDismissRec(rec)} className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const SidebarMatches = (
    <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-[#30363D] p-4 mb-4">
      <div className="mb-3">
        <h2 className="font-semibold text-base text-[#0E1116] dark:text-[#e8edf4] flex items-center gap-1.5">🎯 It&apos;s a Match!</h2>
        <p className="text-sm text-[#8B949E] mt-0.5">Places you and your friends both saved</p>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-[#8B949E]">Save more places to discover matches with friends!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.slice(0, 5).map(m => {
            const fName = m.friends[0]?.name?.split(" ")[0] ?? "Friend";
            const friendText = m.friends.length > 1 ? `You & ${m.friends.length} friends` : `You & ${fName}`;

            return (
              <div key={m.place.placeId} className="flex items-center gap-3 cursor-pointer group" onClick={() => setDetailPlace(m.place)}>
                <div className="relative shrink-0">
                  <ActivityPlaceThumbnail photoRef={m.place.photoRef} />
                  <div className="absolute -bottom-2 -right-2 ring-2 ring-white dark:ring-[#161B22] rounded-full">
                    <Avatar image={m.friends[0]?.image} name={m.friends[0]?.name} size={24} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pl-1">
                  <p className="text-xs font-bold text-[#E85D2A] mb-0.5">{friendText}</p>
                  <p className="text-[13px] font-semibold text-[#0E1116] dark:text-[#e8edf4] truncate">{m.place.name}</p>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="text-gray-500 dark:text-gray-400 truncate pr-2">
                      {m.place.tags?.[0] ?? "Spot"}
                    </span>
                    <span className="text-[#E85D2A] font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Plan It &rarr;</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );

  const SidebarFriends = (
    <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-[#30363D] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base text-[#0E1116] dark:text-[#e8edf4]">Friends <span className="text-[#8B949E] text-sm ml-1">{friends.length}</span></h2>
        <div className="flex items-center gap-3">
          {friends.length > 0 && (
            <button onClick={() => setFriendsListOpen(true)} className="text-sm font-medium text-[#8B949E] cursor-pointer hover:text-[#E85D2A] transition-colors duration-200">See all</button>
          )}
          <button onClick={() => setAddFriendOpen(true)} className="text-sm font-medium text-[#8B949E] cursor-pointer hover:text-[#E85D2A] transition-colors duration-200">Add</button>
        </div>
      </div>

      {friends.length === 0 ? (
        <button onClick={() => setAddFriendOpen(true)} className="w-full py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-semibold text-[#0E1116] dark:text-[#e8edf4]">Add Friend</button>
      ) : (
        <div className="flex flex-col">
          {friends.slice(0, 5).map(f => {
            const score = f.compatibility?.score;
            return (
              <div
                key={f.userId}
                onClick={() => setSelectedFriend(f)}
                className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1C2128] rounded-lg px-2 transition-colors"
              >
                <Avatar image={f.image} name={f.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0E1116] dark:text-[#C9D1D9] truncate">{f.name ?? f.email?.split("@")[0]}</p>
                </div>
                {score != null && (
                  <span className="text-xs text-[#E85D2A] font-semibold shrink-0">{score}% match</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-[#0E1116] pb-24">
      {/* ── DESKTOP LAYOUT (>=1024px) ── */}
      <div className="hidden lg:block max-w-6xl mx-auto px-6 pt-5">
        <div className="pt-1"></div>

        <div className="flex gap-8 items-start">
          {/* Left Column (65%) */}
          <div className="w-[65%] flex flex-col gap-3 pb-10">
            <AnimatePresence mode="popLayout">
              {activity.length === 0 ? (
                <div className="bg-white dark:bg-[#161B22] border border-gray-100 dark:border-[#30363D] rounded-xl p-12 text-center">
                  <div className="text-4xl mb-4">🌍</div>
                  <h3 className="text-lg font-bold text-[#0E1116] dark:text-[#e8edf4]">No activity yet</h3>
                  <p className="text-sm text-gray-500 mt-2">Add friends to see what places they are discovering!</p>
                </div>
              ) : (
                activity.map((item, idx) => <ActivityCard key={item.id} item={item} onTap={setDetailPlace} index={idx} />)
              )}
            </AnimatePresence>
          </div>

          {/* Right Column (35%) Sticky */}
          <div className="w-[35%] sticky top-20">
            {SidebarInbox}
            {SidebarMatches}
            {SidebarFriends}
          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT (<1024px) ── */}
      <div className="lg:hidden">
        <header className="px-5 pt-5 pb-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#E85D2A]">Social</h1>
        </header>

        <div className="px-4 mb-4 flex gap-2">
          {(["feed", "friends", "inbox"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm rounded-full cursor-pointer transition-colors relative ${tab === t ? "bg-[#E85D2A] text-white font-semibold" : "bg-[#161B22] text-[#8B949E] border border-[#30363D] font-medium"}`}
            >
              {t === "feed" ? "Feed" : t === "friends" ? "Friends" : "Inbox"}
              {t === "inbox" && recs.length > 0 && <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-red-500" />}
            </button>
          ))}
        </div>

        <div className="px-5 pb-10">
          <AnimatePresence mode="wait">
            {tab === "feed" && (
              <motion.div key="feed" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-3">
                {activity.length === 0 ? (
                  <div className="text-center py-20 px-4">
                    <div className="text-4xl mb-3">🌍</div>
                    <p className="font-bold text-[#0E1116] dark:text-white">No activity yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add friends to see their saves!</p>
                  </div>
                ) : (
                  activity.map((item, idx) => <ActivityCard key={item.id} item={item} onTap={setDetailPlace} index={idx} />)
                )}
              </motion.div>
            )}

            {tab === "friends" && (
              <motion.div key="friends" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex flex-col gap-4">
                {/* Add Friend button */}
                <button
                  onClick={() => setAddFriendOpen(true)}
                  className="w-full border border-[#E85D2A] text-[#E85D2A] rounded-xl px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-[#E85D2A]/10 transition-colors"
                >
                  Add Friend
                </button>

                {/* Friends List */}
                <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-[#30363D] p-4">
                  <h2 className="font-semibold text-base text-[#0E1116] dark:text-[#e8edf4] mb-3">
                    Friends <span className="text-[#8B949E] text-sm ml-1">{friends.length}</span>
                  </h2>
                  {friends.length === 0 ? (
                    <p className="text-sm text-[#8B949E]">No friends yet. Add friends to see what they&apos;re saving!</p>
                  ) : (
                    <div className="flex flex-col">
                      {friends.map(f => {
                        const score = f.compatibility?.score;
                        return (
                          <div
                            key={f.userId}
                            onClick={() => setSelectedFriend(f)}
                            className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1C2128] rounded-lg px-2 transition-colors"
                          >
                            <Avatar image={f.image} name={f.name} size={40} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0E1116] dark:text-[#C9D1D9] truncate">{f.name ?? f.email?.split("@")[0]}</p>
                            </div>
                            {score != null && (
                              <span className="text-xs text-[#E85D2A] font-semibold shrink-0">{score}% match</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* It's a Match! */}
                {SidebarMatches}

                {/* Invite Friends */}
                <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-[#30363D] p-4">
                  <p className="text-sm font-semibold text-[#0E1116] dark:text-[#C9D1D9] mb-3">Invite Friends</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyInviteLink}
                      className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-[#30363D] hover:border-[#E85D2A] cursor-pointer transition-colors duration-200"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B949E]">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span className="text-xs text-[#8B949E]">Copy Link</span>
                    </button>
                    <button
                      onClick={handleInviteWhatsApp}
                      className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-[#30363D] hover:border-[#E85D2A] cursor-pointer transition-colors duration-200"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#8B949E]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span className="text-xs text-[#8B949E]">WhatsApp</span>
                    </button>
                    <button
                      onClick={handleInviteTwitter}
                      className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-[#30363D] hover:border-[#E85D2A] cursor-pointer transition-colors duration-200"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#8B949E]">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span className="text-xs text-[#8B949E]">X / Twitter</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "inbox" && (
              <motion.div key="inbox" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                {SidebarInbox}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals & Overlays ── */}
      <AnimatePresence>
        {detailAsPlace && (
          <PlaceDetailSheet
            place={detailAsPlace}
            fallbackGradient="from-amber-800 via-orange-700 to-yellow-600"
            isSaved={false}
            onClose={() => setDetailPlace(null)}
            onSave={(action) => handleSave(detailAsPlace, "trending", action)}
          />
        )}
      </AnimatePresence>

      {selectedFriend && (
        <CompatibilityDrawer
          friend={selectedFriend}
          compat={selectedFriend.compatibility}
          onClose={() => setSelectedFriend(null)}
          onCompare={() => { setSelectedFriend(null); router.push(`/social/compare/${selectedFriend.userId}`); }}
        />
      )}

      {addFriendOpen && <AddFriendModal onClose={() => setAddFriendOpen(false)} onSent={fetchData} />}
      {friendsListOpen && <FriendsListModal onClose={() => setFriendsListOpen(false)} />}
    </div>
  );
}
