"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ChevronDown, ChevronRight, Lock, Check, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { torontoNeighborhoods } from "@/lib/neighborhoods";

interface NeighborhoodStat {
  name: string;
  area: string;
  explored: boolean;
  visitCount: number;
  uniquePlaceCount: number;
}

interface ExplorationData {
  totalNeighborhoods: number;
  exploredCount: number;
  percentage: number;
  neighborhoods: NeighborhoodStat[];
}

interface ExplorationPanelProps {
  mapInstance?: google.maps.Map | null;
}

const AREAS = ["All", "Downtown", "West End", "East End", "Midtown", "North York", "Scarborough", "Etobicoke"];

export default function ExplorationPanel({ mapInstance }: ExplorationPanelProps) {
  const { status } = useSession();
  const { theme } = useTheme();
  const [data, setData] = useState<ExplorationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedArea, setSelectedArea] = useState("All");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  // Glass styles — Vision Pro inspired
  const pillGlassStyle: React.CSSProperties = {
    backgroundColor: isDark ? 'rgba(14, 17, 22, 0.4)' : 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(208, 215, 222, 0.5)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  };

  const panelGlassStyle: React.CSSProperties = isDark
    ? {
        backgroundColor: 'rgba(14, 17, 22, 0.2)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }
    : {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(208, 215, 222, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      };

  // Mobile touch refs
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartScrollTop = useRef(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    async function fetchStats() {
      try {
        const res = await fetch("/api/exploration-stats");
        if (res.ok) setData(await res.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [status]);

  // Resolve isDark from theme setting
  useEffect(() => {
    setIsDark(
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  // First-visit pulse animation
  useEffect(() => {
    try {
      if (!localStorage.getItem("whereto-exploration-pill-seen")) {
        setShowPulse(true);
        const timer = setTimeout(() => {
          setShowPulse(false);
          localStorage.setItem("whereto-exploration-pill-seen", "1");
        }, 3000);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Click outside to close on desktop
  useEffect(() => {
    if (!expanded) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inDesktop = panelRef.current?.contains(target);
      const inMobile = mobilePanelRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  if (loading) return null;

  // Unauthenticated pill
  if (status !== "authenticated" || !data) {
    return (
      <button
        className="fixed bottom-20 left-1/2 -translate-x-1/2 lg:bottom-auto lg:left-auto lg:translate-x-0 lg:top-20 lg:right-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer text-sm font-medium text-gray-900 dark:text-white hover:scale-[1.02] transition-all duration-300 shadow-lg"
        style={pillGlassStyle}
      >
        <Compass className="w-4 h-4 text-[#E85D2A]" />
        <span>Explore Toronto</span>
      </button>
    );
  }

  const filteredNeighborhoods = data.neighborhoods.filter(
    (n) => selectedArea === "All" || n.area === selectedArea
  );

  function getAreaCounts(area: string) {
    if (area === "All") return { explored: data!.exploredCount, total: data!.totalNeighborhoods };
    const hoods = data!.neighborhoods.filter((n) => n.area === area);
    return { explored: hoods.filter((n) => n.explored).length, total: hoods.length };
  }

  const sorted = [...filteredNeighborhoods].sort((a, b) => {
    if (a.explored && !b.explored) return -1;
    if (!a.explored && b.explored) return 1;
    return a.name.localeCompare(b.name);
  });

  function handleNeighborhoodClick(hoodName: string) {
    setSelectedNeighborhood(hoodName);
    const hoodGeo = torontoNeighborhoods.find((n) => n.name === hoodName);
    if (hoodGeo && mapInstance) {
      mapInstance.panTo({ lat: hoodGeo.center.lat, lng: hoodGeo.center.lng });
      mapInstance.setZoom(15);
    }
  }

  function handleMobileTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchStartScrollTop.current = mobileScrollRef.current?.scrollTop ?? 0;
  }

  function handleMobileTouchEnd(e: React.TouchEvent) {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (touchStartScrollTop.current <= 0 && deltaY > 80) {
      setExpanded(false);
    }
  }

  // Get selected neighborhood data
  const selectedHoodStat = selectedNeighborhood
    ? data.neighborhoods.find((n) => n.name === selectedNeighborhood)
    : null;
  const selectedHoodGeo = selectedNeighborhood
    ? torontoNeighborhoods.find((n) => n.name === selectedNeighborhood)
    : null;

  // ── Neighborhood detail view ──
  const neighborhoodDetail = selectedHoodStat ? (
    <div className="px-4 pb-4">
      <button
        onClick={() => setSelectedNeighborhood(null)}
        className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <span className="text-base font-medium">Back to neighborhoods</span>
      </button>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        {selectedHoodStat.name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-4">
        {selectedHoodGeo?.area}
      </p>

      {selectedHoodStat.explored ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-black/8 dark:bg-white/8">
          <Check className="w-5 h-5 text-[#E85D2A] shrink-0" />
          <div>
            <p className="text-base font-medium text-[#E85D2A]">Explored!</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {selectedHoodStat.visitCount} {selectedHoodStat.visitCount === 1 ? "place" : "places"} visited
              {selectedHoodStat.uniquePlaceCount > 0 && ` · ${selectedHoodStat.uniquePlaceCount} nearby`}
            </p>
            {selectedHoodStat.uniquePlaceCount > 0 && (
              <div className="mt-2" style={{ width: '100%', height: 4, borderRadius: 9999, backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}>
                <div style={{ height: 4, borderRadius: 9999, backgroundColor: '#E85D2A', width: `${Math.min(100, Math.round((selectedHoodStat.visitCount / selectedHoodStat.uniquePlaceCount) * 100))}%`, transition: 'width 500ms ease' }} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-black/8 dark:bg-white/8">
          <Lock className="w-5 h-5 text-gray-500 shrink-0" />
          <div>
            <p className="text-base font-normal text-gray-700 dark:text-gray-300">Undiscovered</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Visit spots here to start unlocking!</p>
          </div>
        </div>
      )}
    </div>
  ) : null;

  // ── Render a neighborhood row ──
  function renderRow(hood: NeighborhoodStat, isLast: boolean) {
    const isSelected = selectedNeighborhood === hood.name;
    return (
      <button
        key={hood.name}
        onClick={() => handleNeighborhoodClick(hood.name)}
        className={`w-full flex items-center justify-between py-3 lg:py-2 px-2 rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected
            ? "bg-[#E85D2A]/10 border-l-2 border-l-[#E85D2A]"
            : `border-l-2 border-l-transparent hover:bg-black/5 dark:hover:bg-white/5 ${!isLast ? "border-b border-gray-200/30 dark:border-[#30363D]/30" : ""}`
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              hood.explored ? "bg-[#E85D2A]" : "bg-gray-400 dark:bg-gray-600"
            }`}
          />
          <span
            className={`text-base lg:text-sm truncate text-left ${
              hood.explored
                ? "font-medium text-gray-900 dark:text-gray-100"
                : "font-medium text-gray-900 dark:text-gray-100"
            }`}
          >
            {hood.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hood.explored ? (
            <Check size={16} className="text-[#E85D2A]" />
          ) : (
            <Lock size={16} className="text-gray-500 dark:text-gray-500" />
          )}
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
        </div>
      </button>
    );
  }

  // ── Header block (title, progress bar, subtitle) ──
  const headerBlock = (
    <div className="p-4 pb-0">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">Exploration</span>
          <span className="text-xs font-semibold bg-[#E85D2A]/15 text-[#E85D2A] px-2 py-0.5 rounded-full">
            {data.percentage}%
          </span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="p-1 rounded-md text-gray-500 dark:text-[#8B949E] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Progress bar — pure inline styles to guarantee colors */}
      <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', marginTop: 8, marginBottom: 12 }}>
        <div style={{ height: 6, borderRadius: 9999, backgroundColor: '#E85D2A', width: `${data.percentage}%`, transition: 'width 500ms ease' }} />
      </div>

      {/* Subtitle */}
      <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-3">
        {data.exploredCount} of {data.totalNeighborhoods} neighborhoods discovered
      </p>
    </div>
  );

  // ── Chips section ──
  const chipsBlock = (
    <div className="relative px-4">
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        {AREAS.map((area) => {
          const counts = getAreaCounts(area);
          const isActive = selectedArea === area;
          return (
            <button
              key={area}
              onClick={() => { setSelectedArea(area); setSelectedNeighborhood(null); }}
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-medium border transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#E85D2A] text-white border-transparent"
                  : "bg-white/60 text-gray-700 border-gray-300 hover:border-[#E85D2A]/50 dark:bg-white/10 dark:text-gray-300 dark:border-[#30363D] dark:hover:border-[#E85D2A]/50"
              }`}
            >
              {area} ({counts.explored}/{counts.total})
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Neighborhood list (scrollable vertically) ──
  const neighborhoodList = (
    <div className="overflow-y-auto scrollbar-hide px-4 pb-4" style={{ maxHeight: '400px' }}>
      {sorted.map((hood, i) => renderRow(hood, i === sorted.length - 1))}
    </div>
  );

  // ── Panel content (shared between desktop & mobile) ──
  const panelContent = (
    <>
      {headerBlock}
      {chipsBlock}
      {selectedNeighborhood ? neighborhoodDetail : neighborhoodList}
    </>
  );

  // ── Collapsed pill (shared content for desktop & mobile) ──
  const pillContent = (
    <>
      <Compass className="w-4 h-4 text-[#E85D2A] shrink-0" />
      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Explore Toronto</span>
      <span className="text-xs whitespace-nowrap" style={{ color: '#8B949E' }}>{data.exploredCount}/{data.totalNeighborhoods}</span>
    </>
  );

  return (
    <>
      {/* Pulse ring keyframes */}
      {showPulse && (
        <style>{`
          @keyframes pulseRing {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 0; }
          }
        `}</style>
      )}

      {/* ── Desktop (lg+) ── */}
      <div className="hidden lg:block">
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.div
              key="pill"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed top-20 right-6 z-30"
            >
              {showPulse && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#E85D2A', animation: 'pulseRing 1.5s ease-out infinite', opacity: 0.3 }}
                />
              )}
              <button
                onClick={() => setExpanded(true)}
                className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-lg"
                style={pillGlassStyle}
              >
                {pillContent}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="panel"
              ref={panelRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-20 right-6 z-30 rounded-2xl"
              style={{ ...panelGlassStyle, width: 360, maxWidth: 360, maxHeight: '60vh' }}
            >
              {panelContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile (<lg) ── */}
      <div className="lg:hidden">
        <AnimatePresence>
          {!expanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30"
            >
              {showPulse && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#E85D2A', animation: 'pulseRing 1.5s ease-out infinite', opacity: 0.3 }}
                />
              )}
              <button
                onClick={() => setExpanded(true)}
                className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-300 shadow-lg"
                style={pillGlassStyle}
              >
                {pillContent}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {expanded && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40"
                onClick={() => setExpanded(false)}
              />
              <motion.div
                ref={mobilePanelRef}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed bottom-0 inset-x-0 z-50 rounded-t-2xl flex flex-col"
                style={{ ...panelGlassStyle, borderRadius: '16px 16px 0 0', height: "60dvh", touchAction: "none" }}
                onTouchStart={handleMobileTouchStart}
                onTouchEnd={handleMobileTouchEnd}
              >
                <div className="pt-3" />
                <div
                  ref={mobileScrollRef}
                  className="flex-1 min-h-0 flex flex-col"
                  style={{ overscrollBehavior: "contain" }}
                >
                  {headerBlock}
                  {chipsBlock}
                  {selectedNeighborhood ? (
                    neighborhoodDetail
                  ) : (
                    <div
                      className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 pb-4"
                      style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
                    >
                      {sorted.map((hood, i) => renderRow(hood, i === sorted.length - 1))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
