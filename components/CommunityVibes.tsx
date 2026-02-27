"use client";

import { useEffect, useState } from "react";

interface Vibe {
    tag: string;
    emoji: string;
    count: number;
    percentage: number;
}

interface CommunityVibesProps {
    placeId: string;
    limit?: number;
}

export default function CommunityVibes({ placeId, limit = 5 }: CommunityVibesProps) {
    const [vibes, setVibes] = useState<Vibe[]>([]);
    const [totalVoters, setTotalVoters] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetch(`/api/vibe-votes?placeId=${placeId}`)
            .then(res => res.json())
            .then(data => {
                if (mounted && data.vibes) {
                    setVibes(data.vibes.slice(0, limit));
                    setTotalVoters(data.totalVoters);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [placeId, limit]);

    if (loading || vibes.length === 0) return null;

    return (
        <div className="mt-5">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Community Vibes
                <span className="text-[10px] font-medium lowercase tracking-normal ml-2 opacity-70">
                    based on {totalVoters} visit{totalVoters !== 1 ? 's' : ''}
                </span>
            </h3>
            <div className="flex flex-wrap gap-2">
                {vibes.map(v => (
                    <div
                        key={v.tag}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300"
                    >
                        <span>{v.emoji}</span>
                        <span>{v.tag}</span>
                        <span className="text-[10px] opacity-50 ml-0.5">{v.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
