"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  PanInfo,
} from "framer-motion";

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

interface Cafe {
  id: number;
  name: string;
  distance: string;
  type: string;
  price: string;
  tags: string[];
  gradient: string;
}

const CAFES: Cafe[] = [
  {
    id: 1,
    name: "Sam James Coffee Bar",
    distance: "0.3km",
    type: "café",
    price: "$$",
    tags: ["Quiet", "Wifi", "Cozy"],
    gradient: "from-amber-800 via-orange-700 to-yellow-600",
  },
  {
    id: 2,
    name: "Neo Coffee Bar",
    distance: "0.5km",
    type: "café",
    price: "$$",
    tags: ["Modern", "Laptop-Friendly", "Good Coffee"],
    gradient: "from-slate-800 via-slate-600 to-cyan-700",
  },
  {
    id: 3,
    name: "Jimmy's Coffee",
    distance: "0.8km",
    type: "café",
    price: "$",
    tags: ["Casual", "Budget", "Cozy"],
    gradient: "from-green-800 via-emerald-700 to-teal-600",
  },
  {
    id: 4,
    name: "Boxcar Social",
    distance: "1.2km",
    type: "restaurant",
    price: "$$",
    tags: ["Trendy", "Date Spot", "Aesthetic"],
    gradient: "from-purple-900 via-violet-700 to-fuchsia-600",
  },
  {
    id: 5,
    name: "Fahrenheit Coffee",
    distance: "0.4km",
    type: "café",
    price: "$",
    tags: ["Quiet", "Study", "Minimal"],
    gradient: "from-stone-800 via-stone-600 to-orange-800",
  },
  {
    id: 6,
    name: "Mallo",
    distance: "1.5km",
    type: "restaurant",
    price: "$$$",
    tags: ["Romantic", "Premium", "Modern"],
    gradient: "from-rose-900 via-red-800 to-pink-700",
  },
];

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;
const TAP_MOVE_LIMIT = 10;
const TAP_TIME_LIMIT = 200;

// --- Bottom Sheet ---

function PlaceDetailSheet({
  cafe,
  onClose,
}: {
  cafe: Cafe;
  onClose: () => void;
}) {
  const matchScore = useMemo(() => Math.floor(Math.random() * 19) + 80, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
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
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo / Gradient */}
          <div className={`h-48 bg-gradient-to-br ${cafe.gradient} relative`}>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          <div className="px-5 -mt-6 relative">
            {/* Name + Match Score */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#1B2A4A" }}>
                  {cafe.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 font-medium">
                  <span className="capitalize">{cafe.type}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{cafe.distance}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{cafe.price}</span>
                </div>
              </div>
              <span className="shrink-0 mt-1 px-3 py-1.5 rounded-full bg-[#E85D2A] text-white text-sm font-bold">
                {matchScore}% Match
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {cafe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-gray-100 text-[#1B2A4A] text-xs font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Details Grid */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 10v3a1 1 0 0 0 1 1h3" />
                    <path d="M8 14h0" />
                    <path d="m6 6 1.5 1.5" />
                    <path d="M2 2v2" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Noise Level</p>
                    <p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>Quiet</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 ml-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Busyness</p>
                    <p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>Not Busy</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22v-5" />
                    <path d="M9 8V2" />
                    <path d="M15 8V2" />
                    <path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8Z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Outlets</p>
                    <p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>Plenty</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                    <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0Z" />
                    <path d="M5 18v2" />
                    <path d="M19 18v2" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Seating</p>
                    <p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>Long Stay</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="mt-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>
                  Open until 8:00 PM
                </p>
                <p className="text-xs text-gray-400">Mon – Fri · 7:00 AM – 8:00 PM</p>
              </div>
            </div>

            {/* Spacer for action buttons */}
            <div className="h-28" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-8 pt-4 bg-gradient-to-t from-white from-70% to-transparent">
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-[#1B2A4A] font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              Save
            </button>
            <button className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#E85D2A] text-white font-bold text-sm shadow-lg shadow-[#E85D2A]/30 hover:bg-[#d04e1f] active:scale-[0.98] transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              Go Now
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-[#1B2A4A] font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" x2="12" y1="2" y2="15" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// --- Swipe Card ---

function SwipeCard({
  cafe,
  onSwipe,
  onTap,
  isTop,
}: {
  cafe: Cafe;
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
      style={{
        x,
        y,
        rotate,
        zIndex: isTop ? 10 : 0,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onPointerDown={isTop ? handlePointerDown : undefined}
      onPointerUp={isTop ? handlePointerUp : undefined}
      onDragStart={isTop ? handleDragStart : undefined}
      onDragEnd={isTop ? handleDragEnd : undefined}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cafe.gradient}`} />

      {/* Bottom Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Swipe Overlays */}
      {isTop && (
        <>
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-green-500/30 z-20"
            style={{ opacity: saveOpacity }}
          >
            <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-8 py-4 rotate-[-15deg]">
              SAVE
            </span>
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-gray-500/30 z-20"
            style={{ opacity: skipOpacity }}
          >
            <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-8 py-4 rotate-[15deg]">
              SKIP
            </span>
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-blue-500/30 z-20"
            style={{ opacity: goNowOpacity }}
          >
            <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-6 py-4">
              GO NOW
            </span>
          </motion.div>
        </>
      )}

      {/* Card Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <h2 className="text-3xl font-bold text-white leading-tight">{cafe.name}</h2>
        <div className="flex items-center gap-3 mt-2 text-white/80 text-sm font-medium">
          <span>{cafe.distance}</span>
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span className="capitalize">{cafe.type}</span>
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span>{cafe.price}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {cafe.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold"
            >
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
  const [detailCafe, setDetailCafe] = useState<Cafe | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const allDone = currentIndex >= CAFES.length;

  useEffect(() => {
    setCurrentIndex(0);
  }, [intent]);

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
          {!allDone && (
            <span className="text-xs text-gray-400 font-medium">
              {currentIndex + 1} / {CAFES.length}
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

      {/* Swipe Card Stack */}
      {allDone ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
          <div className="text-6xl">&#x1F44B;</div>
          <h2 className="text-2xl font-bold" style={{ color: "#1B2A4A" }}>
            No more places!
          </h2>
          <p className="text-gray-500 text-sm">
            You&apos;ve seen all the spots for this vibe.
            <br />
            Try a different one above!
          </p>
        </div>
      ) : (
        <div className="flex-1 relative">
          {CAFES.slice(currentIndex, currentIndex + 2)
            .reverse()
            .map((cafe, i, arr) => (
              <SwipeCard
                key={`${intent}-${cafe.id}`}
                cafe={cafe}
                onSwipe={handleSwipe}
                onTap={() => setDetailCafe(cafe)}
                isTop={i === arr.length - 1}
              />
            ))}
        </div>
      )}

      {/* Bottom Sheet */}
      <AnimatePresence>
        {detailCafe && (
          <PlaceDetailSheet
            cafe={detailCafe}
            onClose={() => setDetailCafe(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
