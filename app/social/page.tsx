"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useRouter } from "next/navigation";
import { useSavePlace } from "@/lib/use-save-place";
import PlaceDetailSheet from "@/components/PlaceDetailSheet";
import type { CompatibilityResult } from "@/lib/tasteScore";
import type { Place } from "@/lib/types";
import { MapPin, Bookmark, Mail, Inbox, Target, Globe, Users, UserPlus } from "lucide-react";
import { Avatar, CompatibilityDrawer, scoreBadgeClass, type Friend } from "@/components/CompatibilityDrawer";
import { AddFriendModal } from "@/components/AddFriendModal";
import { FriendsListModal } from "@/components/FriendsListModal";
import { useToast } from "@/components/Toast";
import { relativeTime } from "@/lib/utils/time";
import { TabTooltip } from "@/components/onboarding/TabTooltip";

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
        <div className="w-full h-full flex items-center justify-center"><MapPin className="w-5 h-5 text-[#8B949E]" /></div>
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
        <div className="w-full h-full flex items-center justify-center"><MapPin className="w-3 h-3 text-[#8B949E]" /></div>
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
              <Bookmark className="w-4 h-4 text-[#E85D2A] shrink-0" /> {firstName} saved {isSingle ? p.name : `${count} places`}
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
              <Mail className="w-4 h-4 text-[#E85D2A] shrink-0" /> {firstName} sent a recommendation
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

  const detailAsPlace: Place | null = detailPlace ? {
    placeId: detailPlace.placeId, name: detailPlace.name, address: detailPlace.address,
    location: detailPlace.location, price: detailPlace.price, rating: detailPlace.rating,
    photoRef: detailPlace.photoRef, type: detailPlace.type, tags: detailPlace.tags,
    openNow: detailPlace.openNow, hours: detailPlace.hours, distance: detailPlace.distance,
  } : null;

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-32 lg:pb-6 max-w-6xl mx-auto px-6 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0E1116] dark:text-white">Social</h1>
          <p className="text-[#656D76] dark:text-[#8B949E] text-sm mt-1">See what your friends are saving</p>
        </div>
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
    router.replace("/auth");
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  // Common UI Sections
  const SidebarInbox = (
    <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-[#30363D] p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-base text-[#0E1116] dark:text-[#e8edf4] flex items-center gap-1.5"><Inbox className="w-4 h-4 text-[#E85D2A]" /> Inbox</h2>
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
        <h2 className="font-semibold text-base text-[#0E1116] dark:text-[#e8edf4] flex items-center gap-1.5"><Target className="w-4 h-4 text-[#E85D2A]" /> It&apos;s a Match!</h2>
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
    <div className="min-h-dvh bg-gray-50 dark:bg-[#0E1116] pb-32 lg:pb-6">
      <TabTooltip
        storageKey="hasSeenSocialTooltips"
        steps={[
          { title: "Your Food Crew", description: "Add friends and see how your taste compares.", animationKey: "social-crew" },
          { title: "Recs From Friends", description: "When a friend recommends a spot, it shows up right here.", animationKey: "social-recs" },
        ]}
      />
      {/* ── DESKTOP LAYOUT (>=1024px) ── */}
      <div className="hidden lg:block max-w-6xl mx-auto px-6 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0E1116] dark:text-white">Social</h1>
          <p className="text-[#656D76] dark:text-[#8B949E] text-sm mt-1">See what your friends are saving</p>
        </div>

        <div className="flex gap-8 items-start">
          {/* Left Column (65%) */}
          <div className="w-[65%] flex flex-col gap-3 pb-10">
            <AnimatePresence mode="popLayout">
              {activity.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12">
                  <Users size={48} className="text-[#E85D2A] mb-4 mx-auto" />
                  <h2 className="text-xl font-semibold text-[#0E1116] dark:text-white mb-2">Your feed is waiting</h2>
                  <p className="text-[#8B949E] text-sm max-w-[300px] mx-auto mb-6">Add friends to see what places they&apos;re discovering around the city.</p>
                  <button onClick={() => setAddFriendOpen(true)} className="bg-[#E85D2A] hover:bg-[#D14E1F] text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 inline-flex items-center gap-2">
                    <UserPlus size={16} />
                    Add a friend
                  </button>
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
        <header className="px-5 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-[#0E1116] dark:text-white">Social</h1>
          <p className="text-[#656D76] dark:text-[#8B949E] text-sm mt-1">See what your friends are saving</p>
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
                  <div className="flex flex-col items-center text-center py-12">
                    <Users size={48} className="text-[#E85D2A] mb-4 mx-auto" />
                    <h2 className="text-xl font-semibold text-[#0E1116] dark:text-white mb-2">Your feed is waiting</h2>
                    <p className="text-[#8B949E] text-sm max-w-[300px] mx-auto mb-6">Add friends to see what places they&apos;re discovering around the city.</p>
                    <button onClick={() => setAddFriendOpen(true)} className="bg-[#E85D2A] hover:bg-[#D14E1F] text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 inline-flex items-center gap-2">
                      <UserPlus size={16} />
                      Add a friend
                    </button>
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
