"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { getSavedPlaces, removePlace, SavedPlace } from "@/lib/saved-places";
import { usePhotoUrl } from "@/lib/use-photo-url";
import PlaceDetailSheet from "@/components/PlaceDetailSheet";

const INTENT_META: Record<string, { emoji: string; label: string }> = {
  study:    { emoji: "\u{1F4DA}", label: "Study / Work" },
  date:     { emoji: "\u{2764}\u{FE0F}", label: "Date / Chill" },
  trending: { emoji: "\u{1F525}", label: "Trending Now" },
  quiet:    { emoji: "\u{1F92B}", label: "Quiet Caf\u00E9s" },
  laptop:   { emoji: "\u{1F50C}", label: "Laptop-Friendly" },
  group:    { emoji: "\u{1F46F}", label: "Group Hangouts" },
  budget:   { emoji: "\u{1F354}", label: "Budget Eats" },
  coffee:   { emoji: "\u{2615}", label: "Coffee & Catch-Up" },
  outdoor:  { emoji: "\u{1F305}", label: "Outdoor / Patio" },
};

const FALLBACK_GRADIENTS = [
  "from-amber-800 via-orange-700 to-yellow-600",
  "from-slate-800 via-slate-600 to-cyan-700",
  "from-green-800 via-emerald-700 to-teal-600",
  "from-purple-900 via-violet-700 to-fuchsia-600",
  "from-stone-800 via-stone-600 to-orange-800",
];

// --- Photo Components ---

function PlacePhoto({ photoRef }: { photoRef: string | null }) {
  const url = usePhotoUrl(photoRef);
  if (!url) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <span className="text-gray-400 text-2xl">&#x1F37D;&#xFE0F;</span>
      </div>
    );
  }
  return <Image src={url} alt="" fill className="object-cover" unoptimized />;
}

// --- Board Card (grid view) ---

function BoardCard({
  title,
  emoji,
  count,
  photoRef,
  onClick,
}: {
  title: string;
  emoji: string;
  count: number;
  photoRef: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100 cursor-pointer group"
    >
      <div className="absolute inset-0">
        <PlacePhoto photoRef={photoRef} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <p className="text-white font-bold text-sm leading-tight">
          {emoji} {title}
        </p>
        <p className="text-white/70 text-xs mt-0.5">
          {count} {count === 1 ? "place" : "places"}
        </p>
      </div>
    </button>
  );
}

// --- Place Row (list view inside a board) ---

function PlaceRow({
  place,
  onTap,
  onRemove,
}: {
  place: SavedPlace;
  onTap: () => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <button
        onClick={onTap}
        className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-gray-200">
          <PlacePhoto photoRef={place.photoRef} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate" style={{ color: "#1B2A4A" }}>
            {place.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 font-medium">
            <span>{place.distance}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{place.price}</span>
            {place.rating > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>&#9733; {place.rating.toFixed(1)}</span>
              </>
            )}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {place.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>

      {/* Remove button with confirmation */}
      <div className="shrink-0">
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onRemove(); setConfirming(false); }}
              className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold cursor-pointer hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold cursor-pointer hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors cursor-pointer"
            title="Remove"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main Boards Page ---

export default function BoardsPage() {
  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [detailPlace, setDetailPlace] = useState<SavedPlace | null>(null);

  const refresh = useCallback(() => setSaved(getSavedPlaces()), []);

  useEffect(() => { refresh(); }, [refresh]);

  // Group by intent
  const boards = saved.reduce<Record<string, SavedPlace[]>>((acc, place) => {
    const key = place.intent;
    if (!acc[key]) acc[key] = [];
    acc[key].push(place);
    return acc;
  }, {});

  const boardKeys = Object.keys(boards).sort((a, b) => {
    const order = Object.keys(INTENT_META);
    return order.indexOf(a) - order.indexOf(b);
  });

  function handleRemove(placeId: string) {
    removePlace(placeId);
    refresh();
  }

  // Board detail view
  if (activeBoard !== null) {
    const places = activeBoard === "all" ? saved : (boards[activeBoard] ?? []);
    const meta = activeBoard === "all"
      ? { emoji: "\u{2B50}", label: "All Saved" }
      : (INTENT_META[activeBoard] ?? { emoji: "\u{1F4CD}", label: activeBoard });

    return (
      <div className="min-h-dvh bg-white flex flex-col pb-20">
        {/* Header */}
        <header className="shrink-0 px-5 pt-5 pb-3 flex items-center gap-3">
          <button
            onClick={() => setActiveBoard(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1B2A4A" }}>
              {meta.emoji} {meta.label}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              {places.length} {places.length === 1 ? "place" : "places"}
            </p>
          </div>
        </header>

        {/* Place List */}
        <div className="flex-1 px-5">
          {places.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-gray-400 text-sm">No saved places here yet.</p>
            </div>
          ) : (
            places.map((place) => (
              <PlaceRow
                key={place.placeId}
                place={place}
                onTap={() => setDetailPlace(place)}
                onRemove={() => handleRemove(place.placeId)}
              />
            ))
          )}
        </div>

        {/* Place Detail Bottom Sheet */}
        <AnimatePresence>
          {detailPlace && (
            <PlaceDetailSheet
              place={detailPlace}
              fallbackGradient={FALLBACK_GRADIENTS[
                saved.indexOf(detailPlace) % FALLBACK_GRADIENTS.length
              ]}
              onClose={() => setDetailPlace(null)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Boards grid view
  return (
    <div className="min-h-dvh bg-white pb-20">
      <header className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
          Boards
        </h1>
      </header>

      {saved.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 pt-32 text-center gap-4">
          <div className="text-5xl">&#x1F516;</div>
          <h2 className="text-xl font-bold" style={{ color: "#1B2A4A" }}>
            No saved places yet
          </h2>
          <p className="text-gray-400 text-sm">
            Swipe right on places you love to save them here.
          </p>
        </div>
      ) : (
        <div className="px-5">
          <div className="grid grid-cols-2 gap-3">
            {/* All Saved board */}
            <BoardCard
              title="All Saved"
              emoji="&#x2B50;"
              count={saved.length}
              photoRef={saved[0]?.photoRef ?? null}
              onClick={() => setActiveBoard("all")}
            />

            {/* Intent boards */}
            {boardKeys.map((key) => {
              const meta = INTENT_META[key] ?? { emoji: "\u{1F4CD}", label: key };
              const bPlaces = boards[key];
              return (
                <BoardCard
                  key={key}
                  title={meta.label}
                  emoji={meta.emoji}
                  count={bPlaces.length}
                  photoRef={bPlaces[0]?.photoRef ?? null}
                  onClick={() => setActiveBoard(key)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
