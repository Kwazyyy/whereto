"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

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
      className="absolute inset-4 top-16 bottom-6 rounded-3xl overflow-hidden shadow-2xl touch-none"
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

function DiscoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intent = searchParams.get("intent") ?? "study";
  const intentLabel = INTENT_LABELS[intent] ?? intent;

  const [currentIndex, setCurrentIndex] = useState(0);
  const allDone = currentIndex >= CAFES.length;

  function handleSwipe(direction: "left" | "right" | "up") {
    // In the future: save/skip/go-now logic here
    void direction;
    setCurrentIndex((prev) => prev + 1);
  }

  return (
    <div className="h-dvh bg-white flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <header className="relative z-30 flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1B2A4A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <span
          className="text-sm font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "#E85D2A1A", color: "#E85D2A" }}
        >
          {intentLabel}
        </span>
        {!allDone && (
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {currentIndex + 1} / {CAFES.length}
          </span>
        )}
      </header>

      {/* Card Stack */}
      {allDone ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <div className="text-6xl">&#x1F44B;</div>
          <h2 className="text-2xl font-bold" style={{ color: "#1B2A4A" }}>
            No more places!
          </h2>
          <p className="text-gray-500">
            You&apos;ve seen all the spots for this vibe. Try a different intent?
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 px-8 py-4 rounded-2xl text-lg font-bold bg-[#E85D2A] text-white shadow-lg shadow-[#E85D2A]/30 hover:bg-[#d04e1f] active:scale-[0.98] transition-all cursor-pointer"
          >
            Pick a New Vibe
          </button>
        </div>
      ) : (
        <div className="flex-1 relative">
          {CAFES.slice(currentIndex, currentIndex + 2)
            .reverse()
            .map((cafe, i, arr) => (
              <SwipeCard
                key={cafe.id}
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

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="h-dvh bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#E85D2A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
