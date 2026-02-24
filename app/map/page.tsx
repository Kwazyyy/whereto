"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Place } from "@/lib/types";
import { SavedPlace, getSavedPlaces } from "@/lib/saved-places";
import PlaceDetailSheet from "@/components/PlaceDetailSheet";
import { useSavePlace } from "@/lib/use-save-place";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useTheme } from "@/components/ThemeProvider";
import FogOverlay from "@/components/FogOverlay";

const DEFAULT_LAT = 43.6532;
const DEFAULT_LNG = -79.3832;

// Minimal map style — hides POI clutter, softens colours
const MAP_STYLES: Array<{ featureType?: string; elementType?: string; stylers: Array<Record<string, string>> }> = [
  { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#e8f5e3" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cde8f7" }] },
  { featureType: "water", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#fde9c4" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#f0c97a" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#cccccc" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#777777" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#999999" }] },
];

const DARK_MAP_STYLES: Array<{ featureType?: string; elementType?: string; stylers: Array<Record<string, string>> }> = [
  { elementType: "geometry", stylers: [{ color: "#14171c" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1e24" }] },
  { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#1a2421" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#14171c" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#1a1e24" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#222730" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#2d333f" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#2c3e50" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#34495e" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#454d5c" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#a0aabf" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#8793a8" }] },
];

const FALLBACK_GRADIENTS = [
  "from-amber-800 via-orange-700 to-yellow-600",
  "from-slate-800 via-slate-600 to-cyan-700",
  "from-green-800 via-emerald-700 to-teal-600",
  "from-purple-900 via-violet-700 to-fuchsia-600",
  "from-stone-800 via-stone-600 to-orange-800",
];

const categories = [
  { id: "study", emoji: "\u{1F4DA}", label: "Study / Work" },
  { id: "date", emoji: "\u2764\uFE0F", label: "Date / Chill" },
  { id: "trending", emoji: "\u{1F525}", label: "Trending Now" },
  { id: "quiet", emoji: "\u{1F92B}", label: "Quiet Caf\u00E9s" },
  { id: "laptop", emoji: "\u{1F50C}", label: "Laptop-Friendly" },
  { id: "group", emoji: "\u{1F46F}", label: "Group Hangouts" },
  { id: "budget", emoji: "\u{1F354}", label: "Budget Eats" },
  { id: "coffee", emoji: "\u2615", label: "Coffee & Catch-Up" },
  { id: "outdoor", emoji: "\u{1F305}", label: "Outdoor / Patio" },
];

// SVG teardrop pin as a data-URL icon for standard Marker (no mapId needed).
// Google Maps anchors string icons at the bottom-centre by default — perfect for a teardrop tip.
function pinUrl(color: string): string {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">`,
    `<path d="M18 0C8.059 0 0 8.059 0 18c0 11.25 18 28 18 28S36 29.25 36 18C36 8.059 27.941 0 18 0z" fill="${color}"/>`,
    `<circle cx="18" cy="17" r="7.5" fill="white" opacity="0.9"/>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Broken/Shattered PIN for unvisited locations in the fog
function crackedPinUrl(color: string): string {
  const maskId = `shatterMask-${color.replace('#', '')}`;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" style="overflow: visible;">`,
    `  <defs>`,
    `    <mask id="${maskId}">`,
    `      <rect x="-10" y="-10" width="56" height="66" fill="white"/>`,
    `      <polygon points="7,-2 10,4 3,9" fill="black"/>`,
    `      <polygon points="28,-2 25,5 34,7" fill="black"/>`,
    `      <polygon points="-1,16 5,18 4,24 -2,25" fill="black"/>`,
    `      <polygon points="38,15 31,18 31,24 37,26" fill="black"/>`,
    `      <polygon points="17,46 25,32 36,32 36,50 17,50" fill="black"/>`,
    `    </mask>`,
    `  </defs>`,
    `  <g mask="url(#${maskId})">`,
    `    <path d="M18 0C8.059 0 0 8.059 0 18c0 11.25 18 28 18 28S36 29.25 36 18C36 8.059 27.941 0 18 0z" fill="${color}"/>`,
    `  </g>`,
    `  <g fill="none" stroke="#64748B" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round">`,
    `    <path d="M21 0 L22 4 L20 8 L22 13 L21 17"/>`,
    `    <path d="M8 4 L11 8 L10 13 L14 17"/>`,
    `    <path d="M4 18 L9 19 L11 16 L14 17"/>`,
    `    <path d="M7 28 L11 25 L13 27 L16 23"/>`,
    `    <path d="M14 40 L16 35 L14 30 L16 25 L15 21"/>`,
    `    <path d="M31 18 L26 19 L25 15 L22 17"/>`,
    `    <path d="M3 9 L10 4 L7 0" stroke-width="1.0"/>`,
    `    <path d="M28 0 L25 5 L33 7" stroke-width="1.0"/>`,
    `    <path d="M0 16 L5 18 L4 24 L0 25" stroke-width="1.0"/>`,
    `    <path d="M36 16 L31 18 L31 24 L36 26" stroke-width="1.0"/>`,
    `    <path d="M17 40 L25 32 L34 31" stroke-width="1.0"/>`,
    `  </g>`,
    `  <g fill="${color}">`,
    `    <polygon points="-2,17 0,16 -1,20"/>`,
    `    <polygon points="38,20 39,18 41,21"/>`,
    `    <polygon points="27,35 32,32 30.5,41"/>`,
    `    <polygon points="25,43 27,41 24,46"/>`,
    `  </g>`,
    `  <circle cx="18" cy="17" r="7.5" fill="white" opacity="0.95"/>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const ORANGE_PIN = pinUrl("#E85D2A");
const ORANGE_CRACKED_PIN = crackedPinUrl("#DB8E74"); // Duller, faded orange
const BLUE_PIN = pinUrl("#3B82F6");
const BLUE_CRACKED_PIN = crackedPinUrl("#6B9AE5"); // Duller, lighter blue per request
const GREEN_PIN = pinUrl("#22C55E");
const GREEN_CRACKED_PIN = crackedPinUrl("#86EFAC"); // Duller green if ever used in fog

// --- Thumbnail photo inside the info card ---
function InfoPhoto({ photoRef }: { photoRef: string | null }) {
  const url = usePhotoUrl(photoRef);
  return url ? (
    <Image
      src={url}
      alt=""
      fill
      className="object-cover"
      unoptimized
      style={{ borderRadius: 8 }}
    />
  ) : (
    <div style={{ width: "100%", height: "100%", background: "var(--color-surface-raised)", borderRadius: 8 }} />
  );
}

// --- Info card rendered inside the InfoWindow ---
function InfoCard({
  place,
  isSaved,
  onViewDetails,
}: {
  place: Place | SavedPlace;
  isSaved: boolean;
  onViewDetails: () => void;
}) {
  const meta = [
    place.distance,
    place.price,
    place.rating > 0 ? `\u2605 ${place.rating.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join("  \u00B7  ");

  return (
    <div style={{ width: 210, fontFamily: "inherit" }}>
      {/* Thumbnail */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 108,
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 10,
          background: "var(--color-surface-card)",
        }}
      >
        <InfoPhoto photoRef={place.photoRef} />
        {isSaved && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "#E85D2A",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            Saved
          </div>
        )}
      </div>

      {/* Name */}
      <p
        style={{
          margin: 0,
          fontWeight: 700,
          fontSize: 14,
          color: "var(--color-navy)",
          lineHeight: 1.3,
          marginBottom: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {place.name}
      </p>

      {/* Meta: distance · price · rating */}
      <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>
        {meta}
      </p>

      {/* View Details */}
      <button
        onClick={onViewDetails}
        style={{
          width: "100%",
          padding: "9px 0",
          background: "#E85D2A",
          color: "white",
          border: "none",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        View Details
      </button>
    </div>
  );
}

// --- Re-center button — must be inside Map context to use useMap ---
function RecenterButton({
  userLocation,
}: {
  userLocation: { lat: number; lng: number };
}) {
  const map = useMap();

  return (
    <button
      onClick={() => map?.panTo(userLocation)}
      title="Re-centre map"
      style={{
        position: "absolute",
        bottom: 24,
        right: 16,
        zIndex: 10,
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "var(--color-btn-bg)",
        border: "1px solid var(--color-btn-border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-navy)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    </button>
  );
}

// --- Bridge to extract map instance from inside <Map> context ---
function MapInstanceBridge({ onMapReady }: { onMapReady: (map: google.maps.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

// --- Markers + InfoWindow — rendered inside <Map> so they have map context ---
function MapMarkers({
  savedPlaces,
  nearbyPlaces,
  visitedIds,
  fogEnabled,
  onSelectPlace,
}: {
  savedPlaces: SavedPlace[];
  nearbyPlaces: Place[];
  visitedIds: Set<string>;
  fogEnabled: boolean;
  onSelectPlace: (place: Place) => void;
}) {
  const [selected, setSelected] = useState<{
    place: Place | SavedPlace;
    isSaved: boolean;
  } | null>(null);

  const savedIds = new Set(savedPlaces.map((p) => p.placeId));

  return (
    <>
      {/* Blue "Cracked" markers — nearby unvisited places, rendered first */}
      {nearbyPlaces
        .filter((p) => !savedIds.has(p.placeId) && !visitedIds.has(p.placeId))
        .map((place) => (
          <Marker
            key={`nearby-${place.placeId}`}
            position={place.location}
            icon={fogEnabled ? BLUE_CRACKED_PIN : BLUE_PIN}
            zIndex={9999}
            onClick={() => setSelected({ place, isSaved: false })}
          />
        ))}

      {/* Green markers — visited places */}
      {nearbyPlaces
        .filter((p) => visitedIds.has(p.placeId) && !savedIds.has(p.placeId))
        .map((place) => (
          <Marker
            key={`visited-${place.placeId}`}
            position={place.location}
            icon={fogEnabled ? GREEN_CRACKED_PIN : GREEN_PIN}
            zIndex={9999}
            onClick={() => setSelected({ place, isSaved: false })}
          />
        ))}

      {/* Orange markers — saved places, always on top */}
      {savedPlaces.map((place) => (
        <Marker
          key={`saved-${place.placeId}`}
          position={place.location}
          icon={fogEnabled ? ORANGE_CRACKED_PIN : ORANGE_PIN}
          zIndex={9999}
          onClick={() => setSelected({ place, isSaved: true })}
        />
      ))}

      {/* Info popup */}
      {selected && (
        <InfoWindow
          position={selected.place.location}
          onCloseClick={() => setSelected(null)}
        >
          <InfoCard
            place={selected.place}
            isSaved={selected.isSaved}
            onViewDetails={() => {
              onSelectPlace(selected.place as Place);
              setSelected(null);
            }}
          />
        </InfoWindow>
      )}
    </>
  );
}

// --- Main page ---
export default function MapPage() {
  const { status } = useSession();
  const { handleSave } = useSavePlace();

  const [intent, setIntent] = useState("trending");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [fogEnabled, setFogEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("whereto-fog-enabled");
      return stored === null ? true : stored === "true";
    }
    return true;
  });
  const [visitedLocations, setVisitedLocations] = useState<{ lat: number; lng: number; placeId: string }[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const { theme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  // Get GPS location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG }),
      { timeout: 8000 }
    );
  }, []);

  // Load saved places (DB if logged in, localStorage if not)
  useEffect(() => {
    if (status === "loading") return;
    async function load() {
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/saves");
          if (res.ok) setSavedPlaces(await res.json());
        } catch {
          setSavedPlaces([]);
        }
      } else {
        setSavedPlaces(getSavedPlaces());
      }
    }
    load();
  }, [status]);

  // Fetch visited places for fog-of-war
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/visits")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { placeId: string; lat: number; lng: number }[]) => {
        if (Array.isArray(data)) {
          setVisitedLocations(data.map(v => ({ lat: v.lat, lng: v.lng, placeId: v.placeId })));
          setVisitedIds(new Set(data.map(v => v.placeId)));
        }
      })
      .catch(() => { });
  }, [status]);

  // Fetch nearby places when intent or location changes
  const fetchNearby = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places?intent=${intent}&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`
      );
      if (res.ok) {
        const data = await res.json();
        setNearbyPlaces(data.places ?? []);
      }
    } catch {
      setNearbyPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [intent, userLocation]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  const fallbackGradient =
    FALLBACK_GRADIENTS[
    detailPlace
      ? nearbyPlaces.findIndex((p) => p.placeId === detailPlace.placeId) %
      FALLBACK_GRADIENTS.length
      : 0
    ] ?? FALLBACK_GRADIENTS[0];

  const neighborhoods = useMemo(
    () => new Set(visitedLocations.map(v => `${Math.floor(v.lat * 100)}_${Math.floor(v.lng * 100)}`)).size,
    [visitedLocations]
  );

  return (
    <div className="h-dvh bg-white dark:bg-[#0E1116] flex flex-col overflow-hidden pb-16">
      {/* Intent chips */}
      <div
        className="shrink-0 px-5 py-3 border-b border-gray-100 dark:border-white/10"
      >
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setIntent(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${intent === cat.id
                ? "bg-[#E85D2A] text-white shadow-sm"
                : "bg-gray-100 dark:bg-white/10 text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-200 dark:hover:bg-white/15"
                }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative" ref={mapContainerRef}>
        {!userLocation ? (
          /* Location loading spinner */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
              style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
            />
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
              Getting your location...
            </p>
          </div>
        ) : (
          <>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
              <Map
                defaultCenter={userLocation}
                defaultZoom={13}
                gestureHandling="greedy"
                disableDefaultUI
                styles={isDarkMode ? DARK_MAP_STYLES : MAP_STYLES}
                style={{ width: "100%", height: "100%" }}
              >
                <MapInstanceBridge onMapReady={setMapInstance} />
                <MapMarkers
                  savedPlaces={savedPlaces.filter(p => p.intent === intent)}
                  nearbyPlaces={nearbyPlaces}
                  visitedIds={visitedIds}
                  fogEnabled={fogEnabled && status === "authenticated"}
                  onSelectPlace={setDetailPlace}
                />
                <RecenterButton userLocation={userLocation} />
              </Map>
            </APIProvider>
            {/* Fog canvas — SIBLING of the map, NOT inside it */}
            <FogOverlay
              mapInstance={mapInstance}
              visitedLocations={visitedLocations}
              userLocation={userLocation}
              enabled={fogEnabled && status === "authenticated"}
              isDark={isDarkMode}
              containerRef={mapContainerRef}
            />
          </>
        )}

        {/* Searching overlay */}
        <AnimatePresence>
          {loading && userLocation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-md shadow-md border border-gray-100 dark:border-white/10"
            >
              <div className="w-3.5 h-3.5 rounded-full border-[2px] border-t-transparent animate-spin" style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }} />
              <span className="text-xs font-semibold text-[#0E1116] dark:text-[#e8edf4]">Searching...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        {userLocation && (
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-md border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#E85D2A] shadow-sm shrink-0" />
              <span className="text-[11px] font-semibold text-[#0E1116] dark:text-[#e8edf4]">Saved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#22C55E] shadow-sm shrink-0" />
              <span className="text-[11px] font-semibold text-[#0E1116] dark:text-[#e8edf4]">Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#3B82F6] shadow-sm shrink-0" />
              <span className="text-[11px] font-semibold text-[#0E1116] dark:text-[#e8edf4]">Nearby</span>
            </div>
          </div>
        )}

        {/* Fog toggle button — small circle near recenter */}
        {userLocation && status === "authenticated" && (
          <button
            onClick={() => {
              setFogEnabled(f => {
                const next = !f;
                localStorage.setItem("whereto-fog-enabled", String(next));
                return next;
              });
            }}
            title={fogEnabled ? "Hide fog" : "Show fog"}
            style={{
              position: "absolute",
              bottom: 80,
              right: 16,
              zIndex: 30,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: fogEnabled ? "#0E1116" : "var(--color-btn-bg)",
              border: `1px solid ${fogEnabled ? "#0E1116" : "var(--color-btn-border)"}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            {fogEnabled ? "🌫️" : "🗺️"}
          </button>
        )}

        {/* Exploration stats pill */}
        {userLocation && status === "authenticated" && visitedLocations.length > 0 && fogEnabled && (
          <div className="absolute top-3 right-3 z-30 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
            <p className="text-[11px] font-semibold text-white whitespace-nowrap">
              {visitedLocations.length} {visitedLocations.length === 1 ? "place" : "places"} · {neighborhoods} {neighborhoods === 1 ? "area" : "areas"}
            </p>
          </div>
        )}
      </div>

      {/* Place detail bottom sheet */}
      <AnimatePresence>
        {detailPlace && (
          <PlaceDetailSheet
            place={detailPlace}
            fallbackGradient={fallbackGradient}
            onClose={() => setDetailPlace(null)}
            onSave={(action) => handleSave(detailPlace, intent, action)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
