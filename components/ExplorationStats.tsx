"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Lock, Map as MapIcon, ChevronDown, CheckCircle2 } from "lucide-react";

interface NeighborhoodStat {
    name: string;
    area: string;
    explored: boolean;
    visitCount: number;
    uniquePlaceCount: number;
    firstVisitDate: string | null;
}

interface ExplorationData {
    totalNeighborhoods: number;
    exploredCount: number;
    percentage: number;
    neighborhoods: NeighborhoodStat[];
}

export default function ExplorationStats() {
    const [data, setData] = useState<ExplorationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [selectedArea, setSelectedArea] = useState<string>("All Toronto");

    const AREAS = ["All Toronto", "Downtown", "West End", "East End", "Midtown", "North York", "Scarborough", "Etobicoke"];

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/exploration-stats");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error("Failed to fetch exploration stats", e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-32 flex items-center justify-center animate-pulse bg-[var(--color-surface-card)] rounded-2xl">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--color-navy)] border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const filteredNeighborhoods = data.neighborhoods.filter(
        (n) => selectedArea === "All Toronto" || n.area === selectedArea
    );

    const filteredTotal = filteredNeighborhoods.length;
    const filteredExploredCount = filteredNeighborhoods.filter(n => n.explored).length;
    const filteredPercentage = filteredTotal > 0 ? Math.round((filteredExploredCount / filteredTotal) * 100) : 0;

    // Sort neighborhoods: Explored first, then alphabetically
    const sortedNeighborhoods = [...filteredNeighborhoods].sort((a, b) => {
        if (a.explored && !b.explored) return -1;
        if (!a.explored && b.explored) return 1;
        return a.name.localeCompare(b.name);
    });

    // Recent discoveries
    const recentDiscoveries = filteredNeighborhoods
        .filter((n) => n.explored && n.firstVisitDate)
        .sort((a, b) => new Date(b.firstVisitDate!).getTime() - new Date(a.firstVisitDate!).getTime())
        .slice(0, 3);

    return (
        <div className="w-full bg-[var(--color-surface-card)] rounded-2xl p-5 border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Exploration</h2>
                <Link
                    href="/map"
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    View Map <MapIcon className="w-4 h-4" />
                </Link>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
                <div className="flex items-end justify-between mb-2">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                        {filteredPercentage}% of {selectedArea} Explored
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {filteredExploredCount} / {filteredTotal} neighborhoods
                    </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-[#161B22] rounded-full overflow-hidden shadow-inner flex mb-6">
                    <motion.div
                        key={selectedArea}
                        initial={{ width: 0 }}
                        animate={{ width: `${filteredPercentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-[#E85D2A] rounded-full"
                    />
                </div>
            </div>

            {/* Expand Toggle */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between py-2.5 px-4 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 rounded-xl transition-colors text-sm font-medium text-[var(--foreground)] border border-gray-100 dark:border-white/5 cursor-pointer"
            >
                <span>{expanded ? "Hide Details" : "See Details"}</span>
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 pb-2 space-y-6">
                            {/* Area Selector */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                {AREAS.map(area => (
                                    <button
                                        key={area}
                                        onClick={() => setSelectedArea(area)}
                                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors snap-start ${selectedArea === area
                                                ? "bg-[#E85D2A] text-white border border-[#E85D2A]"
                                                : "bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                                            }`}
                                    >
                                        {area}
                                    </button>
                                ))}
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {sortedNeighborhoods.map((hood) => (
                                    <div
                                        key={hood.name}
                                        className={`p-3 rounded-xl border transition-all ${hood.explored
                                            ? "bg-white dark:bg-[#161B22] border-gray-200 dark:border-white/10 shadow-sm"
                                            : "bg-gray-50 dark:bg-white/5 border-transparent opacity-60"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-1.5">
                                            <h3 className="font-semibold text-sm text-[var(--foreground)] truncate pr-2" title={hood.name}>
                                                {hood.name}
                                            </h3>
                                            {hood.explored ? (
                                                <CheckCircle2 className="w-4 h-4 text-[#E85D2A] shrink-0 mt-0.5" />
                                            ) : (
                                                <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                            )}
                                        </div>

                                        <div className="text-[11px] font-medium">
                                            {hood.explored ? (
                                                <div className="flex flex-col gap-0.5 mt-2">
                                                    <span className="text-gray-900 dark:text-gray-200">Explored ✓</span>
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {hood.uniquePlaceCount} {hood.uniquePlaceCount === 1 ? "place" : "places"} visited
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 dark:text-gray-400 mt-2">Undiscovered</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Discoveries */}
                            {recentDiscoveries.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                                        Recent Discoveries
                                    </h3>
                                    <div className="space-y-2.5">
                                        {recentDiscoveries.map((hood) => {
                                            const d = new Date(hood.firstVisitDate!);
                                            const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                            return (
                                                <div key={hood.name} className="flex items-center gap-3 p-3 bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                                                    <div className="text-lg shrink-0">🎉</div>
                                                    <div className="text-sm text-[var(--foreground)]">
                                                        You discovered <span className="font-semibold">{hood.name}</span>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{dateStr}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
