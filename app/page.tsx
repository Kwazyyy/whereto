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
import { loadSkipped, persistSkipped, clearSkipped } from "@/lib/storage";
import { setPendingVisit, checkPendingVisitProximity, verifyVisitOnServer, clearPendingVisit } from "@/lib/use-visit-tracker";
import { useBadges } from "@/components/providers/BadgeProvider";
import { useNeighborhoodReveal } from "@/components/providers/NeighborhoodRevealProvider";
import { useVibeVoting } from "@/components/providers/VibeVotingProvider";
import { Theme } from "@/components/ThemeProvider";
import Link from 'next/link';
import { BookOpen, Heart, Flame, Coffee, Laptop, Users, DollarSign, MessageCircle, Sun, Sparkles, MapPin, Sofa } from "lucide-react";
import VisitCelebration from "@/components/VisitCelebration";
import PhotoUploadPrompt from "@/components/PhotoUploadPrompt";
import { useToast } from "@/components/Toast";
import { shouldShowNudge, NUDGE_10_SAVES_SHARE } from "@/lib/nudges";
import NudgeModal from "@/components/nudges/NudgeModal";
import { isNativePlatform } from "@/lib/is-native";

const categories = [
  { id: "study_work", icon: BookOpen, label: "Study / Work" },
  { id: "romantic", icon: Heart, label: "Romantic" },
  { id: "chill", icon: Sofa, label: "Chill Vibes" },
  { id: "trending", icon: Flame, label: "Trending Now" },
  { id: "quiet_cafes", icon: Coffee, label: "Quiet Cafés" },
  { id: "laptop_friendly", icon: Laptop, label: "Laptop-Friendly" },
  { id: "group_hangouts", icon: Users, label: "Group Hangouts" },
  { id: "budget_eats", icon: DollarSign, label: "Budget Eats" },
  { id: "coffee_catch_up", icon: MessageCircle, label: "Coffee & Catch-Up" },
  { id: "outdoor_patio", icon: Sun, label: "Outdoor / Patio" },
];

const CATEGORY_LABELS: Record<string, string> = {};
for (const c of categories) CATEGORY_LABELS[c.id] = c.label;

// Migrate old intent IDs from localStorage prefs to new format
const LEGACY_INTENT_MAP: Record<string, string> = {
  study: "study_work",
  date: "romantic",
  date_chill: "romantic",
  quiet: "quiet_cafes",
  laptop: "laptop_friendly",
  group: "group_hangouts",
  budget: "budget_eats",
  desserts: "coffee_catch_up",
  coffee: "coffee_catch_up",
  outdoor: "outdoor_patio",
};

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
const TAP_MOVE_LIMIT = 10;
const TAP_TIME_LIMIT = 200;

const PREFS_KEY = "savrd_prefs";
const MAX_INTENTS = 3;

// --- Main Page ---

export default function Home() {
  const router = useRouter();
  const { triggerBadgeCheck } = useBadges();
  const { triggerNeighborhoodReveal } = useNeighborhoodReveal();
  const { triggerVibeVoting } = useVibeVoting();
  const { showToast } = useToast();
  const [selectedIntents, setSelectedIntents] = useState<string[]>(["trending"]);
  const [radius, setRadius] = useState(5000);
  const [priceFilter, setPriceFilter] = useState("All");
  const [prefsApplied, setPrefsApplied] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<Place[]>([]);
  const [shareModalPlace, setShareModalPlace] = useState<{ placeId: string; name: string } | null>(null);
  const [visitedPlaceIds, setVisitedPlaceIds] = useState<Set<string>>(new Set());
  const [visitData, setVisitData] = useState<Map<string, { count: number; lastVisitedAt: string }>>(new Map());
  const [celebrationPlace, setCelebrationPlace] = useState<{ placeId: string; name: string } | null>(null);
  const [photoPromptPlace, setPhotoPromptPlace] = useState<{ placeId: string; name: string } | null>(null);
  const [featuredPlace, setFeaturedPlace] = useState<(Place & { placementId: string }) | null>(null);
  const featuredImpressionSent = useRef<string | null>(null);
  const [showSavesNudge, setShowSavesNudge] = useState(false);

  const chipScrollRef = useRef<HTMLDivElement>(null);
  const locationResolved = useRef(false);
  const { handleSave, handleUnsave } = useSavePlace((totalSaves) => {
    if (totalSaves >= 10 && shouldShowNudge(NUDGE_10_SAVES_SHARE)) {
      setTimeout(() => setShowSavesNudge(true), 1000);
    }
  });
  const { data: session, status } = useSession();
  const sessionStatusRef = useRef(status);

  // Stable key for the current intent combination (sorted for consistency)
  const intentKey = useMemo(() => [...selectedIntents].sort().join(","), [selectedIntents]);
  // First intent used for saving and featured placements
  const primaryIntent = selectedIntents[0];

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aSel = selectedIntents.includes(a.id);
      const bSel = selectedIntents.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return 0;
    });
  }, [selectedIntents]);

  function handleChipTap(chipId: string) {
    setSelectedIntents((prev) => {
      if (prev.includes(chipId)) {
        // Deselecting — must keep at least 1
        if (prev.length <= 1) {
          showToast("Select at least one vibe");
          return prev;
        }
        return prev.filter((id) => id !== chipId);
      } else {
        // Selecting — max 3
        if (prev.length >= MAX_INTENTS) {
          showToast("Max 3 vibes at a time");
          return prev;
        }
        return [...prev, chipId];
      }
    });
    // Scroll the container back to the left smoothly so the active chip comes into view
    // (Wait a tick for React to re-render the sorted array first!)
    setTimeout(() => {
      chipScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    }, 50);
  }

  useEffect(() => {
    sessionStatusRef.current = status;
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(isNativePlatform() ? "/welcome" : "/landing");
      return;
    }
    if (session?.user && session.user.hasCompletedOnboarding === false) {
      router.replace("/onboarding");
      return;
    }
    setPageReady(true);
    if (!localStorage.getItem("hasSeenTutorial")) {
      setShowTutorial(true);
    }
  }, [status, session, router]);

  // Apply saved preferences on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      const p = raw ? JSON.parse(raw) as { defaultIntent?: string; defaultDistance?: number } : null;
      if (p?.defaultIntent) {
        // Migrate legacy intent IDs to new format
        const migrated = LEGACY_INTENT_MAP[p.defaultIntent] ?? p.defaultIntent;
        setSelectedIntents([migrated]);
      } else {
        // Fall back to onboarding vibe preferences if no manual pref saved yet
        const vibesRaw = localStorage.getItem("savrd-preferred-vibes");
        if (vibesRaw) {
          const vibes = JSON.parse(vibesRaw) as string[];
          const firstVibe = vibes[0];
          if (firstVibe && categories.some((c) => c.id === firstVibe)) {
            setSelectedIntents([firstVibe]);
          }
        }
      }
      if (p?.defaultDistance) setRadius(p.defaultDistance);
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
      .then((data: { placeId: string; visitCount?: number; verifiedAt?: string }[]) => {
        setVisitedPlaceIds(new Set(data.map(v => v.placeId)));
        const vd = new Map<string, { count: number; lastVisitedAt: string }>();
        for (const v of data) {
          vd.set(v.placeId, { count: v.visitCount ?? 1, lastVisitedAt: v.verifiedAt ?? "" });
        }
        setVisitData(vd);
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
        setCelebrationPlace({ placeId: pending.placeId, name: result.name });

        // Let the general celebration toast appear, then 1s later, pop the big overlay if it's a new hood
        setTimeout(async () => {
          let triggeredReveal = false;
          try {
            const nhRes = await fetch(`/api/exploration-stats/check-new-neighborhood?placeId=${pending.placeId}`);
            if (nhRes.ok) {
              const nhData = await nhRes.json();
              if (nhData.isNewNeighborhood && nhData.neighborhood) {
                triggerNeighborhoodReveal(nhData, () => {
                  triggerVibeVoting(pending.placeId, result.name);
                });
                triggeredReveal = true;
              }
            }
          } catch (e) {
            console.error("Neighborhood check failed", e);
          } finally {
            if (!triggeredReveal) {
              setTimeout(() => triggerVibeVoting(pending.placeId, result.name), 1000);
            }
            triggerBadgeCheck();
          }
        }, 1000);
      }
    });
  }, [status, triggerNeighborhoodReveal, triggerBadgeCheck]);

  // Load persisted skipped IDs (cross-intent, 24h TTL) on mount
  useEffect(() => {
    const stored = loadSkipped();
    if (stored.size > 0) setSkipped(stored);
  }, []);

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

    // Hard fallback: if the permission dialog never resolves (e.g. iOS WKWebView silently
    // blocking before NSLocationWhenInUseUsageDescription is configured, or user ignores
    // the dialog), force the default location after 10 s so the spinner doesn't hang.
    const fallbackTimer = setTimeout(() => {
      setUserLocation(prev => prev ?? { lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallbackTimer);
        console.log(`[Discover] geolocation success → lat=${pos.coords.latitude} lng=${pos.coords.longitude}`);
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        clearTimeout(fallbackTimer);
        console.log(`[Discover] geolocation error (${err.code}: ${err.message}) → using Toronto fallback`);
        setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      },
      { timeout: 8000 }
    );

    return () => clearTimeout(fallbackTimer);
  }, [prefsApplied]);

  const fetchFeatured = useCallback(async (loc: { lat: number; lng: number }, intentId: string, rad: number) => {
    try {
      const url = `/api/featured-placements?intent=${intentId}&lat=${loc.lat}&lng=${loc.lng}&distance=${rad}`;
      const res = await fetch(url);
      if (!res.ok) { setFeaturedPlace(null); return; }
      const data = await res.json();
      if (data.placement) {
        const p = data.placement;
        const vibeTags = Array.isArray(p.vibeTags) ? p.vibeTags as string[] : [];
        setFeaturedPlace({
          placeId: p.googlePlaceId,
          placementId: p.placementId,
          name: p.name,
          address: p.address ?? "",
          location: { lat: p.lat, lng: p.lng },
          price: p.priceLevel != null ? "$".repeat(p.priceLevel) : "$$",
          rating: p.rating ?? 0,
          photoRef: p.photoRef ?? null,
          type: p.placeType ?? "restaurant",
          openNow: true,
          hours: [],
          distance: "",
          tags: vibeTags.slice(0, 3),
        });
      } else {
        setFeaturedPlace(null);
      }
      featuredImpressionSent.current = null;
    } catch {
      setFeaturedPlace(null);
    }
  }, []);

  const fetchPlaces = useCallback(async (loc: { lat: number; lng: number }, intents: string[], rad: number) => {
    setLoading(true);
    try {
      const intentsParam = intents.join(",");
      console.log(`[Discover] fetchPlaces → lat=${loc.lat} lng=${loc.lng} radius=${rad} intents=${intentsParam}`);
      const res = await fetch(
        `/api/places?intents=${intentsParam}&lat=${loc.lat}&lng=${loc.lng}&radius=${rad}`
      );
      const data = await res.json();
      // Map API response to Place interface shape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawPlaces: Place[] = (data.places ?? []).map((p: any) => ({
        placeId: p.googlePlaceId,
        name: p.name,
        address: p.address ?? "",
        location: { lat: p.lat, lng: p.lng },
        price: p.priceLevel != null ? "$".repeat(p.priceLevel) : "$$",
        rating: p.rating ?? 0,
        photoRef: p.photoUrl ?? null,
        photoRefs: p.photoUrl ? [p.photoUrl] : undefined,
        type: p.placeType ?? "restaurant",
        openNow: true,
        hours: [],
        distance: p.distance < 1
          ? `${Math.round(p.distance * 1000)}m`
          : `${p.distance.toFixed(1)} km`,
        tags: p.displayTags ?? [],
        matchScore: p.matchScore,
        communityPhotoCount: p.communityPhotoCount ?? 0,
        websiteUri: p.websiteUri ?? undefined,
        menuUrl: p.menuUrl ?? undefined,
        menuType: p.menuType ?? undefined,
      }));
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const { friends } of Object.values(signals) as any) {
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const signalSet = (signals as any)[p.placeId];
                if (!signalSet) return { ...p, friends: [] };

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const enrichedFriends = signalSet.friends.map((f: any) =>
                  scoreMap[f.userId] !== undefined
                    ? { ...f, tasteScore: scoreMap[f.userId] }
                    : f
                );
                return { ...p, friendSaves: enrichedFriends, creatorSignal: signalSet.creator };
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
      fetchPlaces(userLocation, selectedIntents, radius);
      fetchFeatured(userLocation, primaryIntent, radius);
    }
  }, [userLocation, intentKey, radius, fetchPlaces, fetchFeatured, prefsApplied, selectedIntents, primaryIntent]);

  // Derived: filter by budget, then by swiped cards
  const budgetFilteredPlaces = useMemo(() => {
    if (priceFilter === "All") return places;
    return places.filter(p => p.price.length <= priceFilter.length);
  }, [places, priceFilter]);

  const visiblePlaces = useMemo(() => {
    const filtered = budgetFilteredPlaces.filter(p => !skipped.has(p.placeId));
    // Recommendation cards go first; they bypass intent/budget filters
    const merged = [...recommendations, ...filtered];

    // Insert featured card at position 3 if not already in deck
    // Featured cards bypass skip/save history — businesses pay for visibility
    if (
      featuredPlace &&
      !merged.some(p => p.placeId === featuredPlace.placeId)
    ) {
      const insertAt = Math.min(2, merged.length);
      merged.splice(insertAt, 0, featuredPlace);
    }

    return merged;
  }, [budgetFilteredPlaces, skipped, recommendations, featuredPlace]);

  // Track featured impression when featured card is the top visible card
  useEffect(() => {
    const topPlace = visiblePlaces[0];
    if (!topPlace || !featuredPlace) return;
    if (topPlace.placeId !== featuredPlace.placeId) return;
    const pid = (topPlace as Place & { placementId?: string }).placementId;
    if (!pid || featuredImpressionSent.current === pid) return;
    featuredImpressionSent.current = pid;
    fetch(`/api/featured-placements/${pid}/impressions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "impression" }),
    }).catch(() => {});
  }, [visiblePlaces, featuredPlace]);

  // Preload photos for the next 3 cards so they're ready when the user swipes
  useEffect(() => {
    for (let i = 1; i <= 3; i++) {
      const p = visiblePlaces[i];
      if (p?.photoRef) {
        fetch(`/api/places/photo?ref=${encodeURIComponent(p.photoRef)}`)
          .then((r) => r.json())
          .then((data: { photoUrl?: string }) => {
            if (data.photoUrl) {
              const img = new window.Image();
              img.src = data.photoUrl;
            }
          })
          .catch(() => {});
      }
    }
  }, [visiblePlaces]);

  const allDone = !loading && visiblePlaces.length === 0;
  const noBudgetMatches = !loading && places.length > 0 && budgetFilteredPlaces.length === 0;

  function addToSkipped(placeId: string, persist: boolean) {
    setSkipped(prev => new Set([...prev, placeId]));
    if (persist) persistSkipped(placeId);
  }

  function handleSwipe(direction: "left" | "right") {
    const place = visiblePlaces[0];
    if (!place) return;

    // Track featured placement swipe action (fire-and-forget) and clear so it doesn't re-insert
    if (featuredPlace && place.placeId === featuredPlace.placeId) {
      const pid = (place as Place & { placementId?: string }).placementId;
      if (pid) {
        fetch(`/api/featured-placements/${pid}/impressions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: direction === "right" ? "swipe_right" : "swipe_left" }),
        }).catch(() => {});
      }
      setFeaturedPlace(null);
    }

    // Recommendation card: mark seen, remove from recommendations state
    if (place.recommendationId) {
      fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [place.recommendationId] }),
      }).catch(() => { });
      setRecommendations(prev => prev.filter(r => r.recommendationId !== place.recommendationId));
      if (direction === "right") {
        if (sessionStatusRef.current === "authenticated") {
          handleSave(place, primaryIntent, "save", place.recommendationId);
          setSavedPlaceIds(prev => new Set([...prev, place.placeId]));
        }
      }
      return;
    }

    if (direction === "right") {
      if (sessionStatusRef.current !== "authenticated") {
        // Show sign-in modal; card already flew away, so add to session skipped
        addToSkipped(place.placeId, false);
        setShowSignInModal(true);
        return;
      }
      handleSave(place, primaryIntent, "save");
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
    handleSave(place, primaryIntent, action);
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
    clearSkipped();
    setSkipped(new Set());
  }

  // Multi-intent label
  const showingLabel = selectedIntents.length >= 2
    ? selectedIntents.map((id) => CATEGORY_LABELS[id] ?? id).join(" + ")
    : null;

  if (!pageReady) {
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  return (
    <div
      className="bg-white dark:bg-[#0E1116] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+60px)] lg:pb-[env(safe-area-inset-bottom,0px)]"
      style={{
        height: 'calc(100dvh - env(safe-area-inset-top, 0px))',
      }}
    >
      {/* Intent Chips */}
      <div className="shrink-0 pb-3 pt-2 w-full md:max-w-[600px] md:mx-auto">
        <div
          ref={chipScrollRef}
          data-tour="chips"
          className="flex gap-2 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory px-5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {sortedCategories.map((cat) => (
            <motion.button
              layout
              whileTap={{ scale: 0.95 }}
              key={cat.id}
              onClick={() => handleChipTap(cat.id)}
              className={`
                shrink-0 px-4 py-2 rounded-full text-sm font-semibold snap-start
                transition-colors duration-200 cursor-pointer whitespace-nowrap
                ${selectedIntents.includes(cat.id)
                  ? "bg-[#E85D2A] text-white shadow-sm"
                  : "bg-gray-100 dark:bg-white/10 text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-200 dark:hover:bg-white/15"
                }
              `}
            >
              <cat.icon size={14} className="mr-1 inline-block" />{cat.label}
            </motion.button>
          ))}
        </div>
        {showingLabel && (
          <p className="text-[#8B949E] text-xs text-center mt-1">
            Showing: {showingLabel}
          </p>
        )}
      </div>

      {/* Loading State */}
      {(loading || !userLocation) ? (
        <div className="flex-1 relative px-4 pb-4 lg:max-w-[540px] lg:mx-auto lg:w-full max-h-[70dvh]">
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
          <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-[#161B22] flex items-center justify-center mb-2 shadow-inner border border-gray-100 dark:border-white/5">
            {places.length === 0 ? <MapPin size={48} color="#E85D2A" /> : <Sparkles size={48} color="#E85D2A" />}
          </div>
          <h2 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">
            {places.length === 0 ? "Nothing nearby" : "You're all caught up!"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[260px] leading-relaxed">
            {places.length === 0
              ? radius === 0
                ? "We couldn't find any spots for this vibe."
                : `We couldn't find any spots for this vibe within ${radius >= 1000 ? radius / 1000 + 'km' : radius + 'm'}.`
              : "You've swiped through all the spots for this vibe."}
          </p>
          {places.length === 0 ? (
            <button
              onClick={() => { setRadius(25000); setSelectedIntents(["trending"]); }}
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
        <div className="flex-1 relative md:max-w-[420px] md:mx-auto md:w-full max-h-[70dvh]" data-tour="card">
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
                  isTop={isTop}
                  isSaved={isSaved}
                  isFeatured={!!(place as Place & { placementId?: string }).placementId}
                  isVisited={visitedPlaceIds.has(place.placeId)}
                  visitCount={visitData.get(place.placeId)?.count}
                  lastVisitedAt={visitData.get(place.placeId)?.lastVisitedAt}
                  onAction={(action) => handleCardFlipAction(place, action)}
                  onShare={() => setShareModalPlace({ placeId: place.placeId, name: place.name })}
                  onAddPhotos={() => setPhotoPromptPlace({ placeId: place.placeId, name: place.name })}
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
          placeName={celebrationPlace.name}
          onClose={() => setCelebrationPlace(null)}
          onSharePhotos={() => setPhotoPromptPlace(celebrationPlace)}
        />
      )}

      {/* Photo Upload Prompt */}
      <PhotoUploadPrompt
        placeId={photoPromptPlace?.placeId ?? ""}
        placeName={photoPromptPlace?.name ?? ""}
        isOpen={!!photoPromptPlace}
        onClose={() => setPhotoPromptPlace(null)}
      />

      {/* 10 Saves Nudge */}
      <NudgeModal
        isOpen={showSavesNudge}
        onClose={() => setShowSavesNudge(false)}
        icon={Users}
        title="You've got great taste!"
        description="10 spots saved! Share your discoveries with friends and see what they're into."
        ctaText="Find Friends"
        onCta={() => {
          setShowSavesNudge(false);
          router.push("/social");
        }}
        secondaryText="Maybe later"
        nudgeType={NUDGE_10_SAVES_SHARE}
      />

    </div>
  );
}
