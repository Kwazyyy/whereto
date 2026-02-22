"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getSavedPlaces, SavedPlace } from "@/lib/saved-places";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { Place } from "@/lib/types";
import PlaceDetailSheet from "@/components/PlaceDetailSheet";
import { useSavePlace } from "@/lib/use-save-place";

const INTENT_LABELS: Record<string, string> = {
    study: "Study / Work",
    date: "Date / Chill",
    trending: "Trending Now",
    quiet: "Quiet Cafes",
    laptop: "Laptop-Friendly",
    group: "Group Hangouts",
    budget: "Budget Eats",
    coffee: "Coffee & Catch-Up",
    outdoor: "Outdoor / Patio",
};

function ChevronLeftIcon({ size = 24 }: { size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
    );
}

function GridIcon({ size = 24 }: { size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    );
}

function StarIcon({ size = 16, className = "" }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

function PlaceListItem({ place, onTap }: { place: SavedPlace; onTap: () => void }) {
    const photoUrl = usePhotoUrl(place.photoRef);

    return (
        <div onClick={onTap} className="flex bg-white dark:bg-[#1a1a2e] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm mb-4 cursor-pointer active:scale-[0.98] transition-transform">
            <div className="h-28 w-28 relative flex-shrink-0 bg-gray-100 dark:bg-[#22223b]">
                {photoUrl ? (
                    <Image
                        src={photoUrl}
                        alt={place.name}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <GridIcon size={24} />
                    </div>
                )}
            </div>
            <div className="p-3 flex flex-col justify-center flex-1">
                <h3 className="font-bold text-[#1B2A4A] dark:text-[#e8edf4] text-base leading-tight line-clamp-1">{place.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{place.address}</p>

                <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[#E85D2A]">
                        <StarIcon size={14} />
                        <span className="text-xs font-bold">{place.rating?.toFixed(1) || "New"}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                    <span className="text-xs font-medium text-gray-500">{place.price || "$$"}</span>
                    {place.distance && (
                        <>
                            <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                            <span className="text-xs font-medium text-gray-500">{place.distance}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BoardDetailPage() {
    const { status } = useSession();
    const params = useParams();
    const router = useRouter();
    const intent = typeof params.intent === 'string' ? params.intent : 'uncategorized';

    const [places, setPlaces] = useState<SavedPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailPlace, setDetailPlace] = useState<SavedPlace | null>(null);
    const { handleSave, handleUnsave } = useSavePlace();

    useEffect(() => {
        if (status === "loading") return;

        if (status === "authenticated") {
            fetch("/api/saves")
                .then((r) => r.json())
                .then((data: SavedPlace[]) => {
                    if (Array.isArray(data)) {
                        setPlaces(data.filter(s => (s.intent || "uncategorized") === intent));
                    } else {
                        console.error("Saves data is not an array:", data);
                        setPlaces([]);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            const allSaves = getSavedPlaces();
            setPlaces(allSaves.filter(s => (s.intent || "uncategorized") === intent));
            setLoading(false);
        }
    }, [status, intent]);

    if (loading || status === "loading") {
        return (
            <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] flex flex-col items-center justify-center pb-16">
                <div
                    className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
                    style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
                />
            </div>
        );
    }

    const label = INTENT_LABELS[intent] || intent;

    const FALLBACK_GRADIENTS = [
        "from-amber-800 via-orange-700 to-yellow-600",
        "from-slate-800 via-slate-600 to-cyan-700",
        "from-green-800 via-emerald-700 to-teal-600",
        "from-purple-900 via-violet-700 to-fuchsia-600",
        "from-stone-800 via-stone-600 to-orange-800",
    ];

    const fallbackGradient = detailPlace
        ? FALLBACK_GRADIENTS[places.findIndex(p => p.placeId === detailPlace.placeId) % FALLBACK_GRADIENTS.length]
        : FALLBACK_GRADIENTS[0];

    return (
        <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] pb-24">
            <header className="flex items-center px-5 pt-5 pb-4 sticky top-0 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-white/10">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a2e] transition-colors cursor-pointer">
                    <div className="text-[#1B2A4A] dark:text-[#e8edf4]">
                        <ChevronLeftIcon size={24} />
                    </div>
                </button>
                <h1 className="text-xl font-bold text-[#1B2A4A] dark:text-[#e8edf4] ml-2 flex-1 capitalize">{label}</h1>
            </header>

            <div className="px-5 pt-6">
                {places.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                            <GridIcon size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-[#1B2A4A] dark:text-[#e8edf4] mb-2">No places found</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            You haven&apos;t saved any places to this board yet.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {places.map((place) => (
                            <PlaceListItem
                                key={`${place.placeId}-${place.savedAt}`}
                                place={place}
                                onTap={() => setDetailPlace(place)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {detailPlace && (
                    <PlaceDetailSheet
                        place={detailPlace as Place}
                        fallbackGradient={fallbackGradient}
                        isSaved={true}
                        onClose={() => setDetailPlace(null)}
                        onSave={async (action) => {
                            if (action === "save") {
                                // Already saved — unsave and remove from list
                                await handleUnsave(detailPlace.placeId);
                                setPlaces(prev => prev.filter(p => p.placeId !== detailPlace.placeId));
                                setDetailPlace(null);
                            } else {
                                handleSave(detailPlace as Place, intent, action);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
