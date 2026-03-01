"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePhotoUrl } from "@/lib/use-photo-url";

type ListDetail = {
    id: string;
    title: string;
    description: string | null;
    category: string;
    isPublic: boolean;
    createdAt: string;
    creator: {
        id: string;
        name: string;
        image: string | null;
        isVerified: boolean;
    };
    stats: {
        places: number;
        saves: number;
    };
    items: Array<{
        id: string;
        note: string | null;
        position: number;
        place: {
            id: string;
            name: string;
            photoUrl: string | null;
            rating: number | null;
            priceLevel: number | null;
            address: string;
        };
    }>;
    hasSaved: boolean;
    heroImage: string | null;
};

export default function ListDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data: session } = useSession();
    const [list, setList] = useState<ListDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Creator State
    const [saves, setSaves] = useState<any[]>([]);
    const [addSheetOpen, setAddSheetOpen] = useState(false);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [isSubmittingPlace, setIsSubmittingPlace] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        fetch(`/api/curated-lists/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((d) => {
                setList(d.list);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [id]);

    const toggleSaveList = async () => {
        if (!session) return;
        if (!list) return;

        setIsSaving(true);
        const method = list.hasSaved ? "DELETE" : "POST";
        const oldState = list.hasSaved;

        // Optimistic update
        setList({
            ...list,
            hasSaved: !oldState,
            stats: {
                ...list.stats,
                saves: list.stats.saves + (oldState ? -1 : 1),
            }
        });

        try {
            const res = await fetch(`/api/curated-lists/${id}/save`, { method });
            if (!res.ok) throw new Error();
        } catch (err) {
            // Revert optimism
            setList({
                ...list,
                hasSaved: oldState,
                stats: {
                    ...list.stats,
                    saves: list.stats.saves + (oldState ? 1 : -1),
                }
            });
        } finally {
            setIsSaving(false);
        }
    };

    const openAddSheet = async () => {
        setAddSheetOpen(true);
        if (saves.length === 0) {
            try {
                const res = await fetch("/api/saves");
                const data = await res.json();
                setSaves(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleAddPlace = async () => {
        if (!selectedPlaceId) return;
        setIsSubmittingPlace(true);
        try {
            const res = await fetch(`/api/curated-lists/${id}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeId: selectedPlaceId, note: note.trim() || undefined }),
            });
            if (res.ok) {
                const data = await res.json();
                setList(prev => prev ? {
                    ...prev,
                    stats: { ...prev.stats, places: prev.stats.places + 1 },
                    items: [...prev.items, {
                        id: data.item.id,
                        note: data.item.note,
                        position: data.item.position,
                        place: data.item.place,
                    }]
                } : null);
                setAddSheetOpen(false);
                setSelectedPlaceId(null);
                setNote("");
            } else {
                const err = await res.json();
                alert(err.error || "Failed to add place");
            }
        } catch (e) {
            alert("Network error");
        } finally {
            setIsSubmittingPlace(false);
        }
    };

    const handleRemovePlace = async (itemId: string) => {
        if (!confirm("Remove this place from your list?")) return;
        try {
            const res = await fetch(`/api/curated-lists/${id}/items/${itemId}`, { method: "DELETE" });
            if (res.ok) {
                setList(prev => prev ? {
                    ...prev,
                    stats: { ...prev.stats, places: prev.stats.places - 1 },
                    items: prev.items.filter(i => i.id !== itemId)
                } : null);
            } else {
                alert("Failed to remove place");
            }
        } catch (e) {
            alert("Network error");
        }
    };

    const togglePublishStatus = async () => {
        if (!list) return;
        if (!list.isPublic && list.items.length < 3) {
            alert("Your list needs at least 3 places to be published.");
            return;
        }

        setIsPublishing(true);
        try {
            const res = await fetch(`/api/curated-lists/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: !list.isPublic })
            });
            if (res.ok) {
                setList(prev => prev ? { ...prev, isPublic: !prev.isPublic } : null);
            } else {
                alert("Failed to toggle status");
            }
        } catch (e) {
            alert("Network error");
        } finally {
            setIsPublishing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-dvh bg-white dark:bg-[#0E1116] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }} />
            </div>
        );
    }

    if (error || !list) {
        return (
            <div className="min-h-dvh bg-white dark:bg-[#0E1116] flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">List not found.</h2>
                <button onClick={() => router.back()} className="text-sm font-semibold text-[#E85D2A] mt-2">Go back</button>
            </div>
        );
    }

    const isCreator = session?.user?.id === list.creator.id;

    return (
        <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-24 relative lg:max-w-xl mx-auto border-x border-gray-100 dark:border-white/5">

            {/* Dynamic Nav Bar (Glass) */}
            <div className="fixed top-0 left-0 right-0 lg:max-w-xl lg:mx-auto z-40 px-4 py-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98" /><path d="m15.41 6.51-6.82 3.98" /></svg>
                    </button>
                </div>
            </div>

            {/* Hero Header Block */}
            <div className="relative w-full aspect-[4/5] sm:aspect-square md:aspect-video lg:aspect-[4/5] bg-[#161B22]">
                {list.heroImage ? (
                    <Image src={list.heroImage} alt="Hero" fill className="object-cover" unoptimized priority />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0E1116]" />

                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-32 relative z-10 flex flex-col justify-end h-full">
                    <div className="mb-3">
                        <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-bold text-white uppercase tracking-wider">
                            {list.category.replace("-", " ")}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3 drop-shadow-xl">{list.title}</h1>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 max-w-sm drop-shadow-md">
                        {list.description || "The ultimate guide curated just for you."}
                    </p>

                    <div className="flex items-center justify-between">
                        <Link href={`/creators/${list.creator.id}`} className="flex items-center gap-3">
                            <div className="relative">
                                {list.creator.image ? (
                                    <img src={list.creator.image} alt={list.creator.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-600 border-2 border-white/20" />
                                )}
                                {list.creator.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-[#0E1116]">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" /></svg>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white leading-none mb-1">{list.creator.name}</p>
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                                    <span className="flex items-center gap-1"><span className="text-white/70">📍</span> {list.stats.places} places</span>
                                    <span className="flex items-center gap-1"><span className="text-white/70">❤️</span> {list.stats.saves} saves</span>
                                </div>
                            </div>
                        </Link>

                        {!isCreator && (
                            <button
                                onClick={toggleSaveList}
                                disabled={isSaving}
                                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${list.hasSaved
                                    ? "bg-white/10 text-white border border-white/20"
                                    : "bg-[#E85D2A] text-white shadow-lg shadow-[#E85D2A]/30"
                                    }`}
                            >
                                {list.hasSaved ? "Saved" : "Save List"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* List Items Render */}
            <div className="px-5 pt-8 pb-32">
                <h2 className="text-lg font-black text-[#0E1116] dark:text-[#e8edf4] mb-5">Places in this list</h2>

                {list.items.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500 dark:text-gray-400">No places added yet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {list.items.map((item, index) => (
                            <PlaceRow
                                key={item.id}
                                position={index + 1}
                                item={item}
                                isCreator={isCreator}
                                onRemove={() => handleRemovePlace(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button for Creators */}
            {isCreator && (
                <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
                    <button
                        onClick={togglePublishStatus}
                        disabled={isPublishing}
                        className={`shadow-lg px-4 py-2.5 rounded-full font-bold text-sm transition-transform flex items-center gap-2 border ${list.isPublic ? "bg-white text-gray-900 border-gray-200" : "bg-[#161B22] text-white border-white/10"}`}
                    >
                        {list.isPublic ? "PUBLIC" : "DRAFT (Publish)"}
                    </button>
                    <button onClick={openAddSheet} className="bg-[#E85D2A] text-white rounded-full px-5 py-3 font-bold text-sm shadow-xl shadow-[#E85D2A]/30 flex items-center gap-2 hover:scale-105 transition-transform">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add Places
                    </button>
                </div>
            )}

            {/* Add Places Bottom Sheet */}
            {addSheetOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end flex-col">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddSheetOpen(false)} />
                    <div className="relative bg-white dark:bg-[#161B22] rounded-t-3xl p-6 w-full max-w-xl mx-auto animate-slide-up pb-safe shadow-2xl h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Add to List</h2>
                            <button onClick={() => setAddSheetOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 flex flex-col gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select a place from your saves</label>
                                {saves.length === 0 ? (
                                    <p className="text-sm text-gray-400 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">You have no saved places yet.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {saves.map((save: any) => {
                                            const isAdded = list.items.some(i => i.place.id === save.placeId);
                                            return (
                                                <button
                                                    key={save.id}
                                                    disabled={isAdded}
                                                    onClick={() => setSelectedPlaceId(save.placeId)}
                                                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${isAdded ? "opacity-50 grayscale bg-gray-50 dark:bg-transparent border-gray-100 dark:border-white/5 cursor-not-allowed" :
                                                        selectedPlaceId === save.placeId ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 ring-1 ring-[#E85D2A]" :
                                                            "bg-white dark:bg-[#1C2128] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                                        }`}
                                                >
                                                    <span className="font-bold text-sm text-[#0E1116] dark:text-[#e8edf4] truncate w-full">{save.name || "Unknown Place"}</span>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {isAdded ? "Already in list" : save.intent || "Uncategorized"}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {selectedPlaceId && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Add a personal note (Optional)</label>
                                    <textarea
                                        placeholder="What's great about this place?"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#0E1116] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#0E1116] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E85D2A] resize-none h-24"
                                    />

                                    <button
                                        onClick={handleAddPlace}
                                        disabled={isSubmittingPlace}
                                        className="w-full bg-[#E85D2A] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl mt-4"
                                    >
                                        {isSubmittingPlace ? "Adding..." : "Add to List"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlaceRow({ position, item, isCreator, onRemove }: { position: number, item: any, isCreator: boolean, onRemove: () => void }) {
    const photoUrl = usePhotoUrl(item.place.photoUrl);

    const priceDots = () => {
        if (!item.place.priceLevel) return null;
        return (
            <span className="text-gray-400 font-semibold tracking-widest text-xs">
                {Array.from({ length: item.place.priceLevel }).map(() => "$").join("")}
            </span>
        );
    };

    return (
        <div className="flex flex-col gap-3 group relative">
            <div className="flex gap-4">
                {/* Index Column */}
                <div className="flex flex-col items-center pt-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-black text-sm text-[#0E1116] dark:text-gray-300">
                        {position}
                    </div>
                    <div className="w-px h-full bg-gray-100 dark:bg-white/10 mt-2 rounded-full hidden" />
                </div>

                {/* Content Column */}
                <div className="flex-1 flex gap-4 bg-gray-50 dark:bg-[#161B22] p-3 rounded-2xl border border-gray-100 dark:border-white/5 active:scale-[0.98] transition-all cursor-pointer">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1C2128] relative shadow-sm">
                        {photoUrl ? (
                            <Image src={photoUrl} alt={item.place.name} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center flex-1 min-w-0 pr-1">
                        <h3 className="font-bold text-[#0E1116] dark:text-[#e8edf4] text-[15px] truncate pr-6">{item.place.name}</h3>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.place.address}</p>
                        <div className="flex items-center gap-2 mt-2">
                            {item.place.rating && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-[#0E1116] dark:text-[#e8edf4] bg-white dark:bg-[#0E1116] px-1.5 py-0.5 rounded shadow-sm border border-gray-100 dark:border-white/5">
                                    <span className="text-yellow-400">★</span> {item.place.rating.toFixed(1)}
                                </span>
                            )}
                            {priceDots() && <span className="bg-white dark:bg-[#0E1116] px-1.5 py-0.5 rounded shadow-sm border border-gray-100 dark:border-white/5">{priceDots()}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Note Ribbon */}
            {item.note && (
                <div className="ml-11 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3 rounded-xl rounded-tl-sm relative">
                    <div className="absolute -top-1.5 left-4 w-3 h-3 bg-blue-50/50 dark:bg-blue-500/10 border-l border-t border-blue-100 dark:border-blue-500/20 rotate-45" />
                    <p className="text-[13px] text-blue-900 dark:text-blue-100 font-medium leading-relaxed italic relative z-10">"{item.note}"</p>
                </div>
            )}

            {/* Creator Delete Block */}
            {isCreator && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white dark:bg-[#1C2128] rounded-full border border-gray-200 dark:border-white/10 text-red-500 hover:scale-110 transition-transform shadow-sm"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
            )}
        </div>
    );
}
