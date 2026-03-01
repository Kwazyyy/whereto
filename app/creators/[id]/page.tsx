"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { SavedPlace } from "@/lib/saved-places";
import { motion } from "framer-motion";

const INTENT_LABELS: Record<string, string> = {
    study: "Study / Work",
    date: "Date / Chill",
    trending: "Trending Now",
    quiet: "Quiet Cafes",
    laptop: "Laptop-Friendly",
    group: "Group Hangouts",
    budget: "Budget Eats",
    coffee: "Coffee & Catch-Up",
    outdoor: "Outdoor / Patio",
};

function CreatorBoardCard({ intent, label, items, creatorName }: { intent: string, label: string, items: any[], creatorName: string }) {
    const previewItem = items[0];
    const photoUrl = usePhotoUrl(previewItem?.place?.photoUrl || previewItem?.place?.photoRef || null);

    return (
        <div className="w-40 md:w-48 h-52 shrink-0 bg-white dark:bg-[#161B22] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/10 relative group cursor-pointer snap-start">
            {photoUrl ? (
                <Image src={photoUrl} alt={label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-[#1C2128] text-gray-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-bold text-base text-white capitalize drop-shadow-md leading-tight">{label}</h3>
                <p className="text-[11px] text-gray-300 drop-shadow-md mt-1">{items.length} place{items.length !== 1 ? 's' : ''}</p>
            </div>
        </div>
    );
}

function RecentSaveCard({ save }: { save: any }) {
    const photoUrl = usePhotoUrl(save.place?.photoUrl || save.place?.photoRef || null);

    return (
        <div className="w-32 md:w-36 shrink-0 flex flex-col gap-2 relative snap-start">
            <div className="w-full aspect-square rounded-2xl overflow-hidden relative bg-gray-100 dark:bg-[#1C2128]">
                {photoUrl ? (
                    <Image src={photoUrl} alt={save.place?.name} fill className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-gray-300">📍</span></div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-bold text-white tracking-wider uppercase">
                    {save.intent || "Local"}
                </div>
            </div>
            <div className="px-1">
                <h3 className="font-bold text-xs text-[#0E1116] dark:text-[#e8edf4] line-clamp-1">{save.place?.name}</h3>
                <p className="text-[10px] text-gray-500 truncate">{save.place?.address}</p>
            </div>
        </div>
    );
}

export default function CreatorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : "";
    const { status } = useSession();

    const [loading, setLoading] = useState(true);
    const [creator, setCreator] = useState<any>(null);
    const [boards, setBoards] = useState<any[]>([]);
    const [recentSaves, setRecentSaves] = useState<any[]>([]);
    const [topVibes, setTopVibes] = useState<any[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/creators/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.creator) {
                    setCreator(data.creator);
                    setFollowerCount(data.creator.followers);
                    setIsFollowing(data.creator.isFollowing);
                    setBoards(data.boards || []);
                    setRecentSaves(data.recentSaves || []);
                    setTopVibes(data.topVibes || []);
                }
            })
            .finally(() => setLoading(false));
    }, [id, status]);

    const handleFollowToggle = async () => {
        if (status !== "authenticated") {
            alert("Sign in to follow creators.");
            return;
        }
        if (isFollowLoading) return;
        setIsFollowLoading(true);

        const method = isFollowing ? "DELETE" : "POST";
        try {
            const res = await fetch("/api/follow", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id })
            });
            if (res.ok) {
                const data = await res.json();
                setIsFollowing(!isFollowing);
                setFollowerCount(data.followerCount);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsFollowLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-dvh flex items-center justify-center dark:bg-[#0E1116]"><div className="w-8 h-8 border-3 border-[#E85D2A] border-t-transparent rounded-full animate-spin" /></div>;
    }

    if (!creator) {
        return <div className="min-h-dvh flex items-center justify-center p-5 text-center">Creator not found</div>;
    }

    return (
        <div className="min-h-dvh bg-gray-50/50 dark:bg-[#0E1116] pb-24 overflow-x-hidden">
            {/* Back Button Header */}
            <header className="px-5 py-4 sticky top-0 z-20 flex justify-between items-center bg-white/80 dark:bg-[#0E1116]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
                <button onClick={() => router.back()} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="text-xs font-bold tracking-widest uppercase text-gray-400">Creator Profile</div>
                <div className="w-10"></div>
            </header>

            {/* Hero Header */}
            <div className="bg-white dark:bg-[#0E1116] border-b border-gray-100 dark:border-white/5 pt-6 pb-8 px-5 flex flex-col items-center">
                <div className="relative mb-4">
                    {creator.image ? (
                        <Image src={creator.image} alt={creator.name} width={96} height={96} className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-white dark:ring-[#161B22]" unoptimized />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-[#E85D2A] text-white flex items-center justify-center text-4xl font-bold shadow-md">{creator.name?.[0] || "?"}</div>
                    )}
                    <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#E85D2A] rounded-full flex items-center justify-center border-2 border-white dark:border-[#0E1116] shadow-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                    <h1 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">{creator.name}</h1>
                </div>

                <div className="flex gap-4 items-center mt-3 mb-5 px-6">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-[#0E1116] dark:text-white leading-none">{followerCount}</span>
                        <span className="text-[11px] font-medium text-gray-500">Followers</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-[#0E1116] dark:text-white leading-none">{creator.savedCount}</span>
                        <span className="text-[11px] font-medium text-gray-500">Places Saved</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-[#0E1116] dark:text-white leading-none">{creator.visitedCount}</span>
                        <span className="text-[11px] font-medium text-gray-500">Visited</span>
                    </div>
                </div>

                {/* Bio */}
                {creator.creatorBio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm mb-6 leading-relaxed">
                        {creator.creatorBio}
                    </p>
                )}

                {/* Social Links */}
                <div className="flex gap-3 mb-6">
                    {creator.instagramHandle && (
                        <a href={`https://instagram.com/${creator.instagramHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center hover:bg-pink-200 transition-colors">
                            Insta
                        </a>
                    )}
                    {creator.tiktokHandle && (
                        <a href={`https://tiktok.com/${creator.tiktokHandle}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-black dark:bg-[#1C2128] text-white flex items-center justify-center hover:bg-gray-800 transition-colors">
                            TT
                        </a>
                    )}
                </div>

                {/* Follow Action */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollowToggle}
                    className={`w-full max-w-xs py-3.5 rounded-2xl font-bold text-sm transition-colors ${isFollowing
                        ? "bg-gray-100 dark:bg-[#1C2128] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10"
                        : "bg-[#E85D2A] text-white shadow-lg shadow-[#E85D2A]/30"}`}
                >
                    {isFollowLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </motion.button>
            </div>

            <div className="max-w-xl mx-auto flex flex-col gap-8 pt-8">

                {/* Top Vibes */}
                {topVibes.length > 0 && (
                    <div className="px-5">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Usually describes places as</h3>
                        <div className="flex flex-wrap gap-2">
                            {topVibes.map((v, i) => (
                                <div key={i} className="px-3 py-1.5 rounded-full bg-orange-50 dark:bg-[#E85D2A]/10 text-[#E85D2A] text-xs font-bold border border-orange-100 dark:border-[#E85D2A]/20">
                                    {v.emoji} {v.tag}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Boards Carousel */}
                {boards.length > 0 && (
                    <div>
                        <div className="px-5 mb-3 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">{creator.name.split(' ')[0]}&apos;s Picks</h3>
                        </div>
                        <div className="flex overflow-x-auto gap-4 px-5 pb-4 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {boards.map(b => (
                                <CreatorBoardCard key={b.intent} intent={b.intent} label={INTENT_LABELS[b.intent] || b.intent} items={b.items} creatorName={creator.name} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Saves */}
                {recentSaves.length > 0 && (
                    <div>
                        <div className="px-5 mb-3">
                            <h3 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Recent Saves</h3>
                        </div>
                        <div className="flex overflow-x-auto gap-4 px-5 pb-4 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {recentSaves.map(save => (
                                <RecentSaveCard key={save.id} save={save} />
                            ))}
                        </div>
                    </div>
                )}

            </div>

        </div>
    );
}
