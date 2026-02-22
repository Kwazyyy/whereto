"use client";

import { useState, useRef, useMemo } from "react";
import {
    motion,
    useMotionValue,
    useTransform,
    animate,
    PanInfo,
} from "framer-motion";
import Image from "next/image";
import { Place, FriendSignal } from "@/lib/types";
import { usePhotoUrl } from "@/lib/use-photo-url";

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;
const TAP_MOVE_LIMIT = 10;
const TAP_TIME_LIMIT = 200;

export function friendLabel(friends: FriendSignal[]): string {
    const first = (f: FriendSignal) => f.name?.split(" ")[0] ?? "someone";
    if (friends.length === 1) return `Liked by ${first(friends[0])}`;
    if (friends.length === 2) return `Liked by ${first(friends[0])} & ${first(friends[1])}`;
    return `Liked by ${first(friends[0])} & ${friends.length - 1} others`;
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
    onSwipeUpSync,
    isTop,
    isSaved,
    onAction,
}: {
    place: Place;
    fallbackGradient: string;
    onSwipe: (direction: "left" | "right" | "up") => void;
    onSwipeUpSync?: () => void;
    isTop: boolean;
    isSaved: boolean;
    onAction: (action: "save" | "go_now") => void;
}) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const pointerStart = useRef({ x: 0, y: 0, time: 0 });
    const isDragging = useRef(false);
    const carouselPointerStart = useRef({ x: 0, y: 0, time: 0 });
    const carouselRef = useRef<HTMLDivElement>(null);
    const rotateZ = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
    const saveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
    const goNowOpacity = useTransform(y, [-SWIPE_UP_THRESHOLD, 0], [1, 0]);

    const [isFlipped, setIsFlipped] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const matchScore = useMemo(() => Math.floor(Math.random() * 19) + 80, []);

    const todayHours = useMemo(() => {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = days[new Date().getDay()];
        return place.hours.find((h) => h.startsWith(today)) ?? null;
    }, [place.hours]);

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
        if (offset.y < -SWIPE_UP_THRESHOLD) {
            if (onSwipeUpSync) onSwipeUpSync();
            animate(y, -800, { duration: 0.3 });
            setTimeout(() => onSwipe("up"), 300);
        } else if (offset.x > SWIPE_THRESHOLD) {
            animate(x, 500, { duration: 0.3 });
            setTimeout(() => onSwipe("right"), 300);
        } else if (offset.x < -SWIPE_THRESHOLD) {
            animate(x, -500, { duration: 0.3 });
            setTimeout(() => onSwipe("left"), 300);
        } else {
            animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
            animate(y, 0, { type: "spring", stiffness: 500, damping: 30 });
        }
    }

    const dragEnabled = isTop && !isFlipped;

    return (
        <motion.div
            className="absolute inset-4 z-10 touch-none"
            style={{ x, y, rotateZ, zIndex: isTop ? 10 : 0, perspective: 1500 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
            drag={dragEnabled}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
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

                    {isSaved && (
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#E85D2A" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                            <span className="text-white text-[11px] font-semibold leading-none">Saved</span>
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
                            <motion.div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 z-20 pointer-events-none" style={{ opacity: goNowOpacity }}>
                                <span className="text-5xl font-black text-white border-4 border-white rounded-2xl px-6 py-4">GO NOW</span>
                            </motion.div>
                        </>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10 pointer-events-none">
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
                </div>

                {/* ===================== BACK FACE ===================== */}
                <div
                    className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#1a1a2e] flex flex-col transition-opacity duration-300 ${isFlipped ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                        }`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    {/* Flip Back Button */}
                    <button
                        onClick={() => setIsFlipped(false)}
                        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-lg cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    </button>

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
                                ref={carouselRef}
                                className={`absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-none ${!(place.photoRefs && place.photoRefs.length > 0) ? `bg-gradient-to-br ${fallbackGradient}` : ""}`}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    carouselPointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                                }}
                                onPointerUp={(e) => {
                                    e.stopPropagation();
                                    const dx = Math.abs(e.clientX - carouselPointerStart.current.x);
                                    const dy = Math.abs(e.clientY - carouselPointerStart.current.y);
                                    const dt = Date.now() - carouselPointerStart.current.time;

                                    // If it's a tap, determine if left or right side was clicked
                                    if (dx < TAP_MOVE_LIMIT && dy < TAP_MOVE_LIMIT && dt < TAP_TIME_LIMIT) {
                                        if (carouselRef.current && place.photoRefs) {
                                            const rect = carouselRef.current.getBoundingClientRect();
                                            const xPos = e.clientX - rect.left;
                                            const width = rect.width;

                                            let newIndex = activePhotoIndex;
                                            if (xPos > width * 0.35) {
                                                // Tapped right 65% -> Go to next photo
                                                newIndex = Math.min(activePhotoIndex + 1, place.photoRefs.length - 1);
                                            } else {
                                                // Tapped left 35% -> Go to previous photo
                                                newIndex = Math.max(activePhotoIndex - 0, 0); // Need to correctly max with 0
                                            }

                                            if (newIndex !== activePhotoIndex) {
                                                carouselRef.current.scrollTo({
                                                    left: newIndex * width,
                                                    behavior: "smooth"
                                                });
                                            }
                                        }
                                    }
                                }}
                                onScroll={(e) => {
                                    const scrollLeft = e.currentTarget.scrollLeft;
                                    const width = e.currentTarget.clientWidth;
                                    const index = Math.round(scrollLeft / width);
                                    setActivePhotoIndex(index);
                                }}
                            >
                                {place.photoRefs && place.photoRefs.length > 0 ? (
                                    place.photoRefs.map((ref, idx) => (
                                        <div key={idx} className="w-full shrink-0 snap-center h-full relative bg-gray-200 dark:bg-[#22223b]">
                                            <CardPhoto photoRef={ref} gradient={fallbackGradient} />
                                        </div>
                                    ))
                                ) : (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient}`} />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#1a1a2e] via-transparent to-transparent pointer-events-none" />
                            </div>

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

                        <div className="px-5 pt-2 relative z-10 pb-32">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1B2A4A] dark:text-[#e8edf4]">
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
                                    <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[#1B2A4A] dark:text-[#e8edf4] text-xs font-semibold">
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
                                                        className="rounded-full shrink-0 object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {f.name?.[0]?.toUpperCase() ?? "?"}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-[#1B2A4A] dark:text-[#e8edf4]">
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
                                        <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Noise Level</p><p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">Quiet</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 ml-0.5" />
                                        <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Busyness</p><p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">Not Busy</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8Z" /></svg>
                                        <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Outlets</p><p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">Plenty</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0Z" /><path d="M5 18v2" /><path d="M19 18v2" /></svg>
                                        <div><p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Seating</p><p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">Long Stay</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="mt-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-gray-50 dark:bg-[#22223b]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <div>
                                    <p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">
                                        {place.openNow ? "Open Now" : "Closed"}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {todayHours ?? "Hours unavailable"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons (Sticky at bottom of back face) */}
                    <div className="absolute bottom-0 inset-x-0 px-5 pb-5 pt-4 bg-gradient-to-t from-white dark:from-[#1a1a2e] from-80% to-transparent pointer-events-none">
                        <div className="flex gap-3 pointer-events-auto">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction("save"); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-colors cursor-pointer ${isSaved
                                    ? "border-[#E85D2A] text-[#E85D2A] bg-orange-50 dark:bg-[#E85D2A]/10"
                                    : "border-gray-200 dark:border-white/15 text-[#1B2A4A] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-white/5"
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
                                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#E85D2A] text-white font-bold text-sm shadow-lg shadow-[#E85D2A]/30 hover:bg-[#d04e1f] active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                                Go Now
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/15 text-[#1B2A4A] dark:text-[#e8edf4] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
