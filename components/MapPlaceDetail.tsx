"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Camera, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Place, FriendSignal } from "@/lib/types";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useSavePlace } from "@/lib/use-save-place";
import { useSession } from "next-auth/react";
import { haversineMeters } from "@/lib/haversine";
import CommunityVibes from "./CommunityVibes";

// --- Photo component for individual photo refs ---
function DetailPhoto({ photoRef, alt }: { photoRef: string; alt: string }) {
  const url = usePhotoUrl(photoRef);
  const [loaded, setLoaded] = useState(false);
  if (!url) return <div className="w-full h-full bg-gray-200 dark:bg-[#1C2128] animate-pulse" />;
  return (
    <Image
      src={url}
      alt={alt}
      fill
      className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      onLoad={() => setLoaded(true)}
      unoptimized
    />
  );
}

// Format distance in km
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- Content shared between modal and sheet ---
function DetailContent({
  place,
  isSaved,
  onSave,
  onUnsave,
  onClose,
  intent,
  userLocation,
  onDetailsToggle,
}: {
  place: Place;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
  onClose: () => void;
  intent: string;
  userLocation: { lat: number; lng: number } | null;
  onDetailsToggle?: (open: boolean) => void;
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const photoUrl = usePhotoUrl(place.photoRef);

  const todayHours = useMemo(() => {
    const today = DAY_NAMES[new Date().getDay()];
    return place.hours.find((h) => h.startsWith(today)) ?? null;
  }, [place.hours]);

  const computedDistance = useMemo(() => {
    if (!userLocation) return null;
    const meters = haversineMeters(
      userLocation.lat, userLocation.lng,
      place.location.lat, place.location.lng
    );
    return formatDistance(meters);
  }, [userLocation, place.location]);

  const photos = place.photoRefs && place.photoRefs.length > 0 ? place.photoRefs : null;

  const toggleDetails = useCallback(() => {
    setDetailsOpen((prev) => {
      const next = !prev;
      onDetailsToggle?.(next);
      return next;
    });
  }, [onDetailsToggle]);

  return (
    <>
      {/* Photo section */}
      <div className="relative h-48 w-full shrink-0 bg-gray-200 dark:bg-[#1C2128]">
        {photos ? (
          <div
            ref={carouselRef}
            className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
            onScroll={(e) => {
              const scrollLeft = e.currentTarget.scrollLeft;
              const width = e.currentTarget.clientWidth;
              setActivePhotoIndex(Math.round(scrollLeft / width));
            }}
          >
            {photos.map((ref, idx) => (
              <div key={idx} className="w-full shrink-0 snap-center h-full relative bg-gray-200 dark:bg-[#1C2128]">
                <DetailPhoto photoRef={ref} alt={`${place.name} photo ${idx + 1}`} />
              </div>
            ))}
          </div>
        ) : photoUrl ? (
          <Image src={photoUrl} alt={place.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-[#1C2128] dark:to-[#2d333f]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#161B22] pointer-events-none" />

        {/* Carousel dots */}
        {photos && photos.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activePhotoIndex
                    ? "w-4 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                    : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 pb-6">
        {/* Name + basics */}
        <h2 className="text-xl font-bold text-[#0E1116] dark:text-white">{place.name}</h2>
        <div className="flex items-center gap-2 mt-1.5 text-sm">
          {place.rating > 0 && (
            <>
              <span className="text-[#E85D2A] font-semibold">&#9733; {place.rating.toFixed(1)}</span>
              <span className="w-1 h-1 rounded-full bg-[#D0D7DE] dark:bg-[#30363D]" />
            </>
          )}
          {place.price && (
            <>
              <span className="text-[#656D76] dark:text-[#8B949E]">{place.price}</span>
              <span className="w-1 h-1 rounded-full bg-[#D0D7DE] dark:bg-[#30363D]" />
            </>
          )}
          <span className="text-[#656D76] dark:text-[#8B949E] capitalize">{place.type}</span>
        </div>
        {place.address && (
          <p className="text-[#656D76] dark:text-[#8B949E] text-sm mt-1">{place.address}</p>
        )}

        {/* Tags */}
        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {place.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#F6F8FA] dark:bg-white/10 text-[#0E1116] dark:text-[#C9D1D9] border border-[#D0D7DE] dark:border-transparent text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Hours */}
          <div className="bg-[#F6F8FA] dark:bg-[#1C2128] rounded-lg p-3 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <div>
              <p className="text-xs text-[#656D76] dark:text-[#8B949E] font-normal">Hours</p>
              <p className="text-sm font-medium text-[#0E1116] dark:text-white">{place.openNow ? "Open" : "Closed"}</p>
            </div>
          </div>
          {/* Distance */}
          <div className="bg-[#F6F8FA] dark:bg-[#1C2128] rounded-lg p-3 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            <div>
              <p className="text-xs text-[#656D76] dark:text-[#8B949E] font-normal">Distance</p>
              <p className="text-sm font-medium text-[#0E1116] dark:text-white">{computedDistance ?? "—"}</p>
            </div>
          </div>
          {/* Price */}
          <div className="bg-[#F6F8FA] dark:bg-[#1C2128] rounded-lg p-3 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            <div>
              <p className="text-xs text-[#656D76] dark:text-[#8B949E] font-normal">Price</p>
              <p className="text-sm font-medium text-[#0E1116] dark:text-white">{place.price || "—"}</p>
            </div>
          </div>
          {/* Type */}
          <div className="bg-[#F6F8FA] dark:bg-[#1C2128] rounded-lg p-3 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
            <div>
              <p className="text-xs text-[#656D76] dark:text-[#8B949E] font-normal">Type</p>
              <p className="text-sm font-medium text-[#0E1116] dark:text-white capitalize">{place.type}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 w-full mt-4">
          <button
            onClick={isSaved ? onUnsave : onSave}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm cursor-pointer ${
              isSaved
                ? "border border-[#D0D7DE] dark:border-[#30363D] bg-transparent text-[#E85D2A]"
                : "border border-[#D0D7DE] dark:border-[#30363D] text-[#0E1116] dark:text-white hover:border-[#E85D2A] hover:text-[#E85D2A] transition-colors duration-200"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
            onClick={() => {
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&destination_place_id=${place.placeId}`,
                "_blank"
              );
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#E85D2A] text-white hover:bg-[#D14E1F] transition-colors duration-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
            Go Now
          </button>
          <button
            className="w-12 h-12 flex items-center justify-center rounded-xl border border-[#D0D7DE] dark:border-[#30363D] text-[#656D76] dark:text-[#8B949E] hover:text-[#E85D2A] hover:border-[#E85D2A] transition-colors duration-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
          </button>
        </div>

        {/* See Full Details toggle */}
        <button
          onClick={toggleDetails}
          className="w-full flex items-center justify-center gap-2 py-3 mt-3 text-[#656D76] dark:text-[#8B949E] text-sm font-medium cursor-pointer hover:text-[#0E1116] dark:hover:text-white transition-colors duration-200"
        >
          {detailsOpen ? (
            <>
              Show Less
              <ChevronUp size={16} />
            </>
          ) : (
            <>
              See Full Details
              <ChevronDown size={16} />
            </>
          )}
        </button>

        {/* Expandable full details */}
        <AnimatePresence>
          {detailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Community Vibes */}
              <CommunityVibes placeId={place.placeId} limit={3} />

              {/* Friend signals */}
              {place.friendSaves && place.friendSaves.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold tracking-wider text-[#656D76] dark:text-[#8B949E] uppercase mb-3">Friends Love This</h3>
                  <div className="space-y-2">
                    {place.friendSaves.map((f: FriendSignal) => (
                      <div key={f.userId} className="flex items-center gap-3 p-3 bg-[#F6F8FA] dark:bg-[#1C2128] rounded-xl">
                        {f.image ? (
                          <Image
                            src={f.image}
                            alt={f.name ?? ""}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full border-2 border-white dark:border-[#161B22] object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#E85D2A] text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-[#161B22]">
                            {f.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium text-[#0E1116] dark:text-white">{f.name ?? "A friend"}</span>
                        <span className="ml-auto text-xs text-[#656D76] dark:text-[#8B949E]">saved this</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="mt-4">
                <h3 className="text-xs font-semibold tracking-wider text-[#656D76] dark:text-[#8B949E] uppercase mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F8FA] dark:bg-[#1C2128]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3a1 1 0 0 0 1 1h3" /><path d="M8 14h0" /><path d="m6 6 1.5 1.5" /><path d="M2 2v2" /></svg>
                    <div>
                      <p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">Noise Level</p>
                      <p className="text-sm font-medium text-[#0E1116] dark:text-white">Quiet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F8FA] dark:bg-[#1C2128]">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 ml-0.5" />
                    <div>
                      <p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">Busyness</p>
                      <p className="text-sm font-medium text-[#0E1116] dark:text-white">Not Busy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F8FA] dark:bg-[#1C2128]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8Z" /></svg>
                    <div>
                      <p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">Outlets</p>
                      <p className="text-sm font-medium text-[#0E1116] dark:text-white">Plenty</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F8FA] dark:bg-[#1C2128]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0Z" /><path d="M5 18v2" /><path d="M19 18v2" /></svg>
                    <div>
                      <p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">Seating</p>
                      <p className="text-sm font-medium text-[#0E1116] dark:text-white">Long Stay</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours row */}
              <div className="mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-[#F6F8FA] dark:bg-[#1C2128]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <div>
                  <p className="text-sm font-medium text-[#0E1116] dark:text-white">
                    {place.openNow ? "Open Now" : "Closed"}
                  </p>
                  <p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">
                    {todayHours ?? "Hours unavailable"}
                  </p>
                </div>
              </div>

              {/* View Menu row — conditional */}
              {place.menuUrl && (
                <a
                  href={place.menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-3 p-3.5 rounded-xl bg-[#F6F8FA] dark:bg-[#1C2128] hover:bg-gray-100 dark:hover:bg-[#252D38] transition-colors duration-200 cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                  </svg>
                  <span className="flex-1 text-sm font-medium text-[#0E1116] dark:text-white">
                    {place.menuType === "direct" ? "View Menu" : "Search Menu"}
                  </span>
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" />
                    </svg>
                    <ChevronRight size={16} className="text-[#656D76] dark:text-[#8B949E]" />
                  </div>
                </a>
              )}

              {/* Community Photos — always show */}
              <Link
                href={`/places/${place.placeId}/photos`}
                className="mt-2 flex items-center gap-3 p-3.5 rounded-xl bg-[#F6F8FA] dark:bg-[#1C2128] hover:bg-gray-100 dark:hover:bg-[#252D38] transition-colors duration-200"
              >
                <Camera size={18} className="text-[#E85D2A] shrink-0" />
                <span className="flex-1 text-sm font-medium text-[#0E1116] dark:text-white">
                  Community Photos
                  {place.communityPhotoCount != null && place.communityPhotoCount > 0 ? (
                    <span className="text-[#656D76] dark:text-[#8B949E] font-normal"> ({place.communityPhotoCount})</span>
                  ) : (
                    <span className="text-[#656D76] dark:text-[#8B949E] font-normal text-xs"> — Be the first!</span>
                  )}
                </span>
                <ChevronRight size={16} className="text-[#656D76] dark:text-[#8B949E] shrink-0" />
              </Link>

              {/* Bottom spacing: pb-6 desktop, pb-24 mobile */}
              <div className="pb-24 lg:pb-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// --- Main exported component ---
export default function MapPlaceDetail({
  place,
  intent,
  savedPlaceIds,
  userLocation,
  onClose,
  onUnsave,
}: {
  place: Place;
  intent: string;
  savedPlaceIds: Set<string>;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onUnsave?: (placeId: string) => void;
}) {
  const { handleSave, handleUnsave } = useSavePlace();
  const { status } = useSession();
  const [localSaved, setLocalSaved] = useState(savedPlaceIds.has(place.placeId));
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Sync if savedPlaceIds changes
  useEffect(() => {
    setLocalSaved(savedPlaceIds.has(place.placeId));
  }, [savedPlaceIds, place.placeId]);

  // Escape key closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const doSave = useCallback(async () => {
    setLocalSaved(true);
    await handleSave(place, intent, "save");
  }, [handleSave, place, intent]);

  const doUnsave = useCallback(async () => {
    setLocalSaved(false);
    await handleUnsave(place.placeId);
    onUnsave?.(place.placeId);
  }, [handleUnsave, place.placeId, onUnsave]);

  return (
    <>
      {/* Desktop: centered modal */}
      <div className="hidden lg:block">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <motion.div
            className="bg-white dark:bg-[#161B22] rounded-2xl border border-[#D0D7DE] dark:border-[#30363D] max-w-[540px] w-[95%] max-h-[85vh] overflow-y-auto scrollbar-none pointer-events-auto relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <div className="overflow-hidden rounded-2xl">
              <DetailContent
                place={place}
                isSaved={localSaved}
                onSave={doSave}
                onUnsave={doUnsave}
                onClose={onClose}
                intent={intent}
                userLocation={userLocation}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="lg:hidden">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/40 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
        {/* Sheet */}
        <motion.div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#161B22] rounded-t-2xl border-t border-[#D0D7DE] dark:border-[#30363D] overflow-y-auto scrollbar-none transition-[max-height] duration-300 ease-out ${detailsExpanded ? "max-h-[90vh]" : "max-h-[55vh]"}`}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10 bg-white dark:bg-[#161B22] rounded-t-2xl">
            <div className="w-10 h-1 rounded-full bg-[#D0D7DE] dark:bg-[#30363D]" />
          </div>

          <DetailContent
            place={place}
            isSaved={localSaved}
            onSave={doSave}
            onUnsave={doUnsave}
            onClose={onClose}
            intent={intent}
            userLocation={userLocation}
            onDetailsToggle={setDetailsExpanded}
          />
        </motion.div>
      </div>
    </>
  );
}
