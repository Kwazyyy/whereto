"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface VisitStatsPlace {
    id: string;
    name: string;
    googlePlaceId: string;
    photoUrl: string | null;
}

interface MostVisited {
    place: VisitStatsPlace;
    visitCount: number;
    lastVisited: string;
}

interface Streak {
    place: { id: string; name: string; photoUrl: string | null };
    currentStreak: number;
    longestStreak: number;
    lastVisited: string;
}

interface VisitStats {
    mostVisited: MostVisited[];
    totalVisits: number;
    totalPlaces: number;
    streaks: Streak[];
    regularPlaces: MostVisited[];
}

export function VisitStatsSection() {
    const [stats, setStats] = useState<VisitStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/visits/stats")
            .then((r) => r.json())
            .then((data: VisitStats) => setStats(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div>
                <div className="flex items-center gap-2 px-1 mb-3">
                    <span className="text-base">🏠</span>
                    <h3 className="text-sm font-bold text-[#0E1116] dark:text-gray-200">My Regular Spots</h3>
                </div>
                <div className="flex gap-3 overflow-hidden">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="w-[120px] shrink-0">
                            <div className="w-[120px] h-[120px] rounded-lg bg-gray-100 dark:bg-[#1C2128] animate-pulse" />
                            <div className="mt-1.5 h-3 w-16 bg-gray-100 dark:bg-[#1C2128] rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const regularSpots = stats.mostVisited.filter((m) => m.visitCount >= 3);
    const hasStreaks = stats.streaks.length > 0;

    // Build a map of streaks by place id for cross-referencing
    const streakMap = new Map(stats.streaks.map((s) => [s.place.id, s]));

    return (
        <>
            {/* My Regular Spots */}
            <div>
                <div className="flex items-center gap-2 px-1 mb-3">
                    <span className="text-base">🏠</span>
                    <h3 className="text-sm font-bold text-[#0E1116] dark:text-gray-200">My Regular Spots</h3>
                    {regularSpots.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            {regularSpots.length}
                        </span>
                    )}
                </div>

                {regularSpots.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
                        Visit a place 3+ times to make it your regular!
                    </p>
                ) : (
                    <div
                        className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {stats.mostVisited.slice(0, 5).map((item) => {
                            const streak = streakMap.get(item.place.id);
                            return (
                                <Link
                                    key={item.place.id}
                                    href={`/places/${item.place.id}/photos`}
                                    className="shrink-0 snap-start block"
                                >
                                    <div className="relative w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-lg overflow-hidden bg-gray-100 dark:bg-[#161B22] group">
                                        {item.place.photoUrl ? (
                                            <Image
                                                src={item.place.photoUrl}
                                                alt={item.place.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="150px"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-[#1C2128] text-gray-400 text-2xl">
                                                🏠
                                            </div>
                                        )}
                                        {/* Visit count badge */}
                                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#E85D2A] flex items-center justify-center shadow-md">
                                            <span className="text-white text-[11px] font-bold">{item.visitCount}</span>
                                        </div>
                                    </div>
                                    <div className="mt-1.5 w-[120px] md:w-[150px]">
                                        <p className="text-xs font-medium text-[#0E1116] dark:text-gray-300 truncate">
                                            {item.place.name}
                                        </p>
                                        {streak && streak.currentStreak >= 2 && (
                                            <p className="text-[10px] text-[#E85D2A] font-semibold mt-0.5">
                                                🔥 {streak.currentStreak} week streak
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Active Streaks — only show if streaks exist */}
            {hasStreaks && (
                <div>
                    <div className="flex items-center gap-2 px-1 mb-3">
                        <span className="text-base">🔥</span>
                        <h3 className="text-sm font-bold text-[#0E1116] dark:text-gray-200">Active Streaks</h3>
                    </div>
                    <div
                        className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {stats.streaks.map((streak) => (
                            <div
                                key={streak.place.id}
                                className="shrink-0 snap-start flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/10 shadow-sm min-w-[220px]"
                            >
                                <div className="relative w-[52px] h-[52px] rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1C2128] shrink-0">
                                    {streak.place.photoUrl ? (
                                        <Image
                                            src={streak.place.photoUrl}
                                            alt={streak.place.name}
                                            fill
                                            className="object-cover"
                                            sizes="52px"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                                            🔥
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#0E1116] dark:text-[#e8edf4] truncate">
                                        {streak.place.name}
                                    </p>
                                    <p className="text-sm font-bold text-[#E85D2A] mt-0.5">
                                        🔥 {streak.currentStreak} weeks
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        Best: {streak.longestStreak} weeks
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
