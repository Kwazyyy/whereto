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
import { Place, FriendSignal } from "@/lib/types";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useSavePlace } from "@/lib/use-save-place";

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
const SKIPPED_KEY = "whereto_skipped";

// --- Skipped cards localStorage helpers ---

function loadSkippedForIntent(intentId: string): Set<string> {
  try {
    const raw = localStorage.getItem(SKIPPED_KEY);
    if (!raw) return new Set();
    const all = JSON.parse(raw) as Record<string, string[]>;
    return new Set(all[intentId] ?? []);
  } catch {
    return new Set();
  }
}

function persistSkippedForIntent(intentId: string, ids: Set<string>) {
  try {
    const raw = localStorage.getItem(SKIPPED_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    all[intentId] = [...ids];
    localStorage.setItem(SKIPPED_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function clearSkippedForIntent(intentId: string) {
  try {
    const raw = localStorage.getItem(SKIPPED_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as Record<string, string[]>;
    delete all[intentId];
    localStorage.setItem(SKIPPED_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

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
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt=""
          fill
          className={`object-cover transition-all duration-700 ease-in-out ${isLoaded ? "scale-100 blur-0 opacity-100" : "scale-105 blur-md opacity-50"
            }`}
          onLoad={() => setIsLoaded(true)}
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
  onSwipeUpSync,
  isTop,
  isSaved,
  onAction,
}: {
  place: Place;
  fallbackGradient: string;
  onSwipe: (direction: "left" | "right" | "up") => void;
  onSwipeUpSync?: () => void;
  isTop: boolean;
  isSaved: boolean;
  onAction: (action: "save" | "go_now") => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });
  const isDragging = useRef(false);
  const carouselPointerStart = useRef({ x: 0, y: 0, time: 0 });
  const carouselRef = useRef<HTMLDivElement>(null);
  const rotateZ = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
  const saveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const goNowOpacity = useTransform(y, [-SWIPE_UP_THRESHOLD, 0], [1, 0]);

  const [isFlipped, setIsFlipped] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const matchScore = useMemo(() => Math.floor(Math.random() * 19) + 80, []);

  const todayHours = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    return place.hours.find((h) => h.startsWith(today)) ?? null;
  }, [place.hours]);

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
      if (!isFlipped) setIsFlipped(true);
      else setIsFlipped(false);
    }
  }

  function handleDragStart() {
    isDragging.current = true;
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { offset } = info;
    if (offset.y < -SWIPE_UP_THRESHOLD) {
      if (onSwipeUpSync) onSwipeUpSync();
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

  const dragEnabled = isTop && !isFlipped;

  return (
    <motion.div
      className="absolute inset-4 z-10 touch-none"
      style={{ x, y, rotateZ, zIndex: isTop ? 10 : 0, perspective: 1500 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      drag={dragEnabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onPointerDown={dragEnabled ? handlePointerDown : undefined}
      onPointerUp={dragEnabled ? handlePointerUp : undefined}
      onDragStart={dragEnabled ? handleDragStart : undefined}
      onDragEnd={dragEnabled ? handleDragEnd : undefined}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* ===================== FRONT FACE ===================== */}
        <div
          className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-gray-300 transition-opacity duration-300 ${isFlipped ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
            }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-0 bg-gray-300 pointer-events-none">
            <CardPhoto photoRef={place.photoRef} gradient={fallbackGradient} />
          </div>

          <div className="absolute bottom-0 inset-x-0 h-[50%] bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

          {isSaved && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#E85D2A" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span className="text-white text-[11px] font-semibold leading-none">Saved</span>
            </div>
          )}

          {isTop && !isFlipped && (
            <>
              <motion.div className="absolute inset-0 flex items-center justify-center bg-green-500/30 z-20 pointer-events-none" style={{ opacity: saveOpacity }}>
                <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-8 py-4 rotate-[-15deg]">SAVE</span>
              </motion.div>
              <motion.div className="absolute inset-0 flex items-center justify-center bg-gray-500/30 z-20 pointer-events-none" style={{ opacity: skipOpacity }}>
                <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-8 py-4 rotate-[15deg]">SKIP</span>
              </motion.div>
              <motion.div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 z-20 pointer-events-none" style={{ opacity: goNowOpacity }}>
                <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-6 py-4">GO NOW</span>
              </motion.div>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 z-10 pointer-events-none">
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
        </div>

        {/* ===================== BACK FACE ===================== */}
        <div
          className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#1a1a2e] flex flex-col transition-opacity duration-300 ${isFlipped ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Flip Back Button */}
          <button
            onClick={() => setIsFlipped(false)}
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-lg cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
          </button>

          <div
            className="flex-1 overflow-y-auto scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
            }}
            onPointerUp={(e) => {
              const dx = Math.abs(e.clientX - pointerStart.current.x);
              const dy = Math.abs(e.clientY - pointerStart.current.y);
              const dt = Date.now() - pointerStart.current.time;
              if (dx < TAP_MOVE_LIMIT && dy < TAP_MOVE_LIMIT && dt < TAP_TIME_LIMIT) {
                setIsFlipped(false);
              }
            }}
          >
            {/* Photo Carousel */}
            <div className="relative min-h-[40vh] h-[40%] shrink-0 w-full">
              <div
                ref={carouselRef}
                className={`absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-none ${!(place.photoRefs && place.photoRefs.length > 0) ? `bg-gradient-to-br ${fallbackGradient}` : ""}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  carouselPointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  const dx = Math.abs(e.clientX - carouselPointerStart.current.x);
                  const dy = Math.abs(e.clientY - carouselPointerStart.current.y);
                  const dt = Date.now() - carouselPointerStart.current.time;

                  // If it's a tap, determine if left or right side was clicked
                  if (dx < TAP_MOVE_LIMIT && dy < TAP_MOVE_LIMIT && dt < TAP_TIME_LIMIT) {
                    if (carouselRef.current && place.photoRefs) {
                      const rect = carouselRef.current.getBoundingClientRect();
                      const xPos = e.clientX - rect.left;
                      const width = rect.width;

                      let newIndex = activePhotoIndex;
                      if (xPos > width * 0.35) {
                        // Tapped right 65% -> Go to next photo
                        newIndex = Math.min(activePhotoIndex + 1, place.photoRefs.length - 1);
                      } else {
                        // Tapped left 35% -> Go to previous photo
                        newIndex = Math.max(activePhotoIndex - 1, 0);
                      }

                      if (newIndex !== activePhotoIndex) {
                        carouselRef.current.scrollTo({
                          left: newIndex * width,
                          behavior: "smooth"
                        });
                      }
                    }
                  }
                }}
                onScroll={(e) => {
                  const scrollLeft = e.currentTarget.scrollLeft;
                  const width = e.currentTarget.clientWidth;
                  const index = Math.round(scrollLeft / width);
                  setActivePhotoIndex(index);
                }}
              >
                {place.photoRefs && place.photoRefs.length > 0 ? (
                  place.photoRefs.map((ref, idx) => (
                    <div key={idx} className="w-full shrink-0 snap-center h-full relative bg-gray-200 dark:bg-[#22223b]">
                      <CardPhoto photoRef={ref} gradient={fallbackGradient} />
                    </div>
                  ))
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#1a1a2e] via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Dot Indicators */}
              {place.photoRefs && place.photoRefs.length > 1 && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-20">
                  {place.photoRefs.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === activePhotoIndex
                        ? "w-4 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                        : "w-1.5 bg-white/50 shadow-[0_0_2px_rgba(0,0,0,0.5)]"
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 pt-2 relative z-10 pb-32">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-[#1B2A4A] dark:text-[#e8edf4]">
                    {place.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    <span className="capitalize">{place.type}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{place.distance}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{place.price}</span>
                  </div>
                  {place.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <span className="text-yellow-500">&#9733;</span>
                      <span className="font-medium">{place.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <span className="shrink-0 mt-1 px-3 py-1.5 rounded-full bg-[#E85D2A] text-white text-sm font-bold shadow-sm">
                  {matchScore}% Match
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {place.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[#1B2A4A] dark:text-[#e8edf4] text-xs font-semibold">
                    {tag}
                  </span>
                ))}
              </div>

              {place.address && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{place.address}</p>
              )}

              {/* Friends who saved this */}
              {place.friendSaves && place.friendSaves.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    Friends Love This
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {place.friendSaves.map((f: FriendSignal) => (
                      <div key={f.userId} className="flex items-center gap-3">
                        {f.image ? (
                          <Image
                            src={f.image}
                            alt={f.name ?? ""}
                            width={32}
                            height={32}
                            className="rounded-full shrink-0 object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {f.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
                          {f.name ?? "A friend"}
                        </span>
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">saved this</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3a1 1 0 0 0 1 1h3" /><path d="M8 14h0" /><path d="m6 6 1.5 1.5" /><path d="M2 2v2" /></svg>
                    <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Noise Level</p><p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">Quiet</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 ml-0.5" />
                    <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Busyness</p><p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">Not Busy</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8Z" /></svg>
                    <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Outlets</p><p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">Plenty</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0Z" /><path d="M5 18v2" /><path d="M19 18v2" /></svg>
                    <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Seating</p><p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">Long Stay</p></div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="mt-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <div>
                  <p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">
                    {place.openNow ? "Open Now" : "Closed"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {todayHours ?? "Hours unavailable"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Sticky at bottom of back face) */}
          <div className="absolute bottom-0 inset-x-0 px-5 pb-5 pt-4 bg-gradient-to-t from-white dark:from-[#1a1a2e] from-80% to-transparent pointer-events-none">
            <div className="flex gap-3 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onAction("save"); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-colors cursor-pointer ${isSaved
                  ? "border-[#E85D2A] text-[#E85D2A] bg-orange-50 dark:bg-[#E85D2A]/10"
                  : "border-gray-200 dark:border-white/15 text-[#1B2A4A] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isSaved ? "#E85D2A" : "none"}
                  stroke={isSaved ? "#E85D2A" : "currentColor"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                {isSaved ? "Saved" : "Save"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction("go_now"); }}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#E85D2A] text-white font-bold text-sm shadow-lg shadow-[#E85D2A]/30 hover:bg-[#d04e1f] active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                Go Now
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/15 text-[#1B2A4A] dark:text-[#e8edf4] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </motion.div>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${radius === opt.value ? "bg-[#E85D2A] text-white" : "text-white/70 hover:text-white"
                    }`}
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

// --- Budget Bubble ---

const BUDGET_OPTIONS = ["All", "$", "$$", "$$$", "$$$$"];

function BudgetBubble({
  priceFilter,
  onPriceFilterChange,
}: {
  priceFilter: string;
  onPriceFilterChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

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
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="text-white text-xs font-semibold">{priceFilter}</span>
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
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPriceFilterChange(opt);
                    setOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${priceFilter === opt ? "bg-[#E85D2A] text-white" : "text-white/70 hover:text-white"
                    }`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// --- Sign-In Modal ---

function SignInModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-t-3xl px-6 pt-4 pb-12"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 20, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-6" />
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-[#E85D2A]/15 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="#E85D2A" stroke="#E85D2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A] dark:text-[#e8edf4]">
              Sign in to save your favorite places
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs mx-auto">
              Create boards, track your spots, and share vibes with friends.
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-white dark:bg-[#22223b] border-2 border-gray-200 dark:border-white/10 font-semibold text-sm text-[#1B2A4A] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-[#2d2d44] transition-colors cursor-pointer shadow-sm"
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
      </motion.div>
    </div>
  );
}

// --- Main Page ---

export default function Home() {
  const [intent, setIntent] = useState("trending");
  const [radius, setRadius] = useState(5000);
  const [priceFilter, setPriceFilter] = useState("All");
  const [prefsApplied, setPrefsApplied] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [showSignInModal, setShowSignInModal] = useState(false);
  // skippedPerIntent: per-intent set of placeIds that have been swiped (left=persisted, right/up=session-only)
  const [skippedPerIntent, setSkippedPerIntent] = useState<Record<string, Set<string>>>({});

  const chipScrollRef = useRef<HTMLDivElement>(null);
  const locationResolved = useRef(false);
  const { handleSave } = useSavePlace();
  const { status } = useSession();
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
          .then((signals: Record<string, FriendSignal[]> | null) => {
            if (!signals || Object.keys(signals).length === 0) return;
            setPlaces((prev) =>
              prev.map((p) =>
                signals[p.placeId] ? { ...p, friendSaves: signals[p.placeId] } : p
              )
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
    return budgetFilteredPlaces.filter(p => !skipped.has(p.placeId));
  }, [budgetFilteredPlaces, skippedPerIntent, intent]);

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
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&destination_place_id=${place.placeId}`,
        "_blank"
      );
    }
  }

  function handleSwipe(direction: "left" | "right" | "up") {
    const place = visiblePlaces[0];
    if (!place) return;

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
    handleSave(place, intent, action);
    setSavedPlaceIds((prev) => new Set([...prev, place.placeId]));
    if (action === "go_now") {
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
    <div className="h-dvh bg-white dark:bg-[#0f0f1a] flex flex-col overflow-hidden pb-16">
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
                  : "bg-gray-100 dark:bg-white/10 text-[#1B2A4A] dark:text-[#e8edf4] hover:bg-gray-200 dark:hover:bg-white/15"
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
          <div className="w-full h-full rounded-3xl bg-gray-100 dark:bg-[#1a1a2e]/60 animate-pulse shadow-xl flex flex-col justify-end p-6 border border-gray-200/50 dark:border-white/5">
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
          <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center text-5xl mb-2 shadow-inner border border-gray-100 dark:border-white/5">
            💸
          </div>
          <h2 className="text-2xl font-bold text-[#1B2A4A] dark:text-[#e8edf4]">
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
          <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center text-5xl mb-2 shadow-inner border border-gray-100 dark:border-white/5">
            {places.length === 0 ? "🗺️" : "✨"}
          </div>
          <h2 className="text-2xl font-bold text-[#1B2A4A] dark:text-[#e8edf4]">
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
                  key={place.placeId}
                  place={place}
                  fallbackGradient={gradient}
                  onSwipe={handleSwipe}
                  onSwipeUpSync={() => handleSwipeUpSync(place)}
                  isTop={isTop}
                  isSaved={isSaved}
                  onAction={(action) => handleCardFlipAction(place, action)}
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
    </div>
  );
}
