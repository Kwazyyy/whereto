"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBadges } from "@/components/providers/BadgeProvider";

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
    const [hasDragged, setHasDragged] = useState(false);
    const { triggerBadgeCheck } = useBadges();

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
        const fetchBadges = async () => {
            try {
                const res = await fetch("/api/badges");
                const data: { earned: EarnedBadge[], definitions: BadgeDefinition[], progress: BadgeProgress } = await res.json();

                console.log("Fetched badges progress:", data.progress);

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
                        case "saves_10":
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
            } catch (e) {
                console.error(e);
            }
        };

        const executeMountValidation = async () => {
            await fetchBadges();
            setLoading(false);

            // Check implicitly for badges after render to capture trailing progress like "first save"
            const newEarned = await triggerBadgeCheck();
            if (newEarned) {
                // If the check pops new ones, quietly refetch the array silently so it updates visually
                fetchBadges();
            }
        };

        executeMountValidation();

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
        setHasDragged(false);
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
        const dx = x - startX;
        const walk = dx * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;

        // Increase threshold to 5 actual pixels to prevent trackpad jitters from blocking clicks
        if (Math.abs(dx) > 5) {
            isDragClickRef.current = true;
            setHasDragged(true);
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

    const selectedBadgeData = badges.find(b => b.def.type === selectedBadge);

    if (loading || badges.length === 0) return null;

    // get descriptive label based on def type
    const getProgressLabel = (def: BadgeDefinition) => {
        if (def.type.includes("explore") || def.type.includes("first_visit")) return "places visited";
        if (def.type.includes("neighborhood")) return "neighborhoods explored";
        if (def.type.includes("friend")) return "friends";
        if (def.type.includes("rec")) return "recommendations sent";
        if (def.type.includes("save")) return "places saved";
        if (def.type === "all_intents") return "intent categories";
        if (def.type.includes("streak")) return "day streak";
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
                        <div
                            key={b.def.type}
                            onClick={() => { if (!hasDragged) setSelectedBadge(b.def.type) }}
                            className="cursor-pointer relative flex flex-col items-center shrink-0 mt-2"
                        >
                            <div
                                className={`flex items-center justify-center rounded-full text-2xl transition-all relative w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-[#1E2530]
                                    ${b.earned
                                        ? "opacity-100 border-2 border-[#E85D2A] shadow-[0_0_8px_rgba(232,93,42,0.3)]"
                                        : "opacity-40 border border-gray-300 dark:border-gray-700"
                                    }`}
                            >
                                <span className="transform -translate-y-[1px]">{b.def.icon}</span>
                                {!b.earned && (
                                    <div className="absolute right-0 bottom-0 translate-x-1 translate-y-1 w-5 h-5 rounded-full bg-gray-200 dark:bg-[#1E2530] flex items-center justify-center ring-2 ring-white dark:ring-[#0E1116] pointer-events-none">
                                        <span className="text-[11px] transform -translate-y-[0.5px]">🔒</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedBadgeData && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBadge(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full sm:w-96 bg-white dark:bg-[#1C2128] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
                        >
                            <div className="p-6 flex flex-col items-center text-center">
                                <button
                                    onClick={() => setSelectedBadge(null)}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                >
                                    ✕
                                </button>

                                <div className={`text-6xl mb-4 ${!selectedBadgeData.earned ? 'opacity-40 grayscale' : ''}`}>
                                    {selectedBadgeData.def.icon}
                                </div>
                                <h4 className="font-bold text-[#0E1116] dark:text-[#e8edf4] text-xl mb-2">{selectedBadgeData.def.name}</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{selectedBadgeData.def.description}</p>

                                <div className="w-full bg-gray-50 dark:bg-[#0E1116] rounded-2xl p-4">
                                    {selectedBadgeData.earned ? (
                                        <div className="text-sm font-bold text-green-600 dark:text-green-500">
                                            Earned {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(selectedBadgeData.earnedAt!))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center w-full gap-2">
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                                {Math.min(selectedBadgeData.currentProgress, selectedBadgeData.def.requirement)} / {selectedBadgeData.def.requirement} {getProgressLabel(selectedBadgeData.def)}
                                            </span>
                                            <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#E85D2A] rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min((selectedBadgeData.currentProgress / selectedBadgeData.def.requirement) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-400 dark:text-gray-600 font-bold uppercase tracking-wider mt-1">Not yet earned</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
