"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

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

function MiniAvatar({ src, name, color }: { src: string | null; name: string | null; color: string }) {
    const borderClass = color === "orange" ? "border-[#E85D2A]" : "border-[#3B82F6]";
    const bgClass = color === "orange" ? "bg-[#E85D2A]/20 text-[#E85D2A]" : "bg-[#3B82F6]/20 text-[#3B82F6]";
    return (
        <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${borderClass} shrink-0 relative`}>
            {src ? (
                <Image src={src} alt={name ?? ""} fill className="object-cover" unoptimized />
            ) : (
                <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${bgClass}`}>
                    {name?.[0]?.toUpperCase() ?? "?"}
                </div>
            )}
        </div>
    );
}

function SmallAvatar({ src, name }: { src: string | null; name: string | null }) {
    return (
        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 relative">
            {src ? (
                <Image src={src} alt={name ?? ""} fill className="object-cover" unoptimized />
            ) : (
                <div className="w-full h-full bg-[#30363D] flex items-center justify-center text-[10px] font-bold text-[#8B949E]">
                    {name?.[0]?.toUpperCase() ?? "?"}
                </div>
            )}
        </div>
    );
}

export function FriendCompareModal({ data, onClose }: FriendCompareModalProps) {
    const [selectedArea, setSelectedArea] = useState<string>("All");

    const ALL_AREAS = ["All", "Downtown", "West End", "East End", "Midtown", "North York", "Scarborough", "Etobicoke"];

    const totalNeighborhoods = data.user.neighborhoods.length;
    const friendFirstName = data.friend.name?.split(" ")[0] || "Friend";

    const combinedList = useMemo(() => {
        return data.user.neighborhoods.map((un, index) => {
            const fn = data.friend.neighborhoods[index];
            let status = 0;
            if (un.explored && fn.explored) status = 3;
            else if (un.explored && !fn.explored) status = 2;
            else if (!un.explored && fn.explored) status = 1;
            return { name: un.name, area: un.area, status, userVisits: un.visitCount, friendVisits: fn.visitCount };
        }).sort((a, b) => b.status - a.status);
    }, [data]);

    const filteredList = selectedArea === "All"
        ? combinedList
        : combinedList.filter(n => n.area === selectedArea);

    // Drag-to-scroll for area chips
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const lastClientX = useRef(0);
    const lastTimestamp = useRef(0);
    const velocity = useRef(0);
    const rafId = useRef<number | null>(null);
    const isDragPreventClick = useRef(false);

    useEffect(() => {
        return () => { if (rafId.current !== null) cancelAnimationFrame(rafId.current); };
    }, []);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        isDragPreventClick.current = false;
        if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null; }
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
        const friction = 0.95;
        const tick = () => {
            if (!scrollRef.current || Math.abs(velocity.current) < 0.1) { rafId.current = null; return; }
            scrollRef.current.scrollLeft -= velocity.current * 16;
            velocity.current *= friction;
            rafId.current = requestAnimationFrame(tick);
        };
        rafId.current = requestAnimationFrame(tick);
    };

    const handleMouseLeaveOrUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (Math.abs(velocity.current) > 0.1) applyMomentum();
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !scrollRef.current) return;
        if (e.cancelable) e.preventDefault();
        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - scrollRef.current.offsetLeft;
        const walk = x - startX.current;
        if (Math.abs(walk) > 5) isDragPreventClick.current = true;
        const now = performance.now();
        const dt = now - lastTimestamp.current;
        if (dt > 0) velocity.current = (pageX - lastClientX.current) / dt;
        lastClientX.current = pageX;
        lastTimestamp.current = now;
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const handleChipClick = (area: string) => {
        if (isDragPreventClick.current) return;
        setSelectedArea(area);
    };

    // Competitive nudge
    let ctaTitle = "";
    let ctaDesc = "";
    if (data.user.totalExplored > data.friend.totalExplored) {
        ctaTitle = "You're in the lead!";
        ctaDesc = "Keep exploring to maintain your crown.";
    } else if (data.friend.totalExplored > data.user.totalExplored) {
        ctaTitle = "They're ahead!";
        ctaDesc = `Explore somewhere new to catch up to ${friendFirstName}!`;
    } else {
        ctaTitle = "You're neck and neck!";
        ctaDesc = "Who'll break the tie first?";
    }

    // Shared content sections
    const VSHeader = (
        <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
                <MiniAvatar src={data.user.avatarUrl} name={data.user.name} color="orange" />
                <span className="text-xs font-semibold text-[#C9D1D9]">You</span>
            </div>
            <span className="text-xs font-bold text-[#8B949E]">vs</span>
            <div className="flex flex-col items-center gap-1">
                <MiniAvatar src={data.friend.avatarUrl} name={data.friend.name} color="blue" />
                <span className="text-xs font-semibold text-[#C9D1D9]">{friendFirstName}</span>
            </div>
        </div>
    );

    const StatCards = (
        <div className="grid grid-cols-2 gap-3">
            {/* User stat */}
            <div className="bg-[#1C2128] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <SmallAvatar src={data.user.avatarUrl} name={data.user.name} />
                    <span className="text-xs font-medium text-[#8B949E]">You</span>
                </div>
                <p className="text-2xl font-bold text-[#E85D2A] mb-1">{data.user.totalExplored}</p>
                <p className="text-xs text-[#8B949E] mb-3">Neighborhoods</p>
                <div className="w-full h-1.5 rounded-full bg-[#30363D]">
                    <div className="h-full rounded-full bg-[#E85D2A] transition-all duration-500" style={{ width: `${data.user.percentage}%` }} />
                </div>
                <p className="text-[10px] text-[#8B949E] mt-1">{data.user.percentage}% of {totalNeighborhoods}</p>
            </div>
            {/* Friend stat */}
            <div className="bg-[#1C2128] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <SmallAvatar src={data.friend.avatarUrl} name={data.friend.name} />
                    <span className="text-xs font-medium text-[#8B949E]">{friendFirstName}</span>
                </div>
                <p className="text-2xl font-bold text-[#3B82F6] mb-1">{data.friend.totalExplored}</p>
                <p className="text-xs text-[#8B949E] mb-3">Neighborhoods</p>
                <div className="w-full h-1.5 rounded-full bg-[#30363D]">
                    <div className="h-full rounded-full bg-[#3B82F6] transition-all duration-500" style={{ width: `${data.friend.percentage}%` }} />
                </div>
                <p className="text-[10px] text-[#8B949E] mt-1">{data.friend.percentage}% of {totalNeighborhoods}</p>
            </div>
        </div>
    );

    const OverlapSummary = (
        <div className="bg-[#1C2128] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-3">Exploration Overlap</h3>
            <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E85D2A] to-[#3B82F6] shrink-0" />
                    <span className="flex-1 text-sm text-[#C9D1D9]">Both Explored</span>
                    <span className="text-sm font-bold text-white">{data.shared}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#E85D2A] shrink-0" />
                    <span className="flex-1 text-sm text-[#C9D1D9]">Only You</span>
                    <span className="text-sm font-bold text-[#E85D2A]">{data.onlyUser}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#3B82F6] shrink-0" />
                    <span className="flex-1 text-sm text-[#C9D1D9]">Only {friendFirstName}</span>
                    <span className="text-sm font-bold text-[#3B82F6]">{data.onlyFriend}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#8B949E] shrink-0" />
                    <span className="flex-1 text-sm text-[#C9D1D9]">Neither</span>
                    <span className="text-sm font-bold text-[#8B949E]">{data.neither}</span>
                </div>
            </div>
        </div>
    );

    const NudgeCard = (
        <div className="bg-[#E85D2A]/10 border border-[#E85D2A]/20 rounded-xl p-3">
            <p className="text-sm font-bold text-[#E85D2A] mb-0.5">{ctaTitle}</p>
            <p className="text-xs text-[#8B949E] mb-2">{ctaDesc}</p>
            <Link
                href="/"
                onClick={onClose}
                className="inline-flex px-4 py-2 bg-[#E85D2A] hover:bg-[#D14E1F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
                Explore
            </Link>
        </div>
    );

    const AreaChips = (
        <div
            ref={scrollRef}
            className={`flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedArea === area
                        ? "bg-[#E85D2A] text-white"
                        : "bg-[#1C2128] text-[#8B949E] border border-[#30363D] hover:border-[#E85D2A]"
                        }`}
                >
                    {area}
                </button>
            ))}
        </div>
    );

    const NeighborhoodLegend = (
        <div className="flex items-center gap-4 text-xs text-[#8B949E] mb-2">
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#E85D2A]" />
                <span>You</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                <span>{friendFirstName}</span>
            </div>
        </div>
    );

    const NeighborhoodList = (
        <div className="space-y-2">
            {filteredList.map(n => (
                <div key={n.name} className="flex items-center justify-between bg-[#1C2128] rounded-xl p-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{n.name}</p>
                        <p className="text-xs text-[#8B949E]">{n.area}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* User dot */}
                        <div className={`w-3 h-3 rounded-full ${n.status === 3 || n.status === 2
                            ? "bg-[#E85D2A]"
                            : "bg-transparent border border-[#E85D2A]"
                            }`} />
                        {/* Friend dot */}
                        <div className={`w-3 h-3 rounded-full ${n.status === 3 || n.status === 1
                            ? "bg-[#3B82F6]"
                            : "bg-transparent border border-[#3B82F6]"
                            }`} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-[95%] max-w-[860px] max-h-[85vh] bg-white/[0.65] dark:bg-white/[0.05] rounded-2xl border border-black/[0.08] dark:border-white/[0.15] shadow-2xl relative overflow-hidden flex flex-col"
                    style={{
                        backdropFilter: "blur(64px) saturate(180%)",
                        WebkitBackdropFilter: "blur(64px) saturate(180%)",
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-[#8B949E] hover:text-white transition-colors duration-200 cursor-pointer z-10"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>

                    {/* Title */}
                    <div className="p-6 pb-0">
                        <h2 className="text-lg font-bold text-[#e8edf4] text-center">Exploration Comparison</h2>
                    </div>

                    {/* ── DESKTOP: Two columns ── */}
                    <div className="hidden lg:flex flex-1 min-h-0">
                        {/* Left column — sticky info */}
                        <div className="w-[320px] shrink-0 border-r border-[#30363D] p-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-5">
                            {VSHeader}
                            {StatCards}
                            {OverlapSummary}
                            {NudgeCard}
                        </div>

                        {/* Right column — scrollable neighborhoods */}
                        <div className="flex-1 p-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {AreaChips}
                            <div className="mt-4">
                                {NeighborhoodLegend}
                                {NeighborhoodList}
                            </div>
                        </div>
                    </div>

                    {/* ── MOBILE: Single scrollable column ── */}
                    <div className="lg:hidden flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-6 pt-4 space-y-5">
                        {VSHeader}
                        {StatCards}
                        {OverlapSummary}
                        {AreaChips}
                        <div>
                            {NeighborhoodLegend}
                            {NeighborhoodList}
                        </div>
                        {NudgeCard}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
