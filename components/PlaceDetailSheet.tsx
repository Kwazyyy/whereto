"use client";

import { useMemo } from "react";
import { motion, PanInfo } from "framer-motion";
import Image from "next/image";
import { Place, FriendSignal } from "@/lib/types";
import { usePhotoUrl } from "@/lib/use-photo-url";

export default function PlaceDetailSheet({
  place,
  fallbackGradient,
  onClose,
  onSave,
  onSaveUnauthenticated,
  isSaved = false,
}: {
  place: Place;
  fallbackGradient: string;
  onClose: () => void;
  onSave?: (action: "save" | "go_now") => void;
  onSaveUnauthenticated?: () => void;
  isSaved?: boolean;
}) {
  const matchScore = useMemo(() => Math.floor(Math.random() * 19) + 80, []);
  const photoUrl = usePhotoUrl(place.photoRef);

  const todayHours = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    return place.hours.find((h) => h.startsWith(today)) ?? null;
  }, [place.hours]);

  function handleSaveClick(action: "save" | "go_now") {
    if (onSaveUnauthenticated) {
      onSaveUnauthenticated();
    } else {
      onSave?.(action);
    }
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-[55]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-x-0 bottom-0 z-[60] bg-white dark:bg-[#1a1a2e] rounded-t-3xl overflow-hidden flex flex-col"
        style={{ height: "85dvh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 20, stiffness: 350 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
          if (info.offset.y > 100 || info.velocity.y > 500) onClose();
        }}
      >
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Photo */}
          <div className={`h-48 relative ${!photoUrl ? `bg-gradient-to-br ${fallbackGradient}` : "bg-gray-200 dark:bg-[#22223b]"}`}>
            {photoUrl && (
              <Image
                src={photoUrl}
                alt={place.name}
                fill
                className="object-cover"
                unoptimized
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#1a1a2e] via-transparent to-transparent" />
          </div>

          <div className="px-5 -mt-6 relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-[#e8edf4]">
                  {place.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <span className="capitalize">{place.type}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>{place.distance}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>{place.price}</span>
                </div>
                {place.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-yellow-500">&#9733;</span>
                    <span className="font-medium">{place.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <span className="shrink-0 mt-1 px-3 py-1.5 rounded-full bg-[#E85D2A] text-white text-sm font-bold">
                {matchScore}% Match
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {place.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[#2D2D2D] dark:text-[#e8edf4] text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>

            {place.address && (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{place.address}</p>
            )}

            {/* Friends who saved this */}
            {place.friendSaves && place.friendSaves.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  Friends Love This
                </h3>
                <div className="flex flex-col gap-2.5">
                  {place.friendSaves.map((f: FriendSignal) => (
                    <div key={f.userId} className="flex items-center gap-3">
                      {f.image ? (
                        <Image
                          src={f.image}
                          alt={f.name ?? ""}
                          width={32}
                          height={32}
                          className="rounded-full shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {f.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className="text-sm font-medium text-[#2D2D2D] dark:text-[#e8edf4]">
                        {f.name ?? "A friend"}
                      </span>
                      <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">saved this</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3a1 1 0 0 0 1 1h3" /><path d="M8 14h0" /><path d="m6 6 1.5 1.5" /><path d="M2 2v2" /></svg>
                  <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Noise Level</p><p className="text-sm font-semibold text-[#2D2D2D] dark:text-[#e8edf4]">Quiet</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 ml-0.5" />
                  <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Busyness</p><p className="text-sm font-semibold text-[#2D2D2D] dark:text-[#e8edf4]">Not Busy</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8Z" /></svg>
                  <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Outlets</p><p className="text-sm font-semibold text-[#2D2D2D] dark:text-[#e8edf4]">Plenty</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0Z" /><path d="M5 18v2" /><path d="M19 18v2" /></svg>
                  <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Seating</p><p className="text-sm font-semibold text-[#2D2D2D] dark:text-[#e8edf4]">Long Stay</p></div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="mt-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-gray-50 dark:bg-[#22223b]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <div>
                <p className="text-sm font-semibold text-[#2D2D2D] dark:text-[#e8edf4]">
                  {place.openNow ? "Open Now" : "Closed"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {todayHours ?? "Hours unavailable"}
                </p>
              </div>
            </div>

            {/* Action Buttons — inside scroll so they don't overlap the nav bar */}
            <div className="flex gap-3 mt-8 pb-10">
              <button
                onClick={() => handleSaveClick("save")}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-colors cursor-pointer ${
                  isSaved
                    ? "border-[#E85D2A] text-[#E85D2A] bg-orange-50 dark:bg-[#E85D2A]/10"
                    : "border-gray-200 dark:border-white/15 text-[#2D2D2D] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
                  if (onSaveUnauthenticated) {
                    onSaveUnauthenticated();
                  } else {
                    onSave?.("go_now");
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&destination_place_id=${place.placeId}`,
                      "_blank"
                    );
                  }
                }}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#E85D2A] text-white font-bold text-sm shadow-lg shadow-[#E85D2A]/30 hover:bg-[#d04e1f] active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                Go Now
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/15 text-[#2D2D2D] dark:text-[#e8edf4] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
