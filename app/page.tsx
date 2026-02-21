"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  PanInfo,
} from "framer-motion";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Place, FriendSignal } from "@/lib/types";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useSavePlace } from "@/lib/use-save-place";
import PlaceDetailSheet from "@/components/PlaceDetailSheet";

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

// --- Friend Signal Helpers ---

function friendLabel(friends: FriendSignal[]): string {
  const first = (f: FriendSignal) => f.name?.split(" ")[0] ?? "someone";
  if (friends.length === 1) return `Liked by ${first(friends[0])}`;
  if (friends.length === 2) return `Liked by ${first(friends[0])} & ${first(friends[1])}`;
  return `Liked by ${first(friends[0])} & ${friends.length - 1} others`;
}

function FriendAvatars({ friends }: { friends: FriendSignal[] }) {
  const shown = friends.slice(0, 3);
  return (
    <div className="flex items-center">
      {shown.map((f, i) => (
        <div
          key={f.userId}
          className="w-5 h-5 rounded-full border-[1.5px] border-black/30 overflow-hidden bg-[#E85D2A] flex items-center justify-center shrink-0"
          style={{ marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }}
        >
          {f.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image} alt={f.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-[7px] font-bold leading-none">
              {f.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Card Photo ---

function CardPhoto({ photoRef, gradient }: { photoRef: string | null; gradient: string }) {
  const photoUrl = usePhotoUrl(photoRef);

  return (
    <>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt=""
          fill
          className="object-cover"
          unoptimized
          priority
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}
    </>
  );
}

// --- Swipe Card ---

function SwipeCard({
  place,
  fallbackGradient,
  onSwipe,
  onTap,
  isTop,
}: {
  place: Place;
  fallbackGradient: string;
  onSwipe: (direction: "left" | "right" | "up") => void;
  onTap: () => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });
  const isDragging = useRef(false);
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
  const saveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const goNowOpacity = useTransform(y, [-SWIPE_UP_THRESHOLD, 0], [1, 0]);

  function handlePointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isDragging.current = false;
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (isDragging.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    const dt = Date.now() - pointerStart.current.time;
    if (dx < TAP_MOVE_LIMIT && dy < TAP_MOVE_LIMIT && dt < TAP_TIME_LIMIT) {
      onTap();
    }
  }

  function handleDragStart() {
    isDragging.current = true;
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { offset } = info;
    if (offset.y < -SWIPE_UP_THRESHOLD) {
      animate(y, -800, { duration: 0.3 });
      setTimeout(() => onSwipe("up"), 300);
    } else if (offset.x > SWIPE_THRESHOLD) {
      animate(x, 500, { duration: 0.3 });
      setTimeout(() => onSwipe("right"), 300);
    } else if (offset.x < -SWIPE_THRESHOLD) {
      animate(x, -500, { duration: 0.3 });
      setTimeout(() => onSwipe("left"), 300);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      animate(y, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  }

  return (
    <motion.div
      className="absolute inset-3 rounded-3xl overflow-hidden shadow-2xl touch-none"
      style={{ x, y, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onPointerDown={isTop ? handlePointerDown : undefined}
      onPointerUp={isTop ? handlePointerUp : undefined}
      onDragStart={isTop ? handleDragStart : undefined}
      onDragEnd={isTop ? handleDragEnd : undefined}
    >
      {/* Photo or Gradient */}
      <div className="absolute inset-0 bg-gray-300">
        <CardPhoto photoRef={place.photoRef} gradient={fallbackGradient} />
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Swipe Overlays */}
      {isTop && (
        <>
          <motion.div className="absolute inset-0 flex items-center justify-center bg-green-500/30 z-20" style={{ opacity: saveOpacity }}>
            <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-8 py-4 rotate-[-15deg]">SAVE</span>
          </motion.div>
          <motion.div className="absolute inset-0 flex items-center justify-center bg-gray-500/30 z-20" style={{ opacity: skipOpacity }}>
            <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-8 py-4 rotate-[15deg]">SKIP</span>
          </motion.div>
          <motion.div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 z-20" style={{ opacity: goNowOpacity }}>
            <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-6 py-4">GO NOW</span>
          </motion.div>
        </>
      )}

      {/* Card Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <h2 className="text-3xl font-bold text-white leading-tight">{place.name}</h2>
        <div className="flex items-center gap-3 mt-2 text-white/80 text-sm font-medium">
          <span>{place.distance}</span>
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span className="capitalize">{place.type}</span>
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span>{place.price}</span>
          {place.rating > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/60" />
              <span>&#9733; {place.rating.toFixed(1)}</span>
            </>
          )}
        </div>
        {place.friendSaves && place.friendSaves.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
            <FriendAvatars friends={place.friendSaves} />
            <span className="text-white text-xs font-semibold leading-none">
              {friendLabel(place.friendSaves)}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {place.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// --- Distance Bubble ---

const DISTANCE_OPTIONS = [
  { label: "1km", value: 1000 },
  { label: "2km", value: 2000 },
  { label: "5km", value: 5000 },
  { label: "10km", value: 10000 },
  { label: "25km", value: 25000 },
];

function DistanceBubble({
  radius,
  onRadiusChange,
}: {
  radius: number;
  onRadiusChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    DISTANCE_OPTIONS.find((o) => o.value === radius)?.label ?? "5km";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  return (
    <div ref={bubbleRef}>
      <motion.div
        layout
        className="inline-flex items-center rounded-full overflow-hidden cursor-pointer bg-black/40 backdrop-blur-md border border-white/15 shadow-lg"
        onClick={() => !open && setOpen(true)}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      >
        <AnimatePresence mode="wait">
          {!open ? (
            <motion.div
              key="collapsed"
              className="flex items-center gap-1.5 px-3 py-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(true)}
            >
              {/* Map pin icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-white text-xs font-semibold">{currentLabel}</span>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              className="flex items-center gap-0.5 px-1.5 py-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {DISTANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRadiusChange(opt.value);
                    setOpen(false);
                  }}
                  className={`
                    px-2.5 py-1 rounded-full text-xs font-semibold
                    transition-colors duration-150 cursor-pointer
                    ${
                      radius === opt.value
                        ? "bg-[#E85D2A] text-white"
                        : "text-white/70 hover:text-white"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// --- Main Page ---

const PREFS_KEY = "whereto_prefs";

export default function Home() {
  const [intent, setIntent] = useState("trending");
  const [radius, setRadius] = useState(5000);
  const [prefsApplied, setPrefsApplied] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const locationResolved = useRef(false);
  const { handleSave } = useSavePlace();
  const { status } = useSession();
  // Ref so fetchPlaces can read auth status without being in its dep array
  const sessionStatusRef = useRef(status);
  useEffect(() => { sessionStatusRef.current = status; }, [status]);

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

  // Fetch places when intent, radius, or location changes
  const fetchPlaces = useCallback(async (loc: { lat: number; lng: number }, intentId: string, rad: number) => {
    setLoading(true);
    setCurrentIndex(0);
    try {
      const res = await fetch(
        `/api/places?intent=${intentId}&lat=${loc.lat}&lng=${loc.lng}&radius=${rad}`
      );
      const data = await res.json();
      const rawPlaces: Place[] = data.places ?? [];
      setPlaces(rawPlaces);

      // Fire-and-forget: enrich with friend signals for authenticated users
      if (rawPlaces.length > 0 && sessionStatusRef.current === "authenticated") {
        fetch("/api/friends/place-signals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeIds: rawPlaces.map((p) => p.placeId) }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((signals: Record<string, FriendSignal[]> | null) => {
            if (!signals || Object.keys(signals).length === 0) return;
            setPlaces((prev) =>
              prev.map((p) =>
                signals[p.placeId] ? { ...p, friendSaves: signals[p.placeId] } : p
              )
            );
          })
          .catch(() => {});
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

  const allDone = !loading && currentIndex >= places.length;

  function handleSwipe(direction: "left" | "right" | "up") {
    const place = places[currentIndex];
    if (place && (direction === "right" || direction === "up")) {
      const action = direction === "up" ? "go_now" : "save";
      handleSave(place, intent, action);
      if (direction === "up") {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&destination_place_id=${place.placeId}`,
          "_blank"
        );
      }
    }
    setCurrentIndex((prev) => prev + 1);
  }

  return (
    <div className="h-dvh bg-white dark:bg-[#0f0f1a] flex flex-col overflow-hidden pb-16">
      {/* Header */}
      <header className="shrink-0 px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
            WhereTo
          </h1>
          {!loading && !allDone && places.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {currentIndex + 1} / {places.length}
            </span>
          )}
        </div>
      </header>

      {/* Intent Chips */}
      <div className="shrink-0 px-5 py-3">
        <div
          ref={chipScrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setIntent(cat.id)}
              className={`
                shrink-0 px-4 py-2 rounded-full text-sm font-semibold
                transition-all duration-200 cursor-pointer whitespace-nowrap
                ${
                  intent === cat.id
                    ? "bg-[#E85D2A] text-white shadow-sm"
                    : "bg-gray-100 dark:bg-white/10 text-[#1B2A4A] dark:text-[#e8edf4] hover:bg-gray-200 dark:hover:bg-white/15"
                }
              `}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {(loading || !userLocation) ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin"
            style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
          />
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
            {!userLocation ? "Getting your location..." : "Finding places..."}
          </p>
        </div>
      ) : allDone ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
          <div className="text-6xl">&#x1F44B;</div>
          <h2 className="text-2xl font-bold text-[#1B2A4A] dark:text-[#e8edf4]">
            {places.length === 0 ? "No places found" : "No more places!"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {places.length === 0
              ? "Try a different vibe or check back later."
              : <>You&apos;ve seen all the spots for this vibe.<br />Try a different one above!</>}
          </p>
        </div>
      ) : (
        <div className="flex-1 relative">
          {places
            .slice(currentIndex, currentIndex + 2)
            .reverse()
            .map((place, i, arr) => (
              <SwipeCard
                key={`${intent}-${place.placeId}`}
                place={place}
                fallbackGradient={FALLBACK_GRADIENTS[
                  (currentIndex + (arr.length - 1 - i)) % FALLBACK_GRADIENTS.length
                ]}
                onSwipe={handleSwipe}
                onTap={() => setDetailPlace(place)}
                isTop={i === arr.length - 1}
              />
            ))}

          {/* Distance Bubble – floats over card */}
          <div className="absolute top-6 left-6 z-30">
            <DistanceBubble radius={radius} onRadiusChange={setRadius} />
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      <AnimatePresence>
        {detailPlace && (
          <PlaceDetailSheet
            place={detailPlace}
            fallbackGradient={FALLBACK_GRADIENTS[
              places.indexOf(detailPlace) % FALLBACK_GRADIENTS.length
            ]}
            onClose={() => setDetailPlace(null)}
            onSave={(action) => {
              handleSave(detailPlace, intent, action);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
