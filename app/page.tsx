"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

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

function SwipeCard({
  cafe,
  onSwipe,
  isTop,
}: {
  cafe: Cafe;
  onSwipe: (direction: "left" | "right" | "up") => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
  const saveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const goNowOpacity = useTransform(y, [-SWIPE_UP_THRESHOLD, 0], [1, 0]);

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

export default function Home() {
  const [intent, setIntent] = useState("trending");
  const [currentIndex, setCurrentIndex] = useState(0);
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
                isTop={i === arr.length - 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}
