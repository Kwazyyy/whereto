"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getSavedPlaces, SavedPlace } from "@/lib/saved-places";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { Place } from "@/lib/types";
import MapPlaceDetail from "@/components/MapPlaceDetail";
import { ShareModal } from "@/components/ShareModal";
import { useSavePlace } from "@/lib/use-save-place";
import { useVibeVoting } from "@/components/providers/VibeVotingProvider";
import { useToast } from "@/components/Toast";
import { ChevronLeft, MapPin, Star, X, Bookmark, CalendarCheck } from "lucide-react";
import { getBookingUrl, isReservable } from "@/lib/booking";
import { normalizeIntent, intentLabel } from "@/lib/intents";

const RECS_INTENT = "recs_from_friends";

function PlaceCardPhoto({ photoRef, alt }: { photoRef: string | null; alt: string }) {
    const photoUrl = usePhotoUrl(photoRef);
    if (!photoUrl) return null;
    return (
        <Image
            src={photoUrl}
            alt={alt}
            fill
            className="object-cover"
            unoptimized
        />
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

export default function BoardDetailPage() {
    const { status } = useSession();
    const params = useParams();
    const router = useRouter();
    const intent = typeof params.intent === "string" ? params.intent : "uncategorized";
    const isRecs = intent === RECS_INTENT;
    const label = intentLabel(intent);

    const [places, setPlaces] = useState<SavedPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailPlace, setDetailPlace] = useState<SavedPlace | null>(null);
    const { handleUnsave } = useSavePlace();
    const { triggerVibeVoting } = useVibeVoting();
    const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
    const [userVibes, setUserVibes] = useState<Record<string, string[]>>({});
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const { showToast } = useToast();
    const [sharePlace, setSharePlace] = useState<{ placeId: string; name: string } | null>(null);

    // Get user location for distance in detail modal
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {},
            { timeout: 8000 }
        );
    }, []);

    useEffect(() => {
        if (status === "loading") return;

        if (status === "authenticated") {
            fetch("/api/saves")
                .then((r) => r.json())
                .then((data: SavedPlace[]) => {
                    if (Array.isArray(data)) {
                        setPlaces(data.filter((s) => {
                            const raw = s.intent || "uncategorized";
                            return normalizeIntent(raw) === intent;
                        }));
                    } else {
                        setPlaces([]);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));

            // Fetch visited ids
            fetch("/api/visits")
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data)) setVisitedIds(new Set(data.map(v => v.placeId)));
                }).catch(() => { });

            // Fetch user votes
            fetch("/api/vibe-votes")
                .then(r => r.json())
                .then(data => {
                    if (data && data.userVotes) setUserVibes(data.userVotes);
                }).catch(() => { });

        } else {
            const allSaves = getSavedPlaces();
            setPlaces(allSaves.filter((s) => {
                const raw = s.intent || "uncategorized";
                return normalizeIntent(raw) === intent;
            }));
            setLoading(false);
        }
    }, [status, intent]);

    const handleRemovePlace = useCallback(async (placeId: string) => {
        await handleUnsave(placeId);
        setPlaces((prev) => prev.filter((p) => p.placeId !== placeId));
        showToast(`Removed from ${label}`, "success");
    }, [handleUnsave, label, showToast]);

    const handleUnsaveFromModal = useCallback((placeId: string) => {
        setPlaces((prev) => prev.filter((p) => p.placeId !== placeId));
        showToast(`Removed from ${label}`, "success");
    }, [label, showToast]);

    if (loading || status === "loading") {
        return (
            <div className="min-h-dvh bg-white dark:bg-[#0E1116] flex flex-col items-center justify-center pb-28">
                <div
                    className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
                    style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
                />
            </div>
        );
    }

    const savedPlaceIds = new Set(places.map(p => p.placeId));

    return (
        <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-32 lg:pb-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-6">
                <button
                    onClick={() => router.push("/boards")}
                    className="flex items-center gap-1 text-sm text-[#656D76] dark:text-[#8B949E] hover:text-[#E85D2A] cursor-pointer transition-colors duration-200"
                >
                    <ChevronLeft size={18} />
                    Back
                </button>
                <h1 className="text-2xl font-bold text-[#0E1116] dark:text-white mt-2">
                    {label}
                </h1>
                <p className="text-[#656D76] dark:text-[#8B949E] text-sm mt-1">
                    {places.length} {places.length === 1 ? "place" : "places"} saved
                </p>
            </div>

            {/* Recs banner */}
            {isRecs && (
                <div className="max-w-5xl mx-auto px-4 lg:px-6 mt-4">
                    <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200/50 dark:border-violet-800/30">
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                            Places recommended by your friends — a personal collection of trusted spots.
                        </p>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 lg:px-6 mt-6">
                {places.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Bookmark className="w-16 h-16 text-[#D0D7DE] dark:text-[#30363D]" />
                        <h2 className="text-lg font-semibold text-[#0E1116] dark:text-white mt-4">
                            No places saved yet
                        </h2>
                        <p className="text-[#656D76] dark:text-[#8B949E] text-sm mt-2 max-w-sm">
                            Swipe right on places you like to save them here
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold px-6 py-3 rounded-xl mt-6 cursor-pointer transition-all duration-200"
                        >
                            Start Discovering
                        </button>
                    </div>
                ) : (
                    /* Place cards grid */
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.05 } },
                        }}
                    >
                        <AnimatePresence>
                            {places.map((place) => (
                                <motion.div
                                    key={place.placeId}
                                    layout
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 },
                                    }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    className="aspect-[3/4] rounded-xl overflow-hidden relative cursor-pointer border border-[#D0D7DE]/50 dark:border-0 shadow-sm dark:shadow-lg hover:scale-[1.02] hover:shadow-xl transition-transform duration-200"
                                    onClick={() => setDetailPlace(place)}
                                >
                                    {/* Full photo background */}
                                    <div className="absolute inset-0 bg-[#F6F8FA] dark:bg-[#1C2128]">
                                        <PlaceCardPhoto photoRef={place.photoRef} alt={place.name} />
                                        {!place.photoRef && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <MapPin className="w-8 h-8 text-[#D0D7DE] dark:text-[#30363D]" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePlace(place.placeId);
                                        }}
                                        className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-sm rounded-full p-1.5 cursor-pointer hover:bg-black/60 transition-all duration-200"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                    {/* Rec sender badge */}
                                    {isRecs && place.recommendedByName && (
                                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                                            <RecSenderAvatar image={place.recommendedByImage} name={place.recommendedByName} />
                                            <span className="text-[10px] font-semibold text-white truncate max-w-[100px]">
                                                From {place.recommendedByName.split(" ")[0]}
                                            </span>
                                        </div>
                                    )}
                                    {/* Text overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <p className="text-white font-semibold text-base line-clamp-1">
                                            {place.name}
                                        </p>
                                        <p className="text-white/60 text-xs line-clamp-1 mt-0.5">
                                            {place.address}
                                        </p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-3.5 h-3.5 text-[#E85D2A] fill-[#E85D2A]" />
                                                <span className="text-white text-xs font-medium">
                                                    {place.rating?.toFixed(1) || "New"}
                                                </span>
                                                <span className="text-white/30 text-xs">&middot;</span>
                                                <span className="text-white/60 text-xs">
                                                    {place.price || "$$"}
                                                </span>
                                            </div>
                                            {isReservable(place.type) && (
                                                <a
                                                    href={getBookingUrl(place.name, place.address || "", place.placeId).url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const { platform } = getBookingUrl(place.name, place.address || "", place.placeId);
                                                        fetch("/api/bookings/track", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ googlePlaceId: place.placeId, platform, source: "boards" }),
                                                        }).catch(() => {});
                                                    }}
                                                    className="text-[#E85D2A] hover:text-[#d14e1f] transition-colors"
                                                    title="Reserve a Table"
                                                >
                                                    <CalendarCheck size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Place detail modal */}
            <AnimatePresence>
                {detailPlace && (
                    <MapPlaceDetail
                        place={detailPlace as Place}
                        intent={intent}
                        savedPlaceIds={savedPlaceIds}
                        userLocation={userLocation}
                        onClose={() => setDetailPlace(null)}
                        onUnsave={handleUnsaveFromModal}
                        onShare={(p) => setSharePlace(p)}
                    />
                )}
            </AnimatePresence>

            {/* Share Modal — rendered at page level to escape transforms */}
            {sharePlace && (
                <ShareModal
                    place={sharePlace}
                    onClose={() => setSharePlace(null)}
                />
            )}
        </div>
    );
}
