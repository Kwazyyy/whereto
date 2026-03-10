"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    animate,
    PanInfo,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Place, FriendSignal } from "@/lib/types";
import { Home } from "lucide-react";
import { usePhotoUrl } from "@/lib/use-photo-url";
import CommunityVibes from "./CommunityVibes";
import { getBookingUrl, isReservable } from "@/lib/booking";

const SWIPE_THRESHOLD = 100;
const TAP_MOVE_LIMIT = 10;
const TAP_TIME_LIMIT = 200;

const carouselSlideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%",
    }),
    center: {
        x: 0,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? "-100%" : "100%",
    }),
};

export function friendLabel(friends: FriendSignal[]): string {
    const first = (f: FriendSignal) => f.name?.split(" ")[0] ?? "someone";
    const scoreTag = (f: FriendSignal) =>
        f.tasteScore !== undefined ? ` (${f.tasteScore}% match)` : "";

    if (friends.length === 1)
        return `Liked by ${first(friends[0])}${scoreTag(friends[0])}`;
    if (friends.length === 2)
        return `Liked by ${first(friends[0])}${scoreTag(friends[0])} & ${first(friends[1])}`;
    return `Liked by ${first(friends[0])}${scoreTag(friends[0])} & ${friends.length - 1} others`;
}

export function FriendAvatars({ friends }: { friends: FriendSignal[] }) {
    const shown = friends.slice(0, 3);
    return (
        <div className="flex items-center">
            {shown.map((f, i) => (
                <div
                    key={f.userId}
                    className="w-5 h-5 rounded-full border-[1.5px] border-black/30 overflow-hidden bg-[#E85D2A] flex items-center justify-center shrink-0"
                    style={{ marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }}
                >
                    {f.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.image} alt={f.name ?? ""} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white text-[7px] font-bold leading-none">
                            {f.name?.[0]?.toUpperCase() ?? "?"}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

export function CardPhoto({ photoRef, gradient }: { photoRef: string | null; gradient: string }) {
    const photoUrl = usePhotoUrl(photoRef);
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <>
            {photoUrl ? (
                <Image
                    src={photoUrl}
                    alt=""
                    fill
                    className={`object-cover transition-all duration-700 ease-in-out ${isLoaded ? "scale-100 blur-0 opacity-100" : "scale-105 blur-md opacity-50"
                        }`}
                    onLoad={() => setIsLoaded(true)}
                    unoptimized
                    priority
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            )}
        </>
    );
}

export function SwipeCard({
    place,
    fallbackGradient,
    onSwipe,
    isTop,
    isSaved,
    isFeatured,
    isVisited,
    visitCount,
    lastVisitedAt,
    onAction,
    onShare,
    onAddPhotos,
}: {
    place: Place;
    fallbackGradient: string;
    onSwipe: (direction: "left" | "right") => void;
    isTop: boolean;
    isSaved: boolean;
    isFeatured?: boolean;
    isVisited?: boolean;
    visitCount?: number;
    lastVisitedAt?: string;
    onAction: (action: "save" | "go_now") => void;
    onShare?: () => void;
    onAddPhotos?: () => void;
}) {
    const x = useMotionValue(0);
    const pointerStart = useRef({ x: 0, y: 0, time: 0 });
    const isDragging = useRef(false);
    const carouselPointerStart = useRef({ x: 0, y: 0, time: 0 });
    const [carouselDirection, setCarouselDirection] = useState(0);
    const rotateZ = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
    const saveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

    const cardRef = useRef<HTMLDivElement>(null);
    const dragEnabledRef = useRef(false);

    const [isFlipped, setIsFlipped] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const matchScore = place.matchScore ?? 0;

    const todayHours = useMemo(() => {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = days[new Date().getDay()];
        return place.hours.find((h) => h.startsWith(today)) ?? null;
    }, [place.hours]);

    // Keep ref current so the native touchmove handler can read the latest value
    const dragEnabled = isTop && !isFlipped;
    dragEnabledRef.current = dragEnabled;

    // Build an overlay for Friend / Creator saves at bottom of card
    const hasSpecialSignals = (place.friendSaves && place.friendSaves.length > 0) || place.creatorSignal;

    // Prevent the browser from intercepting vertical touch gestures as page scroll.
    // Must be a non-passive native listener — React's synthetic events can't call
    // preventDefault on touchmove in React 17+.
    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        function preventScroll(e: TouchEvent) {
            if (dragEnabledRef.current) e.preventDefault();
        }
        el.addEventListener("touchmove", preventScroll, { passive: false });
        return () => el.removeEventListener("touchmove", preventScroll);
    }, []);

    function handlePointerDown(e: React.PointerEvent) {
        pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        isDragging.current = false;
    }

    function handlePointerUp(e: React.PointerEvent) {
        if (isDragging.current) return;
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        const dt = Date.now() - pointerStart.current.time;
        if (dx < TAP_MOVE_LIMIT && dy < TAP_MOVE_LIMIT && dt < TAP_TIME_LIMIT) {
            if (!isFlipped) setIsFlipped(true);
            else setIsFlipped(false);
        }
    }

    function handleDragStart() {
        isDragging.current = true;
    }

    function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
        const { offset } = info;
        if (offset.x > SWIPE_THRESHOLD) {
            animate(x, 500, { duration: 0.3 });
            setTimeout(() => onSwipe("right"), 300);
        } else if (offset.x < -SWIPE_THRESHOLD) {
            animate(x, -500, { duration: 0.3 });
            setTimeout(() => onSwipe("left"), 300);
        } else {
            animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
        }
    }

    return (
        <motion.div
            ref={cardRef}
            className="absolute inset-4 z-10 touch-none"
            style={{ x, rotateZ, zIndex: isTop ? 10 : 0, perspective: 1500 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
            drag={dragEnabled ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onPointerDown={dragEnabled ? handlePointerDown : undefined}
            onPointerUp={dragEnabled ? handlePointerUp : undefined}
            onDragStart={dragEnabled ? handleDragStart : undefined}
            onDragEnd={dragEnabled ? handleDragEnd : undefined}
        >
            <motion.div
                className="w-full h-full relative"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* ===================== FRONT FACE ===================== */}
                <div
                    className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-gray-300 transition-opacity duration-300 ${isFlipped ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                        }`}
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div className="absolute inset-0 bg-gray-300 pointer-events-none">
                        <CardPhoto photoRef={place.photoRef} gradient={fallbackGradient} />
                    </div>

                    <div className="absolute bottom-0 inset-x-0 h-[50%] bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

                    {/* Top Special Badges (Friends / Creators) — hidden when Saved badge occupies top-left */}
                    {hasSpecialSignals && !isSaved && (
                        <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
                            {place.creatorSignal && (
                                <div className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#161B22]/90 backdrop-blur-md shadow-lg border border-orange-100 dark:border-white/10">
                                    {place.creatorSignal.avatarUrl ? (
                                        <div className="relative w-5 h-5">
                                            <Image src={place.creatorSignal.avatarUrl} alt={place.creatorSignal.name} fill className="rounded-full object-cover ring-1 ring-white dark:ring-[#161B22]" unoptimized />
                                            <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] bg-[#E85D2A] rounded-full border border-white dark:border-[#161B22] flex items-center justify-center">
                                                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative w-5 h-5 rounded-full bg-[#E85D2A] text-[9px] font-bold text-white flex items-center justify-center ring-1 ring-white dark:ring-[#161B22]">
                                            {place.creatorSignal.name[0]}
                                            <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] bg-[#E85D2A] rounded-full border border-white dark:border-[#161B22] flex items-center justify-center">
                                                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                            </div>
                                        </div>
                                    )}
                                    <span className="text-xs font-bold text-[#E85D2A]">Saved by {place.creatorSignal.name.split(' ')[0]}</span>
                                </div>
                            )}
                            {place.friendSaves && place.friendSaves.length > 0 && (
                                <div className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#161B22]/90 backdrop-blur-md shadow-lg border border-gray-100 dark:border-white/10">
                                    <div className="flex -space-x-1.5">
                                        {place.friendSaves.slice(0, 3).map((f) => (
                                            f.image ? (
                                                <Image key={f.userId} src={f.image} alt={f.name || ""} width={20} height={20} className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-[#161B22] object-cover" unoptimized />
                                            ) : (
                                                <div key={f.userId} className="w-5 h-5 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-[#161B22]">
                                                    {f.name?.[0]}
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    <span className="text-xs font-semibold text-[#0E1116] dark:text-[#e8edf4]">
                                        Saved by {place.friendSaves[0].name?.split(' ')[0]} {place.friendSaves.length > 1 && `+${place.friendSaves.length - 1}`}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {isSaved && (
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#E85D2A" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                            <span className="text-white text-[11px] font-semibold leading-none">Saved</span>
                        </div>
                    )}

                    {isVisited && (
                        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-green-600/90 backdrop-blur-sm shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                <span className="text-white text-[11px] font-semibold leading-none">Visited</span>
                            </div>
                            {visitCount != null && visitCount >= 2 && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                                    <Home className="w-2.5 h-2.5 text-white" />
                                    <span className="text-white text-[10px] font-bold leading-none">x{visitCount}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {isTop && !isFlipped && (
                        <>
                            <motion.div className="absolute inset-0 flex items-center justify-center bg-green-500/30 z-20 pointer-events-none" style={{ opacity: saveOpacity }}>
                                <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-8 py-4 rotate-[-15deg]">SAVE</span>
                            </motion.div>
                            <motion.div className="absolute inset-0 flex items-center justify-center bg-gray-500/30 z-20 pointer-events-none" style={{ opacity: skipOpacity }}>
                                <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-8 py-4 rotate-[15deg]">SKIP</span>
                            </motion.div>
                        </>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10 pointer-events-none">
                        {isFeatured && (
                            <div className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                                    <path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" />
                                </svg>
                                <span>Featured</span>
                            </div>
                        )}
                        <h2 className="text-3xl font-bold text-white leading-tight">{place.name}</h2>
                        <div className="flex items-center gap-3 mt-2 text-white/80 text-sm font-medium">
                            <span>{place.distance}</span>
                            <span className="w-1 h-1 rounded-full bg-white/60" />
                            <span className="capitalize">{place.type}</span>
                            <span className="w-1 h-1 rounded-full bg-white/60" />
                            <span>{place.price}</span>
                            {place.rating > 0 && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/60" />
                                    <span>&#9733; {place.rating.toFixed(1)}</span>
                                </>
                            )}
                        </div>
                        {place.friendSaves && place.friendSaves.length > 0 && (
                            <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                                <FriendAvatars friends={place.friendSaves} />
                                <span className="text-white text-xs font-semibold leading-none">
                                    {friendLabel(place.friendSaves)}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {place.tags.map((tag) => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Menu button — bottom right (replaces Go Now) */}
                    {isTop && place.menuUrl && (
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); window.open(place.menuUrl, '_blank'); }}
                            className="absolute bottom-5 right-5 z-20 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center pointer-events-auto active:scale-90 transition-transform"
                            aria-label="View menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* ===================== BACK FACE ===================== */}
                <div
                    className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#161B22] flex flex-col transition-opacity duration-300 ${isFlipped ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                        }`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div
                        className="flex-1 overflow-y-auto scrollbar-none"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                        }}
                        onPointerUp={(e) => {
                            const dx = Math.abs(e.clientX - pointerStart.current.x);
                            const dy = Math.abs(e.clientY - pointerStart.current.y);
                            const dt = Date.now() - pointerStart.current.time;
                            if (dx < TAP_MOVE_LIMIT && dy < TAP_MOVE_LIMIT && dt < TAP_TIME_LIMIT) {
                                setIsFlipped(false);
                            }
                        }}
                    >
                        {/* Photo Carousel */}
                        <div className="relative min-h-[40vh] h-[40%] shrink-0 w-full">
                            <div
                                className={`absolute inset-0 overflow-hidden ${!(place.photoRefs && place.photoRefs.length > 0) ? `bg-gradient-to-br ${fallbackGradient}` : ""}`}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    carouselPointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                                }}
                                onPointerUp={(e) => {
                                    e.stopPropagation();
                                    const dx = Math.abs(e.clientX - carouselPointerStart.current.x);
                                    const dy = Math.abs(e.clientY - carouselPointerStart.current.y);
                                    const dt = Date.now() - carouselPointerStart.current.time;

                                    if (dx < TAP_MOVE_LIMIT && dy < TAP_MOVE_LIMIT && dt < TAP_TIME_LIMIT) {
                                        if (place.photoRefs && place.photoRefs.length > 1) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const xPos = e.clientX - rect.left;
                                            const width = rect.width;
                                            const len = place.photoRefs.length;

                                            if (xPos > width * 0.35) {
                                                setCarouselDirection(1);
                                                setActivePhotoIndex((activePhotoIndex + 1) % len);
                                            } else {
                                                setCarouselDirection(-1);
                                                setActivePhotoIndex((activePhotoIndex - 1 + len) % len);
                                            }
                                        }
                                    }
                                }}
                            >
                                {place.photoRefs && place.photoRefs.length > 0 ? (
                                    <AnimatePresence initial={false} custom={carouselDirection}>
                                        <motion.div
                                            key={activePhotoIndex}
                                            custom={carouselDirection}
                                            variants={carouselSlideVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.2}
                                            dragDirectionLock
                                            onDragEnd={(_, info) => {
                                                if (!place.photoRefs || place.photoRefs.length <= 1) return;
                                                const len = place.photoRefs.length;
                                                if (info.offset.x < -50 || info.velocity.x < -500) {
                                                    setCarouselDirection(1);
                                                    setActivePhotoIndex((activePhotoIndex + 1) % len);
                                                } else if (info.offset.x > 50 || info.velocity.x > 500) {
                                                    setCarouselDirection(-1);
                                                    setActivePhotoIndex((activePhotoIndex - 1 + len) % len);
                                                }
                                            }}
                                            className="absolute inset-0 bg-gray-200 dark:bg-[#1C2128]"
                                            style={{ touchAction: "pan-y" }}
                                        >
                                            <CardPhoto photoRef={place.photoRefs[activePhotoIndex]} gradient={fallbackGradient} />
                                        </motion.div>
                                    </AnimatePresence>
                                ) : (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient}`} />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#161B22] via-transparent to-transparent pointer-events-none z-10" />
                            </div>

                            {/* Invisible tap zones */}
                            {place.photoRefs && place.photoRefs.length > 1 && (
                                <>
                                    <div
                                        className="absolute top-0 bottom-0 left-0 w-1/2 z-10 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const len = place.photoRefs!.length;
                                            setCarouselDirection(-1);
                                            setActivePhotoIndex((activePhotoIndex - 1 + len) % len);
                                        }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onPointerUp={(e) => e.stopPropagation()}
                                    />
                                    <div
                                        className="absolute top-0 bottom-0 right-0 w-1/2 z-10 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const len = place.photoRefs!.length;
                                            setCarouselDirection(1);
                                            setActivePhotoIndex((activePhotoIndex + 1) % len);
                                        }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onPointerUp={(e) => e.stopPropagation()}
                                    />
                                </>
                            )}

                            {/* Dot Indicators */}
                            {place.photoRefs && place.photoRefs.length > 1 && (
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-20">
                                    {place.photoRefs.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activePhotoIndex
                                                ? "w-4 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                                                : "w-1.5 bg-white/50 shadow-[0_0_2px_rgba(0,0,0,0.5)]"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-5 pt-2 relative z-10">
                            {isFeatured && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full mb-2" style={{ background: "rgba(202, 138, 4, 0.2)", border: "1px solid rgba(202, 138, 4, 0.4)", backdropFilter: "blur(8px)" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                                        <path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" />
                                    </svg>
                                    <span className="text-xs font-semibold" style={{ color: "#CA8A04" }}>Featured</span>
                                </div>
                            )}
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">
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
                                <span className="shrink-0 mt-1 px-3 py-1.5 rounded-full bg-[#E85D2A] text-white text-sm font-bold shadow-sm">
                                    {matchScore}% Match
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {place.tags.map((tag) => (
                                    <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[#0E1116] dark:text-[#e8edf4] text-xs font-semibold">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {place.address && (
                                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{place.address}</p>
                            )}

                            {/* Visit history */}
                            {visitCount != null && visitCount >= 1 && (
                                <div className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#1C2128]">
                                    <Home className="w-5 h-5 text-[#E85D2A]" />
                                    <div>
                                        <p className="text-sm font-semibold text-[#0E1116] dark:text-[#e8edf4]">
                                            You&apos;ve visited {visitCount} {visitCount === 1 ? "time" : "times"}
                                        </p>
                                        {lastVisitedAt && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                Last visit: {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastVisitedAt))}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <CommunityVibes placeId={place.placeId} limit={5} />

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
                                                        className="rounded-full shrink-0 object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {f.name?.[0]?.toUpperCase() ?? "?"}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-[#0E1116] dark:text-white">
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
                                <h3 className="text-xs font-semibold text-[#656D76] dark:text-[#8B949E] uppercase tracking-wider mb-3">Details</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1C2128]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3a1 1 0 0 0 1 1h3" /><path d="M8 14h0" /><path d="m6 6 1.5 1.5" /><path d="M2 2v2" /></svg>
                                        <div><p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">Noise Level</p><p className="text-sm font-medium text-[#0E1116] dark:text-white">Quiet</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1C2128]">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 ml-0.5" />
                                        <div><p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">Busyness</p><p className="text-sm font-medium text-[#0E1116] dark:text-white">Not Busy</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1C2128]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8Z" /></svg>
                                        <div><p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">Outlets</p><p className="text-sm font-medium text-[#0E1116] dark:text-white">Plenty</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1C2128]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0Z" /><path d="M5 18v2" /><path d="M19 18v2" /></svg>
                                        <div><p className="text-xs font-normal text-[#656D76] dark:text-[#8B949E]">Seating</p><p className="text-sm font-medium text-[#0E1116] dark:text-white">Long Stay</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="mt-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-gray-50 dark:bg-[#1C2128]">
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
                            {/* View Menu link */}
                            {place.menuUrl && (
                                <a
                                    href={place.menuUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#1C2128] hover:bg-gray-100 dark:hover:bg-[#252D38] transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onPointerUp={(e) => e.stopPropagation()}
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
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </div>
                                </a>
                            )}
                            {/* Reserve a Table row */}
                            {place.address && isReservable(place.type) && (
                                <a
                                    href={getBookingUrl(place.name, place.address, place.placeId).url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#1C2128] hover:bg-gray-100 dark:hover:bg-[#252D38] transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const { platform } = getBookingUrl(place.name, place.address, place.placeId);
                                        fetch("/api/bookings/track", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ googlePlaceId: place.placeId, platform, source: "swipe_card" }),
                                        }).catch(() => {});
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onPointerUp={(e) => e.stopPropagation()}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" />
                                    </svg>
                                    <span className="flex-1 text-sm font-medium text-[#0E1116] dark:text-white">
                                        Reserve a Table
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" />
                                        </svg>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </div>
                                </a>
                            )}
                            {/* Community Photos link */}
                            <Link
                                href={`/places/${place.placeId}/photos`}
                                className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#1C2128] hover:bg-gray-100 dark:hover:bg-[#252D38] transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerUp={(e) => e.stopPropagation()}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                <span className="flex-1 text-sm font-medium text-[#0E1116] dark:text-white">
                                    Community Photos
                                    {place.communityPhotoCount != null && place.communityPhotoCount > 0 ? (
                                        <span className="text-[#656D76] dark:text-[#8B949E] font-normal"> ({place.communityPhotoCount})</span>
                                    ) : (
                                        <span className="text-[#656D76] dark:text-[#8B949E] font-normal text-xs"> — Be the first!</span>
                                    )}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </Link>

                            {/* Action Buttons — in scroll flow, clear nav bar */}
                            {/* onPointerDown/Up stopPropagation prevents the scroll container's tap-to-flip-back handler from firing when buttons are tapped */}
                            <div
                                className="flex gap-3 mt-6 mb-20"
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerUp={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAction("save"); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer ${isSaved
                                        ? "border border-[#D0D7DE] dark:border-[#30363D] bg-transparent text-[#E85D2A]"
                                        : "border border-[#D0D7DE] dark:border-[#30363D] text-[#0E1116] dark:text-white hover:border-[#E85D2A] hover:text-[#E85D2A]"
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
                                    onClick={(e) => { e.stopPropagation(); onAction("go_now"); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold text-sm transition-colors duration-200 cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                                    Go Now
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (onShare) onShare(); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#D0D7DE] dark:border-[#30363D] text-[#656D76] dark:text-[#8B949E] hover:border-[#E85D2A] hover:text-[#E85D2A] font-semibold text-sm transition-colors duration-200 cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
                                    Share
                                </button>
                            </div>
                            {isVisited && onAddPhotos && (
                                <div
                                    className="mt-2 mb-16"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onPointerUp={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onAddPhotos(); }}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/15 text-gray-500 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                        Add Photos
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
