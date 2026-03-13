"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { BookOpen, Heart, Flame, Coffee, Laptop, Users, DollarSign, MessageCircle, Sun, Sofa } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Place } from "@/lib/types";
import { SavedPlace, getSavedPlaces } from "@/lib/saved-places";
import MapPlaceDetail from "@/components/MapPlaceDetail";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useTheme } from "@/components/ThemeProvider";
import FogOverlay from "@/components/FogOverlay";
import VisitCelebration from "@/components/VisitCelebration";
import PhotoUploadPrompt from "@/components/PhotoUploadPrompt";
import ExplorationPanel from "@/components/ExplorationPanel";
import { getBookingUrl, isReservable } from "@/lib/booking";
import { TabTooltip } from "@/components/onboarding/TabTooltip";

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

const categories = [
  { id: "study_work", icon: BookOpen, label: "Study / Work" },
  { id: "romantic", icon: Heart, label: "Romantic" },
  { id: "chill", icon: Sofa, label: "Chill Vibes" },
  { id: "trending", icon: Flame, label: "Trending Now" },
  { id: "quiet_cafes", icon: Coffee, label: "Quiet Cafés" },
  { id: "laptop_friendly", icon: Laptop, label: "Laptop-Friendly" },
  { id: "group_hangouts", icon: Users, label: "Group Hangouts" },
  { id: "budget_eats", icon: DollarSign, label: "Budget Eats" },
  { id: "coffee_catch_up", icon: MessageCircle, label: "Coffee & Catch-Up" },
  { id: "outdoor_patio", icon: Sun, label: "Outdoor / Patio" },
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

// Saved = Blue, Visited = Orange, Nearby = theme-aware grey
const SAVED_PIN = pinUrl("#3B82F6");
const SAVED_CRACKED_PIN = crackedPinUrl("#6B9AE5");
const VISITED_PIN = pinUrl("#E85D2A");
const VISITED_CRACKED_PIN = crackedPinUrl("#DB8E74");
const NEARBY_PIN_LIGHT = pinUrl("#8B949E");
const NEARBY_CRACKED_PIN_LIGHT = crackedPinUrl("#6B7280");
const NEARBY_PIN_DARK = pinUrl("#C9D1D9");
const NEARBY_CRACKED_PIN_DARK = crackedPinUrl("#A0AAB8");

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

function computeDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): string {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  const km = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

// --- Info card rendered inside the InfoWindow ---
function InfoCard({
  place,
  isSaved,
  isDark,
  userLocation,
  onViewDetails,
  onClose,
}: {
  place: Place | SavedPlace;
  isSaved: boolean;
  isDark: boolean;
  userLocation?: { lat: number; lng: number };
  onViewDetails: () => void;
  onClose: () => void;
}) {
  const displayDistance = place.distance || (userLocation && place.location ? computeDistance(userLocation, place.location) : "");
  const muted = isDark ? "#8B949E" : "#4B5563";
  const linkRest = isDark ? "#8B949E" : "#4B5563";

  return (
    <div
      style={{
        width: 260,
        fontFamily: "inherit",
        background: isDark ? "rgba(22, 27, 34, 0.75)" : "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: 16,
        padding: 12,
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.4)"
          : "0 8px 32px rgba(0, 0, 0, 0.12)",
        position: "relative",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "none",
          border: "none",
          color: muted,
          cursor: "pointer",
          padding: 4,
          lineHeight: 1,
          fontSize: 16,
          zIndex: 2,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0E1116"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = muted; }}
      >
        &#x2715;
      </button>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {/* Photo thumbnail */}
        <div
          style={{
            position: "relative",
            width: 48,
            height: 48,
            borderRadius: 8,
            overflow: "hidden",
            flexShrink: 0,
            background: isDark ? "#1C2128" : "#F3F4F6",
          }}
        >
          <InfoPhoto photoRef={place.photoRef} />
        </div>

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
          {/* Name + Saved badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: 15,
                color: isDark ? "#FFFFFF" : "#0E1116",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {place.name}
            </p>
            {isSaved && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#E85D2A", background: "rgba(232,93,42,0.15)", padding: "1px 6px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
                Saved
              </span>
            )}
          </div>

          {/* Rating */}
          {place.rating > 0 && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#E85D2A", fontWeight: 600 }}>
              &#x2605; {place.rating.toFixed(1)}
              {place.price && <span style={{ color: muted, fontWeight: 400, marginLeft: 6 }}>{place.price}</span>}
            </p>
          )}

          {/* Distance */}
          {displayDistance && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: muted }}>
              {displayDistance}
            </p>
          )}
        </div>
      </div>

      {/* View Details + Reserve */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: isReservable(place.type) ? "space-between" : "flex-end", marginTop: 10 }}>
        <button
          onClick={onViewDetails}
          style={{
            background: "none",
            border: "none",
            color: linkRest,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            padding: 0,
            transition: "color 200ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#E85D2A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = linkRest; }}
        >
          View Details &rarr;
        </button>
        {isReservable(place.type) && (
          <a
            href={getBookingUrl(place.name, place.address || "", place.placeId).url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const { platform } = getBookingUrl(place.name, place.address || "", place.placeId);
              fetch("/api/bookings/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ googlePlaceId: place.placeId, platform, source: "map_popup" }),
              }).catch(() => {});
            }}
            style={{
              color: linkRest,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "color 200ms",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#E85D2A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = linkRest; }}
          >
            Reserve &rarr;
          </a>
        )}
      </div>
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
  isDarkMode,
  userLocation,
  onSelectPlace,
}: {
  savedPlaces: SavedPlace[];
  nearbyPlaces: Place[];
  visitedIds: Set<string>;
  isDarkMode: boolean;
  userLocation?: { lat: number; lng: number };
  onSelectPlace: (place: Place) => void;
}) {
  const [selected, setSelected] = useState<{
    place: Place | SavedPlace;
    isSaved: boolean;
  } | null>(null);

  const savedIds = new Set(savedPlaces.map((p) => p.placeId));

  return (
    <>
      {/* Grey markers — nearby unvisited places, rendered first */}
      {nearbyPlaces
        .filter((p) => !savedIds.has(p.placeId) && !visitedIds.has(p.placeId))
        .map((place) => (
          <Marker
            key={`nearby-${place.placeId}`}
            position={place.location}
            icon={isDarkMode ? NEARBY_CRACKED_PIN_DARK : NEARBY_CRACKED_PIN_LIGHT}
            zIndex={9998}
            onClick={() => setSelected({ place, isSaved: false })}
          />
        ))}

      {/* Orange markers — visited places, prominent */}
      {nearbyPlaces
        .filter((p) => visitedIds.has(p.placeId) && !savedIds.has(p.placeId))
        .map((place) => (
          <Marker
            key={`visited-${place.placeId}`}
            position={place.location}
            icon={VISITED_CRACKED_PIN}
            zIndex={10000}
            onClick={() => setSelected({ place, isSaved: false })}
          />
        ))}

      {/* Blue markers — saved places */}
      {savedPlaces.map((place) => (
        <Marker
          key={`saved-${place.placeId}`}
          position={place.location}
          icon={SAVED_CRACKED_PIN}
          zIndex={9999}
          onClick={() => setSelected({ place, isSaved: true })}
        />
      ))}

      {/* Info popup */}
      {selected && (
        <InfoWindow
          position={selected.place.location}
          onCloseClick={() => setSelected(null)}
          headerDisabled
          pixelOffset={[0, -8]}
          maxWidth={300}
        >
          <InfoCard
            place={selected.place}
            isSaved={selected.isSaved}
            isDark={isDarkMode}
            userLocation={userLocation}
            onClose={() => setSelected(null)}
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
  const router = useRouter();

  const [intent, setIntent] = useState("trending");

  const [celebrationPlace, setCelebrationPlace] = useState<{ placeId: string; name: string } | null>(null);
  const [photoPromptPlace, setPhotoPromptPlace] = useState<{ placeId: string; name: string } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
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

  if (status === "loading" || status === "unauthenticated") {
    if (status === "unauthenticated") router.replace("/auth");
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  return (
    <div className="h-dvh bg-white dark:bg-[#0E1116] flex flex-col overflow-hidden pb-28 lg:pb-0">
      <TabTooltip
        storageKey="hasSeenMapTooltips"
        steps={[
          { title: "Explore Your City", description: "Visit places to uncover the map and unlock new neighborhoods.", animationKey: "map-explore" },
          { title: "Filter What You See", description: "Use vibe chips to show only the spots that match your mood.", animationKey: "map-filter" },
        ]}
      />
      {/* Intent chips */}
      <div className="shrink-0 px-5 lg:pl-[88px] xl:pl-[256px] py-3 border-b border-gray-100 dark:border-[#30363D] transition-all duration-200">
        <div
          className="flex justify-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setIntent(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap ${intent === cat.id
                ? "bg-[#E85D2A] text-white shadow-sm"
                : "bg-gray-100 dark:bg-white/10 text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-200 dark:hover:bg-white/15"
                }`}
            >
              <cat.icon size={14} className="mr-1 inline-block" />{cat.label}
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
                  isDarkMode={isDarkMode}
                  userLocation={userLocation ?? undefined}
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
              enabled={status === "authenticated"}
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
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-md border border-gray-100 dark:border-[#30363D]">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#E85D2A] shadow-sm shrink-0" />
              <span className="text-[11px] font-semibold text-[#0E1116] dark:text-[#e8edf4]">Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#3B82F6] shadow-sm shrink-0" />
              <span className="text-[11px] font-semibold text-[#0E1116] dark:text-[#e8edf4]">Saved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#8B949E] shadow-sm shrink-0" />
              <span className="text-[11px] font-semibold text-[#0E1116] dark:text-[#e8edf4]">Nearby</span>
            </div>
          </div>
        )}


        {/* Exploration panel */}
        {userLocation && status === "authenticated" && <ExplorationPanel mapInstance={mapInstance} />}
      </div>

      {/* Bottom gradient fade on mobile — blends map into nav area */}
      <div className="fixed bottom-0 left-0 right-0 h-32 lg:hidden pointer-events-none z-10 bg-gradient-to-t from-[#0E1116] via-[#0E1116]/60 to-transparent" />

      {/* Place detail modal (desktop) / bottom sheet (mobile) */}
      <AnimatePresence>
        {detailPlace && (
          <MapPlaceDetail
            place={detailPlace}
            intent={intent}
            savedPlaceIds={new Set(savedPlaces.map(p => p.placeId))}
            userLocation={userLocation}
            onClose={() => setDetailPlace(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {celebrationPlace && (
          <VisitCelebration
            placeName={celebrationPlace.name}
            onClose={() => setCelebrationPlace(null)}
            onSharePhotos={() => setPhotoPromptPlace(celebrationPlace)}
          />
        )}
      </AnimatePresence>

      {/* Photo Upload Prompt */}
      <PhotoUploadPrompt
        placeId={photoPromptPlace?.placeId ?? ""}
        placeName={photoPromptPlace?.name ?? ""}
        isOpen={!!photoPromptPlace}
        onClose={() => setPhotoPromptPlace(null)}
      />
    </div>
  );
}
