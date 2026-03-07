"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ChevronDown, ChevronRight, Lock, Check, ArrowLeft, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { torontoNeighborhoods } from "@/lib/neighborhoods";

// ── Types matching /api/exploration/challenges response ──

interface ChallengePlace {
  id: string;
  googlePlaceId: string;
  name: string;
  photoUrl: string | null;
  rating: number | null;
  visited: boolean;
}

interface NeighborhoodChallenge {
  id: string;
  name: string;
  area: string;
  totalPlacesInArea: number;
  requiredVisits: number;
  challengePlaces: ChallengePlace[];
  visitedCount: number;
  unlocked: boolean;
  status: "undiscovered" | "in_progress" | "unlocked" | "no_data";
}

interface ChallengeData {
  neighborhoods: NeighborhoodChallenge[];
  totalUnlocked: number;
  totalNeighborhoods: number;
  overallPercentage: number;
}

interface ExplorationPanelProps {
  mapInstance?: google.maps.Map | null;
}

const AREAS = ["All", "Downtown", "West End", "East End", "Midtown", "North York", "Scarborough", "Etobicoke"];

const AREA_VIEWS: Record<string, { lat: number; lng: number; zoom: number }> = {
  All:          { lat: 43.6532, lng: -79.3832, zoom: 11 },
  Downtown:     { lat: 43.6510, lng: -79.3810, zoom: 13 },
  "West End":   { lat: 43.6480, lng: -79.4450, zoom: 13 },
  "East End":   { lat: 43.6680, lng: -79.3250, zoom: 13 },
  Midtown:      { lat: 43.6950, lng: -79.3980, zoom: 13 },
  "North York": { lat: 43.7615, lng: -79.4111, zoom: 12 },
  Scarborough:  { lat: 43.7731, lng: -79.2572, zoom: 12 },
  Etobicoke:    { lat: 43.6205, lng: -79.5132, zoom: 12 },
};

export default function ExplorationPanel({ mapInstance }: ExplorationPanelProps) {
  const { status } = useSession();
  const { theme } = useTheme();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedArea, setSelectedArea] = useState("All");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  // Glass styles — Vision Pro inspired (use `background` shorthand, NOT `backgroundColor`)
  const pillGlassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(14, 17, 22, 0.4)' : 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(208, 215, 222, 0.5)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  };

  const panelGlassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(14, 17, 22, 0.2)' : 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 20px 25px rgba(0,0,0,0.15)',
  };

  const mobilePanelGlassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(14, 17, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 20px 25px rgba(0,0,0,0.15)',
  };

  // Mobile touch refs
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartScrollTop = useRef(0);

  // Fetch challenge data
  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/exploration/challenges")
      .then((res) => res.json())
      .then((data: ChallengeData) => setChallengeData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
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

  // Unauthenticated — static pill, no expand
  if (status !== "authenticated") {
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

  // Loading or no data yet — expandable pill with skeleton panel
  if (loading || !challengeData) {
    const skeletonPanel = (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="animate-pulse rounded h-5 w-24" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          <div className="animate-pulse rounded-full h-5 w-10" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
        </div>
        <div className="animate-pulse rounded-full h-1.5 w-full mb-4" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
        {[1, 2, 3, 4, 5].map((k) => (
          <div key={k} className="flex items-center justify-between py-3 px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
              <div className="animate-pulse rounded h-4 w-28" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
            </div>
            <div className="animate-pulse rounded h-4 w-8" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          </div>
        ))}
      </div>
    );

    return (
      <>
        {/* Desktop skeleton */}
        <div className="hidden lg:block">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="fixed top-20 right-6 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-full hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-lg"
              style={pillGlassStyle}
            >
              <Compass className="w-4 h-4 text-[#E85D2A]" />
              <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Explore Toronto</span>
            </button>
          ) : (
            <div
              ref={panelRef}
              className="fixed top-20 right-6 z-30 rounded-2xl"
              style={{ ...panelGlassStyle, width: 360, maxWidth: 360 }}
            >
              <div className="flex justify-end p-4 pb-0">
                <button onClick={() => setExpanded(false)} className="p-1 rounded-md text-gray-500 dark:text-[#8B949E] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                  <ChevronDown size={20} />
                </button>
              </div>
              {skeletonPanel}
            </div>
          )}
        </div>
        {/* Mobile skeleton */}
        <div className="lg:hidden">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-300 shadow-lg"
              style={pillGlassStyle}
            >
              <Compass className="w-4 h-4 text-[#E85D2A]" />
              <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Explore Toronto</span>
            </button>
          ) : (
            <>
              <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setExpanded(false)} />
              <div
                ref={mobilePanelRef}
                className="fixed bottom-0 inset-x-0 z-50 rounded-t-2xl"
                style={{ ...mobilePanelGlassStyle, borderRadius: '16px 16px 0 0', height: '60dvh' }}
              >
                <div className="pt-3" />
                <div className="flex justify-end px-4">
                  <button onClick={() => setExpanded(false)} className="p-1 rounded-md text-gray-500 dark:text-[#8B949E] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                    <ChevronDown size={20} />
                  </button>
                </div>
                {skeletonPanel}
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  // ── Derived data from challengeData ──

  const filteredNeighborhoods = challengeData.neighborhoods.filter(
    (n) => selectedArea === "All" || n.area === selectedArea
  );

  function getAreaCounts(area: string) {
    if (area === "All") return { explored: challengeData!.totalUnlocked, total: challengeData!.totalNeighborhoods };
    const hoods = challengeData!.neighborhoods.filter((n) => n.area === area);
    return { explored: hoods.filter((n) => n.unlocked).length, total: hoods.length };
  }

  // Sort: unlocked first, then in_progress, then undiscovered, then no_data
  const statusOrder: Record<string, number> = { unlocked: 0, in_progress: 1, undiscovered: 2, no_data: 3 };
  const sorted = [...filteredNeighborhoods].sort((a, b) => {
    const orderDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
    if (orderDiff !== 0) return orderDiff;
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

  // ── Get selected neighborhood challenge data ──
  const selectedNbData = selectedNeighborhood
    ? challengeData.neighborhoods.find((n) => n.name === selectedNeighborhood)
    : null;
  const selectedHoodGeo = selectedNeighborhood
    ? torontoNeighborhoods.find((n) => n.name === selectedNeighborhood)
    : null;

  // ── Neighborhood detail view (with challenge places) ──
  const neighborhoodDetail = selectedNbData ? (
    <div className="px-4 pb-4">
      <button
        onClick={() => setSelectedNeighborhood(null)}
        className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <span className="text-base font-medium">Back to neighborhoods</span>
      </button>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        {selectedNbData.name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-4">
        {selectedHoodGeo?.area}
      </p>

      {/* Progress section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedNbData.visitedCount}/{selectedNbData.requiredVisits} places visited
          </span>
          {selectedNbData.status === "unlocked" && (
            <span className="text-xs font-medium text-[#E85D2A]">Unlocked!</span>
          )}
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}>
          <div style={{
            height: 6,
            borderRadius: 9999,
            backgroundColor: '#E85D2A',
            width: selectedNbData.requiredVisits > 0
              ? `${Math.min(100, Math.round((selectedNbData.visitedCount / selectedNbData.requiredVisits) * 100))}%`
              : '0%',
            transition: 'width 500ms ease',
          }} />
        </div>
      </div>

      {/* Challenge places list */}
      {selectedNbData.status === "no_data" ? (
        <div className="text-center py-6">
          <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: isDark ? '#8B949E' : '#656D76' }} />
          <p className="text-sm text-gray-700 dark:text-gray-300">We&apos;re adding places to this neighborhood soon!</p>
          <p className="text-xs mt-1" style={{ color: isDark ? '#8B949E' : '#656D76' }}>Visit any cafe or restaurant here to start exploring.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: isDark ? '#8B949E' : '#656D76' }}>
            Places to Visit
          </p>
          {selectedNbData.challengePlaces.map((place) => (
            <div key={place.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              {place.photoUrl ? (
                <img src={place.photoUrl} alt={place.name} className="w-14 h-14 lg:w-12 lg:h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 lg:w-12 lg:h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                  <MapPin className="w-5 h-5" style={{ color: isDark ? '#8B949E' : '#9CA3AF' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base lg:text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{place.name}</p>
                {place.rating ? (
                  <p className="text-xs" style={{ color: isDark ? '#8B949E' : '#656D76' }}>
                    ★ {place.rating}
                  </p>
                ) : null}
              </div>
              {place.visited ? (
                <Check className="w-5 h-5 text-[#E85D2A] flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  // ── Render a neighborhood row ──
  function renderRow(hood: NeighborhoodChallenge, isLast: boolean) {
    const isSelected = selectedNeighborhood === hood.name;

    // Dot color — inline styles for glass contrast
    const dotStyle: React.CSSProperties =
      hood.status === "unlocked" ? { backgroundColor: '#E85D2A' }
      : hood.status === "in_progress" ? { backgroundColor: '#CA8A04' }
      : { backgroundColor: isDark ? '#8B949E' : '#656D76' };

    // Progress text per status
    const progressText =
      hood.status === "unlocked" ? "Unlocked ✓"
      : hood.status === "in_progress" ? `${hood.visitedCount}/${hood.requiredVisits} visited`
      : hood.status === "no_data" ? "Coming soon"
      : `0/${hood.requiredVisits} to unlock`;

    const progressColor =
      hood.status === "unlocked" ? '#E85D2A'
      : hood.status === "in_progress" ? '#CA8A04'
      : isDark ? '#8B949E' : '#656D76';

    return (
      <button
        key={hood.name}
        onClick={() => handleNeighborhoodClick(hood.name)}
        className={`w-full text-left flex items-center py-3 px-2 rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected
            ? "border-l-2 border-l-[#E85D2A]"
            : "border-l-2 border-l-transparent"
        }`}
        style={{
          ...(isSelected ? { background: 'rgba(232, 93, 42, 0.1)' } : {}),
          ...(!isSelected && !isLast ? { borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` } : {}),
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        <div className="w-5 flex-shrink-0 flex justify-center">
          <div className="w-2 h-2 rounded-full" style={dotStyle} />
        </div>
        <div className="flex-1 min-w-0 ml-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block text-left" style={{ lineHeight: '20px' }}>
            {hood.name}
          </span>
          <span className="text-xs block" style={{ lineHeight: '16px', marginTop: 2, color: progressColor }}>
            {progressText}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {hood.status === "unlocked" ? (
            <Check size={16} style={{ color: '#E85D2A' }} />
          ) : hood.status === "no_data" ? (
            <MapPin size={16} style={{ color: isDark ? '#8B949E' : '#656D76' }} />
          ) : (
            <Lock size={16} style={{ color: isDark ? '#8B949E' : '#656D76' }} />
          )}
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? '#8B949E' : '#9CA3AF' }} />
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
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(232, 93, 42, 0.15)', color: '#E85D2A' }}>
            {challengeData.overallPercentage}%
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
        <div style={{ height: 6, borderRadius: 9999, backgroundColor: '#E85D2A', width: `${challengeData.overallPercentage}%`, transition: 'width 500ms ease' }} />
      </div>

      {/* Subtitle */}
      <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-3">
        {challengeData.totalUnlocked} of {challengeData.totalNeighborhoods} neighborhoods unlocked
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
              onClick={() => {
                setSelectedArea(area);
                setSelectedNeighborhood(null);
                const view = AREA_VIEWS[area];
                if (view && mapInstance) {
                  mapInstance.panTo({ lat: view.lat, lng: view.lng });
                  mapInstance.setZoom(view.zoom);
                }
              }}
              className="flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: isActive ? '#E85D2A' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'),
                color: isActive ? '#fff' : (isDark ? '#D1D5DB' : '#374151'),
                border: isActive ? '1px solid transparent' : `1px solid ${isDark ? '#30363D' : '#D1D5DB'}`,
              }}
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
      <span className="text-xs whitespace-nowrap" style={{ color: '#8B949E' }}>{challengeData.totalUnlocked}/{challengeData.totalNeighborhoods}</span>
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
                style={{ ...mobilePanelGlassStyle, borderRadius: '16px 16px 0 0', height: "60dvh", touchAction: "none" }}
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
