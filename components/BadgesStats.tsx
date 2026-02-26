"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BadgeDefinition {
    type: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    requirement: number;
}

interface EarnedBadge {
    badgeType: string;
    earnedAt: string;
}

interface BadgeProgress {
    visits: number;
    neighborhoods: number;
    friends: number;
    saves: number;
    recommendations: number;
    streak: number;
    uniqueIntents: number;
}

interface BadgeDisplay {
    def: BadgeDefinition;
    earned: boolean;
    earnedAt: string | null;
    currentProgress: number;
}

export function BadgesStats() {
    const [badges, setBadges] = useState<BadgeDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
    const [totalEarned, setTotalEarned] = useState(0);

    // Scroll Physics
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const velocityRef = useRef(0);
    const lastTimeRef = useRef(0);
    const lastXRef = useRef(0);
    const animationRef = useRef<number | null>(null);
    const isDragClickRef = useRef(false);

    useEffect(() => {
        fetch("/api/badges")
            .then(res => res.json())
            .then((data: {
                earned: EarnedBadge[],
                definitions: BadgeDefinition[],
                progress: BadgeProgress
            }) => {
                if (!data.definitions) return;
                const earnedMap = new Map(data.earned.map(e => [e.badgeType, e.earnedAt]));
                setTotalEarned(data.earned.length);

                const getProgress = (def: BadgeDefinition) => {
                    switch (def.type) {
                        case "first_visit":
                        case "explorer_5":
                        case "explorer_10":
                        case "explorer_25":
                        case "explorer_50":
                            return data.progress.visits;
                        case "neighborhood_3":
                        case "neighborhood_10":
                        case "neighborhood_all":
                            return data.progress.neighborhoods;
                        case "first_friend":
                        case "friends_5":
                            return data.progress.friends;
                        case "first_rec":
                        case "rec_10":
                            return data.progress.recommendations;
                        case "first_save":
                        case "saves_25":
                        case "saves_50":
                            return data.progress.saves;
                        case "all_intents":
                            return data.progress.uniqueIntents;
                        case "streak_3":
                        case "streak_7":
                        case "streak_30":
                            return data.progress.streak;
                        default:
                            return 0;
                    }
                };

                const allBadges: BadgeDisplay[] = data.definitions.map(def => ({
                    def,
                    earned: earnedMap.has(def.type),
                    earnedAt: earnedMap.get(def.type) || null,
                    currentProgress: getProgress(def)
                }));

                const earnedList = allBadges.filter(b => b.earned)
                    .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime());
                const unearnedList = allBadges.filter(b => !b.earned);

                setBadges([...earnedList, ...unearnedList]);
            })
            .catch(() => { })
            .finally(() => setLoading(false));

        // Close tooltip when tapping outside
        const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
            if (scrollRef.current && !scrollRef.current.contains(e.target as Node)) {
                setSelectedBadge(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        isDragClickRef.current = false;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        setStartX(pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
        lastXRef.current = pageX;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
    };

    const handleMouseLeaveOrUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (Math.abs(velocityRef.current) > 0.1) {
            applyMomentum();
        } else {
            setTimeout(() => { isDragClickRef.current = false; }, 0);
        }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !scrollRef.current) return;
        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;

        if (Math.abs(walk) > 5) {
            isDragClickRef.current = true;
            if (selectedBadge) setSelectedBadge(null);
        }

        const now = performance.now();
        const dt = now - lastTimeRef.current;
        if (dt > 0) {
            velocityRef.current = (pageX - lastXRef.current) / dt;
        }
        lastXRef.current = pageX;
        lastTimeRef.current = now;
    };

    const applyMomentum = () => {
        if (!scrollRef.current) return;
        if (Math.abs(velocityRef.current) < 0.01) {
            setTimeout(() => { isDragClickRef.current = false; }, 0);
            return;
        }
        scrollRef.current.scrollLeft -= velocityRef.current * 16;
        velocityRef.current *= 0.95;
        animationRef.current = requestAnimationFrame(applyMomentum);
    };

    const handleBadgeClick = (type: string) => {
        if (isDragClickRef.current) return;
        setSelectedBadge(prev => prev === type ? null : type);
    };

    if (loading || badges.length === 0) return null;

    // get descriptive label based on def type
    const getProgressLabel = (def: BadgeDefinition) => {
        if (def.type.includes("explore") || def.type.includes("first_visit")) return "places visited";
        if (def.type.includes("neighborhood")) return "neighborhoods explored";
        if (def.type.includes("friend")) return "friends added";
        if (def.type.includes("rec")) return "recommendations sent";
        if (def.type.includes("save")) return "places saved";
        if (def.type === "all_intents") return "unique intents";
        if (def.type.includes("streak")) return "day current streak";
        return "";
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-lg font-bold text-[#0E1116] dark:text-[#e8edf4]">Badges</h3>
                <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                    {totalEarned} / {badges.length} earned
                </span>
            </div>

            <div className="relative">
                <div
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeaveOrUp}
                    onMouseUp={handleMouseLeaveOrUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={handleMouseLeaveOrUp}
                    onTouchMove={handleMouseMove}
                    className={`flex items-center gap-3 overflow-x-auto px-4 pb-4 hide-scrollbar select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                >
                    {badges.map(b => (
                        <div key={b.def.type} className="relative flex flex-col items-center shrink-0 mt-2">
                            <button
                                onClick={() => handleBadgeClick(b.def.type)}
                                className={`flex items-center justify-center rounded-full text-2xl transition-all relative w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-[#1E2530]
                                    ${b.earned
                                        ? "opacity-100 border-2 border-[#E85D2A] shadow-[0_0_8px_rgba(232,93,42,0.3)]"
                                        : "opacity-30 border-none"
                                    }`}
                            >
                                <span className="transform -translate-y-[1px]">{b.def.icon}</span>
                                {!b.earned && (
                                    <div className="absolute right-0 bottom-0 translate-x-1 translate-y-1 w-4 h-4 rounded-full bg-gray-200 dark:bg-[#0E1116] flex items-center justify-center ring-2 ring-white dark:ring-[#0E1116]">
                                        <span className="text-[10px]">🔒</span>
                                    </div>
                                )}
                            </button>

                            <AnimatePresence>
                                {selectedBadge === b.def.type && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-[60] w-64 p-4 rounded-2xl bg-white dark:bg-[#1C2128] border border-gray-100 dark:border-white/10 shadow-xl pointer-events-none"
                                    >
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#1C2128] border-t border-l border-gray-100 dark:border-white/10 rotate-45" />
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <div className="text-3xl mb-1">{b.def.icon}</div>
                                            <h4 className="font-semibold text-[#0E1116] dark:text-[#e8edf4] text-base">{b.def.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{b.def.description}</p>

                                            <div className="mt-3 text-xs font-semibold">
                                                {b.earned ? (
                                                    <span className="text-green-600 dark:text-green-500">
                                                        Earned {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(b.earnedAt!))}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">
                                                        {Math.min(b.currentProgress, b.def.requirement)} / {b.def.requirement} {getProgressLabel(b.def)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
