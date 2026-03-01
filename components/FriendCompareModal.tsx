"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Map, ShieldAlert } from "lucide-react";

interface NeighborhoodStat {
    name: string;
    area: string;
    explored: boolean;
    visitCount: number;
}

export interface CompareData {
    user: {
        name: string | null;
        avatarUrl: string | null;
        visitCount: number;
        neighborhoods: NeighborhoodStat[];
        totalExplored: number;
        percentage: number;
    };
    friend: {
        name: string | null;
        avatarUrl: string | null;
        visitCount: number;
        neighborhoods: NeighborhoodStat[];
        totalExplored: number;
        percentage: number;
    };
    shared: number;
    onlyUser: number;
    onlyFriend: number;
    neither: number;
}

interface FriendCompareModalProps {
    data: CompareData;
    onClose: () => void;
}

export function FriendCompareModal({ data, onClose }: FriendCompareModalProps) {
    const [selectedArea, setSelectedArea] = useState<string>("All");

    const ALL_AREAS = ["All", "Downtown", "West End", "East End", "Midtown", "North York", "Scarborough", "Etobicoke"];

    const getInitials = (name?: string | null) => name ? name.charAt(0).toUpperCase() : "?";

    // Combine lists structurally to sort
    const combinedList = useMemo(() => {
        return data.user.neighborhoods.map((un, index) => {
            const fn = data.friend.neighborhoods[index];
            let status = 0; // 0 = Neither, 1 = Only Friend, 2 = Only User, 3 = Both
            if (un.explored && fn.explored) status = 3;
            else if (un.explored && !fn.explored) status = 2;
            else if (!un.explored && fn.explored) status = 1;

            return {
                name: un.name,
                area: un.area,
                status,
                userVisits: un.visitCount,
                friendVisits: fn.visitCount
            };
        }).sort((a, b) => b.status - a.status);
    }, [data]);

    const filteredList = selectedArea === "All"
        ? combinedList
        : combinedList.filter(n => n.area === selectedArea);

    // Drag to scroll refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isCoasting, setIsCoasting] = useState(false);

    // Physics simulation refs
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const lastClientX = useRef(0);
    const lastTimestamp = useRef(0);
    const velocity = useRef(0);
    const rafId = useRef<number | null>(null);
    const isDragPreventClick = useRef(false);

    // Cleanup animation frames
    useEffect(() => {
        return () => {
            if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        };
    }, []);

    // Handlers
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        setIsCoasting(false);
        isDragPreventClick.current = false;

        if (rafId.current !== null) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }

        if (!scrollRef.current) return;
        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        startX.current = pageX - scrollRef.current.offsetLeft;
        scrollLeft.current = scrollRef.current.scrollLeft;

        lastClientX.current = pageX;
        lastTimestamp.current = performance.now();
        velocity.current = 0;
    };

    const applyMomentum = () => {
        if (!scrollRef.current) return;

        setIsCoasting(true);
        const friction = 0.95; // Deceleration rate

        const tick = () => {
            if (!scrollRef.current || Math.abs(velocity.current) < 0.1) {
                setIsCoasting(false);
                rafId.current = null;
                return;
            }

            scrollRef.current.scrollLeft -= velocity.current * 16;
            velocity.current *= friction;

            rafId.current = requestAnimationFrame(tick);
        };

        rafId.current = requestAnimationFrame(tick);
    };

    const handleMouseLeaveOrUp = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Coast if there's enough velocity
        if (Math.abs(velocity.current) > 0.1) {
            applyMomentum();
        }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !scrollRef.current) return;

        // Prevent accidental text selection and standard mouse behaviors during drag
        if (e.cancelable) e.preventDefault();

        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - scrollRef.current.offsetLeft;
        const walk = x - startX.current;

        if (Math.abs(walk) > 5) {
            isDragPreventClick.current = true;
        }

        const now = performance.now();
        const dt = now - lastTimestamp.current;
        if (dt > 0) {
            const dx = pageX - lastClientX.current;
            velocity.current = dx / dt; // px per ms
        }

        lastClientX.current = pageX;
        lastTimestamp.current = now;

        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const handleChipClick = (area: string) => {
        if (isDragPreventClick.current) return;
        setSelectedArea(area);
    };

    // Determine Message
    let ctaTitle = "";
    let ctaDesc = "";
    if (data.user.totalExplored > data.friend.totalExplored) {
        ctaTitle = "You're in the lead! 👑";
        ctaDesc = "Keep exploring to maintain your crown.";
    } else if (data.friend.totalExplored > data.user.totalExplored) {
        ctaTitle = "They're ahead!";
        ctaDesc = `Explore somewhere new to catch up to ${data.friend.name?.split(' ')[0] || 'them'}!`;
    } else {
        ctaTitle = "You're neck and neck! ⚔️";
        ctaDesc = "Who'll break the tie first?";
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[300] bg-gray-50 dark:bg-[#0E1116] flex flex-col overflow-hidden"
            >
                {/* Header Navbar */}
                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#161B22] border-b border-gray-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </button>
                    <h2 className="font-bold text-[#0E1116] dark:text-[#e8edf4]">Exploration Comparison</h2>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar pb-28">
                    {/* Avatars Hero */}
                    <div className="flex items-center justify-center gap-6 py-10 bg-white dark:bg-[#161B22]">
                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#E85D2A] z-10 shadow-lg shadow-[#E85D2A]/20">
                                {data.user.avatarUrl ? (
                                    <Image src={data.user.avatarUrl} alt="You" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#E85D2A]/20 flex items-center justify-center text-2xl font-bold text-[#E85D2A]">
                                        {getInitials(data.user.name)}
                                    </div>
                                )}
                            </div>
                            <span className="mt-3 font-semibold text-gray-800 dark:text-gray-200">You</span>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm font-black text-gray-400 z-0">
                            VS
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#3B82F6] z-10 shadow-lg shadow-[#3B82F6]/20">
                                {data.friend.avatarUrl ? (
                                    <Image src={data.friend.avatarUrl} alt={data.friend.name || "Friend"} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#3B82F6]/20 flex items-center justify-center text-2xl font-bold text-[#3B82F6]">
                                        {getInitials(data.friend.name)}
                                    </div>
                                )}
                            </div>
                            <span className="mt-3 font-semibold text-gray-800 dark:text-gray-200">
                                {data.friend.name?.split(" ")[0] || "Friend"}
                            </span>
                        </div>
                    </div>

                    <div className="px-4 py-6 max-w-lg mx-auto w-full space-y-6">

                        {/* High Level Stats grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* User Stats Card */}
                            <div className="bg-white dark:bg-[#161B22] p-5 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
                                <div className="text-4xl font-black text-[#E85D2A] mb-1">{data.user.totalExplored}</div>
                                <p className="text-sm font-medium text-gray-500 mb-4 tracking-tight leading-tight">Neighborhoods<br />Explored</p>
                                <div className="w-16 h-16 rounded-full relative flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90 absolute">
                                        <circle cx="32" cy="32" r="28" fill="none" className="stroke-gray-100 dark:stroke-white/5" strokeWidth="6" />
                                        <motion.circle
                                            cx="32" cy="32" r="28" fill="none" className="stroke-[#E85D2A]" strokeWidth="6"
                                            strokeDasharray="176"
                                            initial={{ strokeDashoffset: 176 }}
                                            animate={{ strokeDashoffset: 176 - (176 * data.user.percentage) / 100 }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </svg>
                                    <span className="font-bold text-sm text-[#0E1116] dark:text-white">{data.user.percentage}%</span>
                                </div>
                            </div>

                            {/* Friend Stats Card */}
                            <div className="bg-white dark:bg-[#161B22] p-5 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="text-4xl font-black text-[#3B82F6] mb-1">{data.friend.totalExplored}</div>
                                <p className="text-sm font-medium text-gray-500 mb-4 tracking-tight leading-tight">Neighborhoods<br />Explored</p>
                                <div className="w-16 h-16 rounded-full relative flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90 absolute">
                                        <circle cx="32" cy="32" r="28" fill="none" className="stroke-gray-100 dark:stroke-white/5" strokeWidth="6" />
                                        <motion.circle
                                            cx="32" cy="32" r="28" fill="none" className="stroke-[#3B82F6]" strokeWidth="6"
                                            strokeDasharray="176"
                                            initial={{ strokeDashoffset: 176 }}
                                            animate={{ strokeDashoffset: 176 - (176 * data.friend.percentage) / 100 }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </svg>
                                    <span className="font-bold text-sm text-[#0E1116] dark:text-white">{data.friend.percentage}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Shared / Unique Summary Block */}
                        <div className="bg-white dark:bg-[#1C2128] rounded-3xl p-5 border border-gray-100 dark:border-white/5">
                            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Exploration Overlap</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 flex items-center justify-center text-sm">🤝</div>
                                    <div className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Both Explored</div>
                                    <div className="font-black text-white px-2.5 py-1 bg-gray-200 dark:bg-white/10 rounded-lg text-sm">{data.shared}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#E85D2A]/20">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#E85D2A]" />
                                    </div>
                                    <div className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Only You</div>
                                    <div className="font-black text-[#E85D2A] px-2.5 py-1 bg-[#E85D2A]/10 rounded-lg text-sm">{data.onlyUser}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#3B82F6]/20">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                                    </div>
                                    <div className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Only {data.friend.name?.split(" ")[0]}</div>
                                    <div className="font-black text-[#3B82F6] px-2.5 py-1 bg-[#3B82F6]/10 rounded-lg text-sm">{data.onlyFriend}</div>
                                </div>
                                <div className="flex items-center gap-3 opacity-60">
                                    <div className="w-5 h-5 flex items-center justify-center text-sm text-gray-400"><ShieldAlert className="w-4 h-4" /></div>
                                    <div className="flex-1 text-sm font-semibold text-gray-500">Neither</div>
                                    <div className="font-black text-gray-500 px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-sm">{data.neither}</div>
                                </div>
                            </div>
                        </div>

                        {/* Neighborhood Breakdown List */}
                        <div>
                            <style>{`
                                .hide-scrollbar::-webkit-scrollbar { display: none; }
                                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                            `}</style>
                            <div
                                ref={scrollRef}
                                className={`flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 mt-8 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                onMouseDown={handleMouseDown}
                                onMouseLeave={handleMouseLeaveOrUp}
                                onMouseUp={handleMouseLeaveOrUp}
                                onMouseMove={handleMouseMove}
                                onTouchStart={handleMouseDown}
                                onTouchEnd={handleMouseLeaveOrUp}
                                onTouchMove={handleMouseMove}
                            >
                                {ALL_AREAS.map(area => (
                                    <button
                                        key={area}
                                        onClick={() => handleChipClick(area)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedArea === area
                                            ? "bg-[#0E1116] dark:bg-white text-white dark:text-[#0E1116]"
                                            : "bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10"
                                            }`}
                                    >
                                        {area}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-2 space-y-2">
                                {filteredList.map(n => (
                                    <div key={n.name} className="flex items-center justify-between p-4 bg-white dark:bg-[#161B22] rounded-2xl border border-gray-100 dark:border-white/5">
                                        <div>
                                            <p className="font-bold text-[#0E1116] dark:text-[#e8edf4]">{n.name}</p>
                                            <p className="text-[11px] text-gray-500 font-medium">{n.area}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* User Dot */}
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-gray-100 dark:border-white/10 relative">
                                                {n.status === 3 || n.status === 2 ? (
                                                    <div className="absolute inset-0 bg-[#E85D2A] rounded-full" />
                                                ) : <span className="opacity-0">-</span>}
                                            </div>
                                            {/* Friend Dot */}
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-gray-100 dark:border-white/10 relative">
                                                {n.status === 3 || n.status === 1 ? (
                                                    <div className="absolute inset-0 bg-[#3B82F6] rounded-full" />
                                                ) : <span className="opacity-0">-</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Bottom spacing */}
                        <div className="h-16" />
                    </div>
                </div>

                {/* Floating Bottom CTA */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0E1116] dark:via-[#0E1116]">
                    <div className="max-w-md mx-auto bg-[#0E1116] dark:bg-white rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-white dark:text-[#0E1116]">{ctaTitle}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{ctaDesc}</p>
                        </div>
                        <Link
                            href="/discover"
                            onClick={onClose}
                            className="shrink-0 px-6 py-3 bg-[#E85D2A] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#E85D2A]/20"
                        >
                            Explore →
                        </Link>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
