"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useToast } from "@/components/Toast";

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
            googlePlaceId: string;
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
    const [saves, setSaves] = useState<Array<{ id: string; placeId: string; name?: string; intent?: string }>>([]);
    const [addSheetOpen, setAddSheetOpen] = useState(false);
    const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
    const [isSubmittingPlace, setIsSubmittingPlace] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const { showToast } = useToast();

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
        setSelectedPlaceIds([]);
        if (saves.length === 0) {
            try {
                const res = await fetch("/api/saves");
                const data = await res.json();

                const arr = Array.isArray(data) ? data : [];
                const uniqueSavesMap = new Map();
                for (const save of arr) {
                    if (!uniqueSavesMap.has(save.placeId)) {
                        uniqueSavesMap.set(save.placeId, save);
                    }
                }
                const sortedSaves = Array.from(uniqueSavesMap.values()).sort((a, b) =>
                    (a.name || "").localeCompare(b.name || "")
                );

                setSaves(sortedSaves);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleAddPlace = async () => {
        if (selectedPlaceIds.length === 0) return;
        setIsSubmittingPlace(true);
        let addedCount = 0;
        const newItems: ListDetail["items"] = [];
        try {
            for (const placeId of selectedPlaceIds) {
                const res = await fetch(`/api/curated-lists/${id}/items`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ placeId }),
                });
                if (res.ok) {
                    const data = await res.json();
                    newItems.push({
                        id: data.item.id,
                        note: data.item.note,
                        position: data.item.position,
                        place: data.item.place,
                    });
                    addedCount++;
                } else {
                    console.error("Failed to add place", placeId);
                }
            }
            if (newItems.length > 0) {
                setList(prev => prev ? {
                    ...prev,
                    stats: { ...prev.stats, places: prev.stats.places + newItems.length },
                    items: [...prev.items, ...newItems]
                } : null);
            }
            setAddSheetOpen(false);
            setSelectedPlaceIds([]);
            if (addedCount > 0) showToast(`Added ${addedCount} place${addedCount > 1 ? 's' : ''} to your list`);
        } catch (e) {
            showToast("Network error");
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
                showToast("Failed to remove place");
            }
        } catch (e) {
            showToast("Network error");
        }
    };

    const togglePublishStatus = async () => {
        if (!list) return;
        if (!list.isPublic && list.items.length < 3) {
            showToast("Your list needs at least 3 places to be published.");
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
                showToast("Failed to toggle status");
            }
        } catch (e) {
            showToast("Network error");
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

    // Derived cover photos
    const coverPhotos = list.items.map(i => i.place.photoUrl).filter(Boolean) as string[];
    const hasCollage = coverPhotos.length >= 4;
    const singleCover = coverPhotos.length > 0 ? coverPhotos[0] : list.heroImage;

    return (
        <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-24 md:pb-12 relative w-full overflow-hidden">

            {/* Transparent Header Nav Overlay */}
            <div className="absolute top-0 left-0 right-0 z-40 px-4 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between pointer-events-none w-full max-w-[900px] mx-auto">
                <button onClick={() => router.push('/boards')} className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-colors self-start md:self-auto">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="pointer-events-auto flex gap-2 absolute right-4 top-4 md:relative md:right-auto md:top-auto">
                    <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98" /><path d="m15.41 6.51-6.82 3.98" /></svg>
                    </button>
                </div>
            </div>

            {/* Spotify-style Cover Photo / Collage */}
            <div className="relative w-full h-[200px] md:h-[280px] bg-[#161B22]">
                {hasCollage ? (
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                        {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className="relative w-full h-full overflow-hidden border border-black/10">
                                <CoverPhoto name={coverPhotos[idx]} />
                            </div>
                        ))}
                    </div>
                ) : singleCover ? (
                    <div className="relative w-full h-full">
                        <CoverPhoto name={singleCover} />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1e] to-[#2a1711]" />
                )}

                {/* Overlay gradient (Darker at bottom) */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 md:to-black/80" />

                {/* Header Content Container */}
                <div className="absolute inset-0 pt-20 px-4 md:px-8 pb-4 flex flex-col justify-end z-10 w-full md:max-w-[900px] mx-auto">
                    <div className="flex items-center gap-2 mb-1.5 md:mb-3">
                        <span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded font-bold text-[10px] md:text-xs text-white uppercase tracking-widest shadow-sm">
                            {list.category.replace(/-/g, " ")}
                        </span>
                        {isCreator && (
                            <button
                                onClick={togglePublishStatus}
                                disabled={isPublishing}
                                className={`px-2.5 py-0.5 rounded font-bold text-[10px] md:text-xs tracking-widest uppercase transition-all border shadow-sm ${list.isPublic ? "bg-white/20 text-white border-white/20" : "bg-[#E85D2A] text-white border-[#E85D2A]"}`}
                            >
                                {list.isPublic ? "PUBLIC" : "DRAFT (Publish)"}
                            </button>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-1.5 md:mb-3 drop-shadow-lg tracking-tight">{list.title}</h1>

                    {list.description && (
                        <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-3 md:mb-5 max-w-2xl drop-shadow-md line-clamp-2">
                            {list.description}
                        </p>
                    )}

                    <div className="flex flex-row items-end md:items-center justify-between w-full">
                        <Link href={`/creators/${list.creator.id}`} className="flex items-center gap-2.5 md:gap-3 hover:opacity-80 transition-opacity">
                            <div className="relative shrink-0">
                                {list.creator.image ? (
                                    <img src={list.creator.image} alt={list.creator.name} className="w-8 h-8 md:w-11 md:h-11 rounded-full object-cover border border-white/30 shadow-sm" />
                                ) : (
                                    <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-gray-600 border border-white/30 shadow-sm" />
                                )}
                                {list.creator.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-[#111]">
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" /></svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs md:text-sm font-bold text-white shadow-sm leading-tight">{list.creator.name}</span>
                                <span className="text-[10px] md:text-xs font-semibold text-gray-300 shadow-sm mt-0.5">{list.stats.places} places · {list.stats.saves} saves</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Desktop Actions Row & List Items Render */}
            <div className="w-full md:max-w-[900px] mx-auto px-4 pt-4 md:pt-6 pb-32 md:pb-12">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h2 className="text-base md:text-lg font-black text-[#0E1116] dark:text-[#e8edf4]">Places in this list</h2>

                    {/* Top Right Buttons Area (Add Places / Save) */}
                    <div className="flex gap-2 items-center">
                        {!isCreator && (
                            <button
                                onClick={toggleSaveList}
                                disabled={isSaving}
                                className={`px-4 py-2 mt-[-6px] rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 shadow-sm ${list.hasSaved
                                    ? "bg-gray-100 dark:bg-white/10 text-[#0E1116] dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:bg-gray-200 cursor-pointer"
                                    : "bg-[#E85D2A] text-white hover:bg-[#d45222] cursor-pointer"
                                    }`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={list.hasSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                                {list.hasSaved ? "Saved" : "Save List"}
                            </button>
                        )}
                        {isCreator && (
                            <button onClick={openAddSheet} className="hidden md:flex mt-[-6px] bg-[#E85D2A] text-white rounded-full px-5 py-2 font-bold text-sm shadow-sm items-center gap-1.5 hover:bg-[#d45222] transition-colors cursor-pointer">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                Add Places
                            </button>
                        )}
                    </div>
                </div>

                {list.items.length === 0 ? (
                    <div className="text-center py-16 md:py-24 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4] mb-2">No places added yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Build out your curated list by adding places from your saves.</p>

                        {isCreator && (
                            <button onClick={openAddSheet} className="bg-[#E85D2A] text-white rounded-full px-6 py-3 font-bold text-sm shadow-md flex items-center gap-2 hover:bg-[#d45222] transition-colors cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                Add Places
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-0 border-t border-gray-100 dark:border-white/5 md:border-none">
                        {list.items.map((item) => (
                            <PlaceRow
                                key={item.id}
                                item={item}
                                isCreator={isCreator}
                                onRemove={() => handleRemovePlace(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Sticky Action Button for Creators */}
            {isCreator && list.items.length > 0 && (
                <div className="md:hidden fixed bottom-[90px] left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                    <button onClick={openAddSheet} className="pointer-events-auto bg-[#E85D2A] text-white rounded-full px-6 py-3.5 font-bold text-sm shadow-xl shadow-[#E85D2A]/30 flex items-center gap-2 relative">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add Places
                    </button>
                </div>
            )}

            {/* Add Places Bottom Sheet / Modal */}
            {addSheetOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end flex-col md:justify-center md:items-center md:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddSheetOpen(false)} />
                    <div className="relative bg-white dark:bg-[#161B22] rounded-t-3xl md:rounded-2xl p-6 w-full max-w-xl md:max-w-[560px] mx-auto animate-slide-up pb-safe md:pb-6 shadow-2xl h-[80vh] md:h-auto md:max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h2 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Add to List</h2>
                            <button onClick={() => setAddSheetOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-none pb-2 flex flex-col gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select a place from your saves</label>
                                {saves.length === 0 ? (
                                    <p className="text-sm text-gray-400 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">You have no saved places yet.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {saves.map((save) => {
                                            const isAdded = list.items.some(i => i.place.googlePlaceId === save.placeId || i.place.id === save.placeId);
                                            return (
                                                <button
                                                    key={save.id}
                                                    disabled={isAdded}
                                                    onClick={() => {
                                                        setSelectedPlaceIds(prev =>
                                                            prev.includes(save.placeId)
                                                                ? prev.filter(p => p !== save.placeId)
                                                                : [...prev, save.placeId]
                                                        );
                                                    }}
                                                    className={`relative p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${isAdded ? "opacity-50 grayscale bg-gray-50 dark:bg-transparent border-gray-100 dark:border-white/5 cursor-not-allowed" :
                                                        selectedPlaceIds.includes(save.placeId) ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 ring-1 ring-[#E85D2A]" :
                                                            "bg-white dark:bg-[#1C2128] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                                        }`}
                                                >
                                                    {selectedPlaceIds.includes(save.placeId) && (
                                                        <div className="absolute top-2 right-2 text-[#E85D2A] dark:text-[#E85D2A] rounded-full">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                        </div>
                                                    )}
                                                    <span className={`font-bold text-sm text-[#0E1116] dark:text-[#e8edf4] truncate ${selectedPlaceIds.includes(save.placeId) ? 'pr-6' : 'w-full'}`}>{save.name || "Unknown Place"}</span>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {isAdded ? "Already in list" : save.intent || "Uncategorized"}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Bottom Note/Submit Section */}
                        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#161B22]">
                            <button
                                onClick={handleAddPlace}
                                disabled={isSubmittingPlace || selectedPlaceIds.length === 0}
                                className="w-full bg-[#E85D2A] disabled:opacity-50 disabled:pointer-events-none text-white font-bold py-3.5 rounded-xl transition-all"
                            >
                                {isSubmittingPlace ? "Adding..." : (selectedPlaceIds.length > 0 ? `Add ${selectedPlaceIds.length} Place${selectedPlaceIds.length > 1 ? 's' : ''}` : "Add to List")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CoverPhoto({ name }: { name: string }) {
    const url = usePhotoUrl(name);
    if (!url) return <div className="w-full h-full bg-[#1C2128]" />;
    return <Image src={url} alt="Cover" fill className="object-cover" unoptimized priority />;
}

function PlaceRow({ item, isCreator, onRemove }: { item: ListDetail["items"][0], isCreator: boolean, onRemove: () => void }) {
    const photoUrl = usePhotoUrl(item.place.photoUrl);

    const priceDots = () => {
        if (!item.place.priceLevel) return null;
        return (
            <span className="text-gray-400 dark:text-gray-500 font-semibold tracking-widest text-[11px] md:text-xs">
                {Array.from({ length: item.place.priceLevel }).map(() => "$").join("")}
            </span>
        );
    };

    return (
        <div className="relative group flex items-start gap-3 md:gap-4 py-3.5 md:py-4 border-b border-gray-100 dark:border-white/5 md:hover:bg-gray-50 md:dark:hover:bg-white/[0.02] md:px-4 md:-mx-4 rounded-xl transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-white/5">

            {/* Thumbnail */}
            <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1C2128] relative shadow-sm border border-black/5 dark:border-white/5 block">
                {photoUrl ? (
                    <Image src={photoUrl} alt={item.place.name} fill className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    </div>
                )}
            </div>

            {/* Content Mid */}
            <div className="flex-1 min-w-0 pt-0.5 md:pt-1 pl-1">
                <h3 className="font-bold text-[#0E1116] dark:text-[#e8edf4] text-[15px] md:text-lg leading-tight truncate pr-6 md:pr-8">{item.place.name}</h3>

                {/* Note: In a real app the intent might be fetched, here using address as fallback placeholder */}
                <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 truncate max-w-[90%]">
                    {item.place.address}
                </p>

                <div className="flex items-center gap-1.5 md:gap-2 mt-2 font-medium">
                    {item.place.rating ? (
                        <span className="text-[11px] md:text-[13px] text-[#0E1116] dark:text-gray-300 flex items-center gap-0.5 md:gap-1">
                            <span className="text-yellow-400 text-[10px] md:text-[11px] pb-[-1px]">★</span> {item.place.rating.toFixed(1)}
                        </span>
                    ) : null}

                    {item.place.rating && priceDots() && <span className="text-gray-300 dark:text-gray-700 text-[10px]">•</span>}
                    {priceDots()}
                </div>

                {/* Personal Note (Optional) */}
                {item.note && (
                    <div className="mt-2 text-[12px] md:text-[13px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 py-2 px-3 rounded-md italic border-l-2 border-gray-300 dark:border-gray-600 leading-snug">
                        &quot;{item.note}&quot;
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-start h-full pt-1 md:pr-1">
                {isCreator ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full md:hover:bg-red-50 md:dark:hover:bg-red-500/10 transition-colors"
                        title="Remove place"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    </button>
                ) : (
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 cursor-pointer hover:text-[#0E1116] dark:hover:text-white transition-colors" title="Options">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
}
