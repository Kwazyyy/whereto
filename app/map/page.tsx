"use client";

import { useState, useEffect, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Place } from "@/lib/types";
import { SavedPlace, getSavedPlaces } from "@/lib/saved-places";
import PlaceDetailSheet from "@/components/PlaceDetailSheet";
import { useSavePlace } from "@/lib/use-save-place";
import { usePhotoUrl } from "@/lib/use-photo-url";

const DEFAULT_LAT = 43.6532;
const DEFAULT_LNG = -79.3832;

const FALLBACK_GRADIENTS = [
  "from-amber-800 via-orange-700 to-yellow-600",
  "from-slate-800 via-slate-600 to-cyan-700",
  "from-green-800 via-emerald-700 to-teal-600",
  "from-purple-900 via-violet-700 to-fuchsia-600",
  "from-stone-800 via-stone-600 to-orange-800",
];

const categories = [
  { id: "study",   emoji: "\u{1F4DA}", label: "Study / Work" },
  { id: "date",    emoji: "\u2764\uFE0F", label: "Date / Chill" },
  { id: "trending",emoji: "\u{1F525}", label: "Trending Now" },
  { id: "quiet",   emoji: "\u{1F92B}", label: "Quiet Caf\u00E9s" },
  { id: "laptop",  emoji: "\u{1F50C}", label: "Laptop-Friendly" },
  { id: "group",   emoji: "\u{1F46F}", label: "Group Hangouts" },
  { id: "budget",  emoji: "\u{1F354}", label: "Budget Eats" },
  { id: "coffee",  emoji: "\u2615", label: "Coffee & Catch-Up" },
  { id: "outdoor", emoji: "\u{1F305}", label: "Outdoor / Patio" },
];

// --- Dot marker (custom coloured circle, no mapId required) ---
function MarkerDot({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        backgroundColor: color,
        border: "2.5px solid white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
      }}
    />
  );
}

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
    <div style={{ width: "100%", height: "100%", background: "#e5e7eb", borderRadius: 8 }} />
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
          background: "#f3f4f6",
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
          color: "#1B2A4A",
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
        background: "white",
        border: "1px solid #e5e7eb",
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
        stroke="#1B2A4A"
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

// --- Markers + InfoWindow — rendered inside <Map> so they have map context ---
function MapMarkers({
  savedPlaces,
  nearbyPlaces,
  onSelectPlace,
}: {
  savedPlaces: SavedPlace[];
  nearbyPlaces: Place[];
  onSelectPlace: (place: Place) => void;
}) {
  const [selected, setSelected] = useState<{
    place: Place | SavedPlace;
    isSaved: boolean;
  } | null>(null);

  const savedIds = new Set(savedPlaces.map((p) => p.placeId));

  return (
    <>
      {/* Orange markers — saved places */}
      {savedPlaces.map((place) => (
        <AdvancedMarker
          key={`saved-${place.placeId}`}
          position={place.location}
          onClick={() => setSelected({ place, isSaved: true })}
        >
          <MarkerDot color="#E85D2A" />
        </AdvancedMarker>
      ))}

      {/* Blue markers — nearby places (skip if already saved) */}
      {nearbyPlaces
        .filter((p) => !savedIds.has(p.placeId))
        .map((place) => (
          <AdvancedMarker
            key={`nearby-${place.placeId}`}
            position={place.location}
            onClick={() => setSelected({ place, isSaved: false })}
          >
            <MarkerDot color="#3B82F6" />
          </AdvancedMarker>
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

  // Fetch nearby places when intent or location changes
  const fetchNearby = useCallback(async () => {
    if (!userLocation) return;
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

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden pb-16">
      {/* Intent chips */}
      <div
        className="shrink-0 px-5 py-3 border-b border-gray-100"
      >
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setIntent(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                intent === cat.id
                  ? "bg-[#E85D2A] text-white shadow-sm"
                  : "bg-gray-100 text-[#1B2A4A] hover:bg-gray-200"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {!userLocation ? (
          /* Location loading spinner */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
              style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
            />
            <p className="text-sm text-gray-400 font-medium">
              Getting your location...
            </p>
          </div>
        ) : (
          <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <Map
              defaultCenter={userLocation}
              defaultZoom={14}
              gestureHandling="greedy"
              disableDefaultUI
              mapId="DEMO_MAP_ID"
              style={{ width: "100%", height: "100%" }}
            >
              <MapMarkers
                savedPlaces={savedPlaces}
                nearbyPlaces={nearbyPlaces}
                onSelectPlace={setDetailPlace}
              />
              <RecenterButton userLocation={userLocation} />
            </Map>
          </APIProvider>
        )}

        {/* Legend */}
        {userLocation && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-md border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E85D2A] border-2 border-white shadow-sm" />
              <span className="text-[11px] font-semibold text-[#1B2A4A]">Saved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3B82F6] border-2 border-white shadow-sm" />
              <span className="text-[11px] font-semibold text-[#1B2A4A]">Nearby</span>
            </div>
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
