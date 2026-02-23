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

const RECS_INTENT = "recs_from_friends";

const INTENT_LABELS: Record<string, string> = {
    [RECS_INTENT]: "Recs from Friends",
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

function StarIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

function RecSenderAvatar({ image, name }: { image?: string | null; name?: string | null }) {
    if (image) {
        return (
            <Image src={image} alt={name ?? ""} width={28} height={28} className="rounded-full shrink-0 object-cover border-2 border-violet-300 dark:border-violet-700" unoptimized />
        );
    }
    return (
        <div className="w-7 h-7 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {name?.[0]?.toUpperCase() ?? "?"}
        </div>
    );
}

function PlaceListItem({ place, onTap, isRecs }: { place: SavedPlace; onTap: () => void; isRecs: boolean }) {
    const photoUrl = usePhotoUrl(place.photoRef);

    return (
        <div onClick={onTap} className="flex bg-white dark:bg-[#161B22] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm mb-4 cursor-pointer active:scale-[0.98] transition-transform">
            <div className="h-auto w-28 relative flex-shrink-0 bg-gray-100 dark:bg-[#1C2128]" style={{ minHeight: 112 }}>
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
            <div className="p-3 flex flex-col justify-center flex-1 min-w-0">
                <h3 className="font-bold text-[#0E1116] dark:text-[#e8edf4] text-base leading-tight line-clamp-1">{place.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{place.address}</p>

                <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-[#E85D2A]">
                        <StarIcon size={13} />
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

                {/* Recommendation metadata */}
                {isRecs && place.recommendedByName && (
                    <div className="flex items-start gap-1.5 mt-2 p-2 rounded-xl bg-violet-50 dark:bg-violet-950/30">
                        <RecSenderAvatar image={place.recommendedByImage} name={place.recommendedByName} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 truncate">
                                From {place.recommendedByName.split(" ")[0]}
                                {place.recommendedAt && (
                                    <span className="font-normal text-violet-500/70 ml-1">
                                        · {new Date(place.recommendedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                    </span>
                                )}
                            </p>
                            {place.recommenderNote && (
                                <p className="text-[11px] text-violet-600/80 dark:text-violet-300/70 line-clamp-2 mt-0.5 italic">
                                    &ldquo;{place.recommenderNote}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BoardDetailPage() {
    const { status } = useSession();
    const params = useParams();
    const router = useRouter();
    const intent = typeof params.intent === "string" ? params.intent : "uncategorized";
    const isRecs = intent === RECS_INTENT;

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
                        setPlaces(data.filter((s) => (s.intent || "uncategorized") === intent));
                    } else {
                        setPlaces([]);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            const allSaves = getSavedPlaces();
            setPlaces(allSaves.filter((s) => (s.intent || "uncategorized") === intent));
            setLoading(false);
        }
    }, [status, intent]);

    if (loading || status === "loading") {
        return (
            <div className="min-h-dvh bg-white dark:bg-[#0E1116] flex flex-col items-center justify-center pb-16">
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
        ? FALLBACK_GRADIENTS[places.findIndex((p) => p.placeId === detailPlace.placeId) % FALLBACK_GRADIENTS.length]
        : FALLBACK_GRADIENTS[3];

    return (
        <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-24">
            {/* Header */}
            <header className={`flex items-center px-5 pt-5 pb-4 sticky top-0 backdrop-blur-md z-10 border-b ${isRecs ? "bg-violet-50/90 dark:bg-violet-950/50 border-violet-200/50 dark:border-violet-900/40" : "bg-white/80 dark:bg-[#0E1116]/80 border-gray-100 dark:border-white/10"}`}>
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer">
                    <div className={isRecs ? "text-violet-700 dark:text-violet-400" : "text-[#0E1116] dark:text-[#e8edf4]"}>
                        <ChevronLeftIcon size={24} />
                    </div>
                </button>
                <div className="flex items-center gap-2 ml-2 flex-1">
                    {isRecs && <span className="text-2xl">🎁</span>}
                    <h1 className={`text-xl font-bold capitalize ${isRecs ? "text-violet-700 dark:text-violet-400" : "text-[#0E1116] dark:text-[#e8edf4]"}`}>
                        {label}
                    </h1>
                </div>
            </header>

            {isRecs && (
                <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200/50 dark:border-violet-800/30">
                    <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                        ✨ Places recommended by your friends — a personal collection of trusted spots.
                    </p>
                </div>
            )}

            <div className="px-5 pt-4">
                {places.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-4xl">
                            {isRecs ? "🎁" : "📍"}
                        </div>
                        <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4] mb-2">
                            {isRecs ? "No recs saved yet" : "No places found"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm">
                            {isRecs
                                ? "When a friend recommends a place and you swipe right, it'll appear here."
                                : "You haven't saved any places to this board yet."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {places.map((place) => (
                            <PlaceListItem
                                key={`${place.placeId}-${place.savedAt}`}
                                place={place}
                                isRecs={isRecs}
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
                                await handleUnsave(detailPlace.placeId);
                                setPlaces((prev) => prev.filter((p) => p.placeId !== detailPlace.placeId));
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
