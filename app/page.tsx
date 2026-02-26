"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  PanInfo,
} from "framer-motion";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Place, FriendSignal } from "@/lib/types";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useSavePlace } from "@/lib/use-save-place";
import { SwipeCard } from "@/components/SwipeCard";
import { DistanceBubble, BudgetBubble } from "@/components/Filters";
import { SignInModal } from "@/components/SignInModal";
import { ShareModal } from "@/components/ShareModal";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { loadSkippedForIntent, persistSkippedForIntent, clearSkippedForIntent } from "@/lib/storage";
import { setPendingVisit, checkPendingVisitProximity, verifyVisitOnServer, clearPendingVisit } from "@/lib/use-visit-tracker";
import { useBadges } from "@/components/providers/BadgeProvider";
import VisitCelebration from "@/components/VisitCelebration";

const categories = [
  { id: "study", emoji: "\u{1F4DA}", label: "Study / Work" },
  { id: "date", emoji: "\u{2764}\u{FE0F}", label: "Date / Chill" },
  { id: "trending", emoji: "\u{1F525}", label: "Trending Now" },
  { id: "quiet", emoji: "\u{1F92B}", label: "Quiet Cafés" },
  { id: "laptop", emoji: "\u{1F50C}", label: "Laptop-Friendly" },
  { id: "group", emoji: "\u{1F46F}", label: "Group Hangouts" },
  { id: "budget", emoji: "\u{1F354}", label: "Budget Eats" },
  { id: "coffee", emoji: "\u{2615}", label: "Coffee & Catch-Up" },
  { id: "outdoor", emoji: "\u{1F305}", label: "Outdoor / Patio" },
];

const FALLBACK_GRADIENTS = [
  "from-amber-800 via-orange-700 to-yellow-600",
  "from-slate-800 via-slate-600 to-cyan-700",
  "from-green-800 via-emerald-700 to-teal-600",
  "from-purple-900 via-violet-700 to-fuchsia-600",
  "from-stone-800 via-stone-600 to-orange-800",
  "from-rose-900 via-red-800 to-pink-700",
  "from-indigo-800 via-blue-700 to-sky-600",
  "from-teal-800 via-emerald-600 to-lime-600",
  "from-pink-800 via-rose-600 to-orange-500",
  "from-gray-800 via-zinc-600 to-stone-500",
];

// Default: downtown Toronto
const DEFAULT_LAT = 43.6532;
const DEFAULT_LNG = -79.3832;

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;
const TAP_MOVE_LIMIT = 10;
const TAP_TIME_LIMIT = 200;

const PREFS_KEY = "whereto_prefs";
// --- Main Page ---

export default function Home() {
  const router = useRouter();
  const { triggerBadgeCheck } = useBadges();
  const [intent, setIntent] = useState("trending");
  const [radius, setRadius] = useState(5000);
  const [priceFilter, setPriceFilter] = useState("All");
  const [prefsApplied, setPrefsApplied] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  // skippedPerIntent: per-intent set of placeIds that have been swiped (left=persisted, right/up=session-only)
  const [skippedPerIntent, setSkippedPerIntent] = useState<Record<string, Set<string>>>({});
  const [recommendations, setRecommendations] = useState<Place[]>([]);
  const [shareModalPlace, setShareModalPlace] = useState<{ placeId: string; name: string } | null>(null);
  const [visitedPlaceIds, setVisitedPlaceIds] = useState<Set<string>>(new Set());
  const [celebrationPlace, setCelebrationPlace] = useState<string | null>(null);

  const chipScrollRef = useRef<HTMLDivElement>(null);
  const locationResolved = useRef(false);
  const { handleSave, handleUnsave } = useSavePlace();
  const { status } = useSession();
  const sessionStatusRef = useRef(status);

  useEffect(() => {
    sessionStatusRef.current = status;
    if (status === "loading") return;
    if (!localStorage.getItem("whereto_seen_landing")) {
      router.replace("/landing");
    } else if (!localStorage.getItem("hasSeenTutorial")) {
      setShowTutorial(true);
    }
  }, [status, router]);

  // Apply saved preferences on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { defaultIntent?: string; defaultDistance?: number };
        if (p.defaultIntent) setIntent(p.defaultIntent);
        if (p.defaultDistance) setRadius(p.defaultDistance);
      }
    } catch {
      // ignore
    }
    setPrefsApplied(true);
  }, []);

  // Fetch visited place IDs
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/visits")
      .then(r => r.ok ? r.json() : [])
      .then((data: { placeId: string }[]) => {
        setVisitedPlaceIds(new Set(data.map(v => v.placeId)));
      })
      .catch(() => { });
  }, [status]);

  // Check pending visit proximity on mount (Go Now flow)
  useEffect(() => {
    if (status !== "authenticated") return;
    checkPendingVisitProximity().then(async (pending) => {
      if (!pending) return;
      const result = await verifyVisitOnServer(
        pending.placeId, pending.lat, pending.lng, "go_now"
      );
      if (result) {
        clearPendingVisit();
        setVisitedPlaceIds(prev => new Set([...prev, pending.placeId]));
        setCelebrationPlace(result.name);
        triggerBadgeCheck();
      }
    });
  }, [status]);

  // Load persisted skipped IDs when intent changes
  useEffect(() => {
    const stored = loadSkippedForIntent(intent);
    if (stored.size > 0) {
      setSkippedPerIntent(prev => ({
        ...prev,
        [intent]: new Set([...(prev[intent] ?? new Set()), ...stored]),
      }));
    }
  }, [intent]);

  // Load saved place IDs when authenticated
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/saves")
      .then(r => r.ok ? r.json() : [])
      .then((data: { placeId?: string }[]) => {
        if (Array.isArray(data)) {
          setSavedPlaceIds(new Set(data.map(s => s.placeId).filter(Boolean) as string[]));
        }
      })
      .catch(() => { });
  }, [status]);

  // Fetch unseen recommendations
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/recommendations")
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{
        recommendationId: string;
        note: string | null;
        sender: { name: string | null; image: string | null };
        place: Place;
      }>) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const recPlaces: Place[] = data.map(rec => ({
          ...rec.place,
          recommendationId: rec.recommendationId,
          recommendedBy: rec.sender,
          recommenderNote: rec.note,
        }));
        setRecommendations(recPlaces);
      })
      .catch(() => { });
  }, [status]);

  // Get user location after prefs are applied
  useEffect(() => {
    if (!prefsApplied || locationResolved.current) return;
    locationResolved.current = true;

    let autoDetect = true;
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { autoDetectLocation?: boolean };
        if (p.autoDetectLocation === false) autoDetect = false;
      }
    } catch {
      // ignore
    }

    if (!autoDetect || !navigator.geolocation) {
      setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      },
      { timeout: 8000 }
    );
  }, [prefsApplied]);

  const fetchPlaces = useCallback(async (loc: { lat: number; lng: number }, intentId: string, rad: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places?intent=${intentId}&lat=${loc.lat}&lng=${loc.lng}&radius=${rad}`
      );
      const data = await res.json();
      const rawPlaces: Place[] = data.places ?? [];
      setPlaces(rawPlaces);

      if (rawPlaces.length > 0 && sessionStatusRef.current === "authenticated") {
        fetch("/api/friends/place-signals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeIds: rawPlaces.map((p) => p.placeId) }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then(async (signals: Record<string, FriendSignal[]> | null) => {
            if (!signals || Object.keys(signals).length === 0) return;

            // Collect unique friend IDs across all signals
            const friendIds = new Set<string>();
            for (const friends of Object.values(signals)) {
              for (const f of friends) friendIds.add(f.userId);
            }

            // Fetch compatibility scores in parallel
            const scoreEntries = await Promise.all(
              [...friendIds].map(async (fid) => {
                try {
                  const r = await fetch(`/api/friends/${fid}/compatibility`);
                  if (!r.ok) return [fid, undefined] as const;
                  const data = await r.json() as { score: number };
                  return [fid, data.score] as const;
                } catch {
                  return [fid, undefined] as const;
                }
              })
            );
            const scoreMap = Object.fromEntries(scoreEntries.filter(([, s]) => s !== undefined)) as Record<string, number>;

            // Attach scores to each FriendSignal and merge into places
            setPlaces((prev) =>
              prev.map((p) => {
                if (!signals[p.placeId]) return p;
                const enriched = signals[p.placeId].map((f) =>
                  scoreMap[f.userId] !== undefined
                    ? { ...f, tasteScore: scoreMap[f.userId] }
                    : f
                );
                return { ...p, friendSaves: enriched };
              })
            );
          })
          .catch(() => { });
      }
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation && prefsApplied) {
      fetchPlaces(userLocation, intent, radius);
    }
  }, [userLocation, intent, radius, fetchPlaces, prefsApplied]);

  // Derived: filter by budget, then by swiped cards
  const budgetFilteredPlaces = useMemo(() => {
    if (priceFilter === "All") return places;
    return places.filter(p => p.price.length <= priceFilter.length);
  }, [places, priceFilter]);

  const visiblePlaces = useMemo(() => {
    const skipped = skippedPerIntent[intent] ?? new Set<string>();
    const filtered = budgetFilteredPlaces.filter(p => !skipped.has(p.placeId));
    // Recommendation cards go first; they bypass intent/budget filters
    return [...recommendations, ...filtered];
  }, [budgetFilteredPlaces, skippedPerIntent, intent, recommendations]);

  const allDone = !loading && visiblePlaces.length === 0;
  const noBudgetMatches = !loading && places.length > 0 && budgetFilteredPlaces.length === 0;

  function addToSkipped(placeId: string, persist: boolean) {
    setSkippedPerIntent(prev => {
      const current = prev[intent] ?? new Set<string>();
      const updated = new Set([...current, placeId]);
      if (persist) persistSkippedForIntent(intent, updated);
      return { ...prev, [intent]: updated };
    });
  }

  function handleSwipeUpSync(place: Place) {
    if (sessionStatusRef.current === "authenticated") {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&destination_place_id=${place.placeId}`;
      // Use anchor click for reliable mobile browser popup handling
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  function handleSwipe(direction: "left" | "right" | "up") {
    const place = visiblePlaces[0];
    if (!place) return;

    // Recommendation card: mark seen, remove from recommendations state
    if (place.recommendationId) {
      fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [place.recommendationId] }),
      }).catch(() => { });
      setRecommendations(prev => prev.filter(r => r.recommendationId !== place.recommendationId));
      if (direction === "right" || direction === "up") {
        if (sessionStatusRef.current === "authenticated") {
          handleSave(place, intent, direction === "up" ? "go_now" : "save", place.recommendationId);
          setSavedPlaceIds(prev => new Set([...prev, place.placeId]));
        }
      }
      return;
    }

    if (direction === "right" || direction === "up") {
      if (sessionStatusRef.current !== "authenticated") {
        // Show sign-in modal; card already flew away, so add to session skipped
        addToSkipped(place.placeId, false);
        setShowSignInModal(true);
        return;
      }
      const action = direction === "up" ? "go_now" : "save";
      handleSave(place, intent, action);
      setSavedPlaceIds(prev => new Set([...prev, place.placeId]));
      // Session-only skip (don't persist saves)
      addToSkipped(place.placeId, false);
    } else {
      // Left swipe: persist to localStorage
      addToSkipped(place.placeId, true);
    }
  }

  function handleCardFlipAction(place: Place, action: "save" | "go_now") {
    if (sessionStatusRef.current !== "authenticated") {
      setShowSignInModal(true);
      return;
    }
    if (action === "save" && savedPlaceIds.has(place.placeId)) {
      // Toggle off — unsave
      handleUnsave(place.placeId);
      setSavedPlaceIds((prev) => { const next = new Set(prev); next.delete(place.placeId); return next; });
      return;
    }
    handleSave(place, intent, action);
    setSavedPlaceIds((prev) => new Set([...prev, place.placeId]));
    if (action === "go_now") {
      setPendingVisit(place);
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&destination_place_id=${place.placeId}`,
        "_blank"
      );
    }
  }

  function handleRefresh() {
    clearSkippedForIntent(intent);
    setSkippedPerIntent(prev => ({ ...prev, [intent]: new Set() }));
  }

  return (
    <div className="h-dvh bg-white dark:bg-[#0E1116] flex flex-col overflow-hidden pb-16">
      {/* Header */}
      <header className="shrink-0 px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
            WhereTo
          </h1>
          {!loading && !allDone && visiblePlaces.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {visiblePlaces.length} left
            </span>
          )}
        </div>
      </header>

      {/* Intent Chips */}
      <div className="shrink-0 px-5 py-3 pt-1">
        <div
          ref={chipScrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((cat) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={cat.id}
              onClick={() => setIntent(cat.id)}
              className={`
                shrink-0 px-4 py-2 rounded-full text-sm font-semibold snap-start
                transition-colors duration-200 cursor-pointer whitespace-nowrap
                ${intent === cat.id
                  ? "bg-[#E85D2A] text-white shadow-sm"
                  : "bg-gray-100 dark:bg-white/10 text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-200 dark:hover:bg-white/15"
                }
              `}
            >
              {cat.emoji} {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {(loading || !userLocation) ? (
        <div className="flex-1 relative px-4 pb-4">
          <div className="w-full h-full rounded-3xl bg-gray-100 dark:bg-[#161B22]/60 animate-pulse shadow-xl flex flex-col justify-end p-6 border border-gray-200/50 dark:border-white/5">
            <div className="w-2/3 h-8 bg-gray-200 dark:bg-white/10 rounded-xl mb-3"></div>
            <div className="w-1/2 h-4 bg-gray-200 dark:bg-white/10 rounded-lg mb-4"></div>
            <div className="flex gap-2 mt-2">
              <div className="w-16 h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div>
              <div className="w-20 h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin drop-shadow-md"
              style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
            />
          </div>
        </div>
      ) : noBudgetMatches ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 pb-12"
        >
          <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-[#161B22] flex items-center justify-center text-5xl mb-2 shadow-inner border border-gray-100 dark:border-white/5">
            💸
          </div>
          <h2 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">
            No places at this price
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[260px] leading-relaxed">
            No spots match the <strong>{priceFilter}</strong> budget for this vibe. Try a different price range.
          </p>
          <button
            onClick={() => setPriceFilter("All")}
            className="mt-2 px-6 py-3 rounded-full font-semibold text-white bg-[#E85D2A] hover:bg-[#d04e1f] transition-colors shadow-lg shadow-[#E85D2A]/30 active:scale-95"
          >
            Show all prices
          </button>
        </motion.div>
      ) : allDone ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 pb-12"
        >
          <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-[#161B22] flex items-center justify-center text-5xl mb-2 shadow-inner border border-gray-100 dark:border-white/5">
            {places.length === 0 ? "🗺️" : "✨"}
          </div>
          <h2 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">
            {places.length === 0 ? "Nothing nearby" : "You're all caught up!"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[260px] leading-relaxed">
            {places.length === 0
              ? `We couldn't find any spots for this vibe within ${radius >= 1000 ? radius / 1000 + 'km' : radius + 'm'}.`
              : "You've swiped through all the spots for this vibe."}
          </p>
          {places.length === 0 ? (
            <button
              onClick={() => { setRadius(25000); setIntent("trending"); }}
              className="mt-4 px-6 py-3 rounded-full font-semibold text-white bg-[#E85D2A] hover:bg-[#d04e1f] transition-colors shadow-lg shadow-[#E85D2A]/30 active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
              Explore wider area
            </button>
          ) : (
            <button
              onClick={handleRefresh}
              className="mt-4 px-6 py-3 rounded-full font-semibold text-white bg-[#E85D2A] hover:bg-[#d04e1f] transition-colors shadow-lg shadow-[#E85D2A]/30 active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
              Refresh cards
            </button>
          )}
        </motion.div>
      ) : (
        <div className="flex-1 relative">
          <AnimatePresence>
            {visiblePlaces.slice(0, 3).reverse().map((place, i, arr) => {
              const isTop = i === arr.length - 1;
              const gradient = FALLBACK_GRADIENTS[place.name.length % FALLBACK_GRADIENTS.length];
              const isSaved = savedPlaceIds.has(place.placeId);

              return (
                <SwipeCard
                  key={place.recommendationId ?? place.placeId}
                  place={place}
                  fallbackGradient={gradient}
                  onSwipe={handleSwipe}
                  onSwipeUpSync={() => handleSwipeUpSync(place)}
                  isTop={isTop}
                  isSaved={isSaved}
                  isVisited={visitedPlaceIds.has(place.placeId)}
                  onAction={(action) => handleCardFlipAction(place, action)}
                  onShare={() => setShareModalPlace({ placeId: place.placeId, name: place.name })}
                />
              );
            })}
          </AnimatePresence>

          {/* Filter Bubbles – float over card */}
          <div className="absolute top-7 right-7 z-30 flex items-center gap-2">
            <BudgetBubble priceFilter={priceFilter} onPriceFilterChange={setPriceFilter} />
            <DistanceBubble radius={radius} onRadiusChange={setRadius} />
          </div>
        </div>
      )}

      {/* Sign-In Modal */}
      <AnimatePresence>
        {showSignInModal && (
          <SignInModal onClose={() => setShowSignInModal(false)} />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModalPlace && (
          <ShareModal
            place={shareModalPlace}
            onClose={() => setShareModalPlace(null)}
          />
        )}
      </AnimatePresence>

      {/* Onboarding Tutorial */}
      {!loading && showTutorial && (
        <OnboardingTutorial
          onDismiss={() => {
            localStorage.setItem("hasSeenTutorial", "true");
            setShowTutorial(false);
          }}
        />
      )}

      {/* Visit Celebration */}
      {celebrationPlace && (
        <VisitCelebration
          placeName={celebrationPlace}
          onClose={() => setCelebrationPlace(null)}
        />
      )}
    </div>
  );
}
