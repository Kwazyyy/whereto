"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Award, Pen, MapPin } from "lucide-react";

// ─── Map: Explore Your City ───
// Mini map with fog that fades away left-to-right, revealing orange dots
function MapExploreAnimation() {
  return (
    <div className="relative w-[120px] h-[80px] rounded-lg bg-[#1C2128] border border-[#30363D]/50 overflow-hidden">
      {/* Orange dots underneath */}
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#E85D2A]" style={{ position: "absolute", top: 20, left: 25 }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E85D2A]" style={{ position: "absolute", top: 45, left: 55 }} />
        <div className="w-2 h-2 rounded-full bg-[#E85D2A]" style={{ position: "absolute", top: 30, left: 80 }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E85D2A]" style={{ position: "absolute", top: 55, left: 35 }} />
        <div className="w-2 h-2 rounded-full bg-[#E85D2A]" style={{ position: "absolute", top: 15, left: 65 }} />
      </div>
      {/* Fog overlay that slides away */}
      <motion.div
        className="absolute inset-0 bg-[#1C2128]"
        animate={{ x: ["0%", "110%"] }}
        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
      />
      <MapPin className="absolute bottom-1 right-1 w-3 h-3 text-[#8B949E]/40" />
    </div>
  );
}

// ─── Map: Filter What You See ───
// 3 pills light up one by one grey → orange
function MapFilterAnimation() {
  const pills = ["Study", "Date", "Cafe"];
  return (
    <div className="flex items-center justify-center gap-2">
      {pills.map((label, i) => (
        <motion.span
          key={label}
          className="px-3 py-1 rounded-full text-[10px] font-medium"
          animate={{
            backgroundColor: [
              "rgba(255,255,255,0.1)",
              "rgba(255,255,255,0.1)",
              "#E85D2A",
              "#E85D2A",
              "rgba(255,255,255,0.1)",
            ],
            color: [
              "rgba(255,255,255,0.4)",
              "rgba(255,255,255,0.4)",
              "#FFFFFF",
              "#FFFFFF",
              "rgba(255,255,255,0.4)",
            ],
          }}
          transition={{
            duration: 2.8,
            times: [0, i * 0.14, i * 0.14 + 0.14, i * 0.14 + 0.28, 1],
            repeat: Infinity,
            repeatDelay: 0.8,
          }}
        >
          {label}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Boards: Your Saved Spots ───
// 4 mini cards slide into a 2x2 grid, hold, fade out, loop
function BoardsSavedAnimation() {
  const cards = [0, 1, 2, 3];
  return (
    <motion.div
      className="grid grid-cols-2 gap-1.5 w-[80px]"
      animate={{ opacity: [0, 1, 1, 1, 0] }}
      transition={{ duration: 3.5, times: [0, 0.15, 0.6, 0.85, 1], repeat: Infinity, repeatDelay: 0.5 }}
    >
      {cards.map((i) => (
        <motion.div
          key={i}
          className="w-[36px] h-[36px] rounded-lg bg-white/10 border border-white/15"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: [30, 0], opacity: [0, 1] }}
          transition={{
            duration: 0.4,
            delay: i * 0.1,
            repeat: Infinity,
            repeatDelay: 3.1 - i * 0.1,
          }}
        />
      ))}
    </motion.div>
  );
}

// ─── Social: Your Food Crew ───
// 3 avatar circles with a "87%" badge that fades in/out between the first two
function SocialCrewAnimation() {
  const colors = ["#E85D2A", "#CA8A04", "#8B949E"];
  return (
    <div className="relative flex items-center justify-center gap-3 h-[50px]">
      {colors.map((color, i) => (
        <div
          key={i}
          className="w-8 h-8 rounded-full border border-white/15"
          style={{ backgroundColor: `${color}30` }}
        >
          <div className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold" style={{ color }}>
            {String.fromCharCode(65 + i)}
          </div>
        </div>
      ))}
      {/* Percentage badge */}
      <motion.div
        className="absolute left-1/2 -translate-x-[28px] -top-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
        style={{ backgroundColor: "#E85D2A" }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1.1, 1, 0.8],
        }}
        transition={{
          duration: 2.5,
          times: [0, 0.2, 0.7, 1],
          repeat: Infinity,
          repeatDelay: 1,
        }}
      >
        87%
      </motion.div>
    </div>
  );
}

// ─── Social: Recs From Friends ───
// Card slides in from right, notification dot pops in on top-right corner
function SocialRecsAnimation() {
  return (
    <div className="relative w-[120px] h-[60px] overflow-hidden">
      <motion.div
        className="absolute top-2 w-[50px] h-[50px] rounded-lg bg-white/10 border border-white/15 flex items-center justify-center"
        animate={{ x: [120, 35, 35, 120] }}
        transition={{
          duration: 3,
          times: [0, 0.2, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 0.8,
        }}
      >
        <MapPin className="w-4 h-4 text-white/30" />
        {/* Notification dot */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E85D2A]"
          animate={{
            scale: [0, 0, 1.3, 1, 1, 0],
            opacity: [0, 0, 1, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            times: [0, 0.25, 0.35, 0.4, 0.75, 0.8],
            repeat: Infinity,
            repeatDelay: 0.8,
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── Profile: Your Savrd Journey ───
// Progress bar fills to ~65%, badge pops in at the end
function ProfileJourneyAnimation() {
  return (
    <div className="flex items-center gap-2 w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#E85D2A]"
          animate={{ width: ["0%", "65%", "65%", "0%"] }}
          transition={{
            duration: 3.5,
            times: [0, 0.43, 0.85, 1],
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
      </div>
      <motion.div
        animate={{
          scale: [0, 0, 1.2, 1, 1, 0],
          opacity: [0, 0, 1, 1, 1, 0],
        }}
        transition={{
          duration: 3.5,
          times: [0, 0.43, 0.5, 0.55, 0.85, 1],
          repeat: Infinity,
          repeatDelay: 0.5,
        }}
      >
        <Award className="w-4 h-4 text-[#E85D2A]" />
      </motion.div>
    </div>
  );
}

// ─── Profile: Make It Yours ───
// Mini profile card with pen icon that moves to center and wiggles
function ProfileCustomizeAnimation() {
  return (
    <div className="relative w-[60px] h-[50px]">
      <div className="w-[60px] h-[50px] rounded-lg bg-white/10 border border-white/15" />
      <motion.div
        className="absolute text-[#8B949E]"
        animate={{
          bottom: [4, 18, 18, 4],
          right: [4, 20, 20, 4],
          rotate: [0, 0, -10, 10, -10, 0, 0],
        }}
        transition={{
          duration: 3,
          times: [0, 0.2, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1,
          rotate: {
            duration: 3,
            times: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 1,
          },
        }}
      >
        <Pen className="w-3.5 h-3.5" />
      </motion.div>
    </div>
  );
}

// ─── Animation mapper ───
const ANIMATIONS: Record<string, React.FC> = {
  "map-explore": MapExploreAnimation,
  "map-filter": MapFilterAnimation,
  "boards-saved": BoardsSavedAnimation,
  "social-crew": SocialCrewAnimation,
  "social-recs": SocialRecsAnimation,
  "profile-journey": ProfileJourneyAnimation,
  "profile-customize": ProfileCustomizeAnimation,
};

export function TabTooltipAnimation({ animationKey }: { animationKey: string }) {
  const Animation = ANIMATIONS[animationKey];
  if (!Animation) return null;
  return (
    <div className="flex items-center justify-center h-[80px] mb-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
      <AnimatePresence>
        <Animation />
      </AnimatePresence>
    </div>
  );
}
