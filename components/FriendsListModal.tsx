"use client";

import { useState, useEffect } from "react";
import { Avatar, type Friend } from "@/components/CompatibilityDrawer";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { CompatibilityDrawer } from "@/components/CompatibilityDrawer";
import { FriendCompareModal, CompareData } from "@/components/FriendCompareModal";

export function FriendsListModal({ onClose }: { onClose: () => void }) {
    const [friendsData, setFriendsData] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // Modal Overrides from Profile page extracted
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [selectedCompareFriend, setSelectedCompareFriend] = useState<string | null>(null);
    const [compareData, setCompareData] = useState<CompareData | null>(null);

    useEffect(() => {
        fetch("/api/friends")
            .then((r) => r.json())
            .then((data: { friends: Friend[] }) => {
                if (data && Array.isArray(data.friends)) {
                    setFriendsData(data.friends);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Fetch match compare logic
    useEffect(() => {
        if (!selectedCompareFriend) {
            setCompareData(null);
            return;
        }
        const fetchCompare = async () => {
            try {
                const res = await fetch(`/api/friends/${selectedCompareFriend}/exploration-compare`);
                if (res.ok) {
                    const data = await res.json();
                    setCompareData(data);
                }
            } catch (e) {
                console.error("Could not fetch comparison mapping");
            }
        };
        fetchCompare();
    }, [selectedCompareFriend]);

    const handleOpenTaste = async (friend: Friend) => {
        try {
            const r = await fetch(`/api/friends/${friend.userId}/compatibility`);
            if (r.ok) {
                const compat = await r.json();
                setSelectedFriend({ ...friend, compatibility: compat });
            } else {
                setSelectedFriend({ ...friend, compatibility: null });
            }
        } catch {
            setSelectedFriend({ ...friend, compatibility: null });
        }
    };

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-white dark:bg-[#161B22] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85dvh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[#0E1116] dark:text-[#e8edf4]">
                        Friends
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:scale-105 transition-transform text-gray-500 dark:text-gray-400 cursor-pointer"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 dark:border-white/10">
                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#1C2128] border-none rounded-xl pl-10 pr-4 py-2 text-sm text-[#0E1116] dark:text-[#e8edf4] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E85D2A]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }} />
                        </div>
                    ) : (
                        <>
                            {friendsData
                                .filter(
                                    (f) =>
                                        !searchQuery ||
                                        (f.name ?? f.email)
                                            .toLowerCase()
                                            .includes(searchQuery.toLowerCase())
                                )
                                .map((friend) => (
                                    <div
                                        key={friend.friendshipId}
                                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        <Avatar image={friend.image} name={friend.name} size={44} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#0E1116] dark:text-[#e8edf4] truncate">
                                                {friend.name ?? friend.email}
                                            </p>
                                            {friend.name && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                    {friend.email}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setSelectedCompareFriend(friend.userId)}
                                                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 hover:border-[#E85D2A] dark:hover:border-[#E85D2A] flex items-center justify-center text-sm transition-colors cursor-pointer"
                                                title="Compare Map"
                                            >
                                                🗺️
                                            </button>
                                            <button
                                                onClick={() => handleOpenTaste(friend)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#E85D2A] transition-colors cursor-pointer"
                                                title="Taste Compatibility"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                            {friendsData.length > 0 &&
                                friendsData.filter(
                                    (f) =>
                                        !searchQuery ||
                                        (f.name ?? f.email)
                                            .toLowerCase()
                                            .includes(searchQuery.toLowerCase())
                                ).length === 0 && (
                                    <div className="text-center py-12 text-sm text-gray-400">
                                        No friends found.
                                    </div>
                                )}
                        </>
                    )}
                </div>
            </div>

            {/* Compatibility Modal Passthrough */}
            {selectedFriend && (
                <CompatibilityDrawer
                    friend={selectedFriend}
                    compat={selectedFriend.compatibility}
                    onClose={() => setSelectedFriend(null)}
                    onCompare={() => {
                        setSelectedFriend(null);
                        setSelectedCompareFriend(selectedFriend.userId);
                    }}
                />
            )}

            {selectedCompareFriend && compareData && (
                <FriendCompareModal
                    data={compareData}
                    onClose={() => {
                        setSelectedCompareFriend(null);
                        setCompareData(null);
                    }}
                />
            )}
        </div>
    );
}
