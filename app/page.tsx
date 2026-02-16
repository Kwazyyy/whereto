"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  PanInfo,
} from "framer-motion";
import Image from "next/image";

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

interface Place {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  price: string;
  rating: number;
  photoRef: string | null;
  type: string;
  openNow: boolean;
  hours: string[];
  distance: string;
  tags: string[];
}

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;
const TAP_MOVE_LIMIT = 10;
const TAP_TIME_LIMIT = 200;

// --- Photo Hook ---

function usePhotoUrl(photoRef: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoRef) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/places/photo?ref=${encodeURIComponent(photoRef)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.photoUrl) setUrl(data.photoUrl);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [photoRef]);

  return url;
}

// --- Bottom Sheet ---

function PlaceDetailSheet({
  place,
  fallbackGradient,
  onClose,
}: {
  place: Place;
  fallbackGradient: string;
  onClose: () => void;
}) {
  const matchScore = useMemo(() => Math.floor(Math.random() * 19) + 80, []);
  const photoUrl = usePhotoUrl(place.photoRef);

  // Find today's hours
  const todayHours = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    return place.hours.find((h) => h.startsWith(today)) ?? null;
  }, [place.hours]);

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl overflow-hidden flex flex-col"
        style={{ height: "85dvh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info: PanInfo) => {
          if (info.offset.y > 100 || info.velocity.y > 500) onClose();
        }}
      >
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Photo */}
          <div className={`h-48 relative ${!photoUrl ? `bg-gradient-to-br ${fallbackGradient}` : "bg-gray-200"}`}>
            {photoUrl && (
              <Image
                src={photoUrl}
                alt={place.name}
                fill
                className="object-cover"
                unoptimized
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          <div className="px-5 -mt-6 relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#1B2A4A" }}>
                  {place.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 font-medium">
                  <span className="capitalize">{place.type}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{place.distance}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{place.price}</span>
                </div>
                {place.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                    <span className="text-yellow-500">&#9733;</span>
                    <span className="font-medium">{place.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <span className="shrink-0 mt-1 px-3 py-1.5 rounded-full bg-[#E85D2A] text-white text-sm font-bold">
                {matchScore}% Match
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {place.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-[#1B2A4A] text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>

            {/* Address */}
            {place.address && (
              <p className="mt-4 text-sm text-gray-500">{place.address}</p>
            )}

            {/* Details Grid */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3a1 1 0 0 0 1 1h3"/><path d="M8 14h0"/><path d="m6 6 1.5 1.5"/><path d="M2 2v2"/></svg>
                  <div><p className="text-xs text-gray-400 font-medium">Noise Level</p><p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>Quiet</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 ml-0.5" />
                  <div><p className="text-xs text-gray-400 font-medium">Busyness</p><p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>Not Busy</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8Z"/></svg>
                  <div><p className="text-xs text-gray-400 font-medium">Outlets</p><p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>Plenty</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0Z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>
                  <div><p className="text-xs text-gray-400 font-medium">Seating</p><p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>Long Stay</p></div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="mt-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>
                  {place.openNow ? "Open Now" : "Closed"}
                </p>
                <p className="text-xs text-gray-400">
                  {todayHours ?? "Hours unavailable"}
                </p>
              </div>
            </div>

            <div className="h-28" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-8 pt-4 bg-gradient-to-t from-white from-70% to-transparent">
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-[#1B2A4A] font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              Save
            </button>
            <button className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#E85D2A] text-white font-bold text-sm shadow-lg shadow-[#E85D2A]/30 hover:bg-[#d04e1f] active:scale-[0.98] transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Go Now
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-[#1B2A4A] font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              Share
            </button>
          </div>
        </div>
      </motion.div>
    </>
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
        <div className="flex flex-wrap gap-2 mt-4">
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

// --- Main Page ---

export default function Home() {
  const [intent, setIntent] = useState("trending");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const locationResolved = useRef(false);

  // Get user location on mount
  useEffect(() => {
    if (locationResolved.current) return;
    locationResolved.current = true;

    if (!navigator.geolocation) {
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
  }, []);

  // Fetch places when intent or location changes
  const fetchPlaces = useCallback(async (loc: { lat: number; lng: number }, intentId: string) => {
    setLoading(true);
    setCurrentIndex(0);
    try {
      const res = await fetch(
        `/api/places?intent=${intentId}&lat=${loc.lat}&lng=${loc.lng}`
      );
      const data = await res.json();
      setPlaces(data.places ?? []);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchPlaces(userLocation, intent);
    }
  }, [userLocation, intent, fetchPlaces]);

  const allDone = !loading && currentIndex >= places.length;

  function handleSwipe(direction: "left" | "right" | "up") {
    void direction;
    setCurrentIndex((prev) => prev + 1);
  }

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
            WhereTo
          </h1>
          {!loading && !allDone && places.length > 0 && (
            <span className="text-xs text-gray-400 font-medium">
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
                    : "bg-gray-100 text-[#1B2A4A] hover:bg-gray-200"
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
          <p className="text-sm text-gray-400 font-medium">
            {!userLocation ? "Getting your location..." : "Finding places..."}
          </p>
        </div>
      ) : allDone ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
          <div className="text-6xl">&#x1F44B;</div>
          <h2 className="text-2xl font-bold" style={{ color: "#1B2A4A" }}>
            {places.length === 0 ? "No places found" : "No more places!"}
          </h2>
          <p className="text-gray-500 text-sm">
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
