"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePhotoUrl } from "@/lib/use-photo-url";

type PublicList = {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    createdAt: string;
    creator: {
        id: string;
        name: string;
        image: string | null;
        isVerified: boolean;
    };
    items: Array<{
        id: string;
        note: string | null;
        position: number;
        place: {
            id: string;
            googlePlaceId: string;
            name: string;
            address: string;
            rating: number | null;
            priceLevel: number | null;
            photoUrl: string | null;
        };
    }>;
    stats: {
        places: number;
        saves: number;
        views: number;
    };
};

/* ─── Cover Photo (resolves Google Places photo ref) ─── */
function CoverPhoto({ photoRef }: { photoRef: string }) {
    const url = usePhotoUrl(photoRef);
    if (!url) return <div className="w-full h-full bg-[#1c1c1e] animate-pulse" />;
    return (
        <Image
            src={url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
        />
    );
}

/* ─── Place Row (read-only) ─── */
function PlaceRow({ item }: { item: PublicList["items"][number] }) {
    const photoUrl = usePhotoUrl(item.place.photoUrl);
    const priceStr = item.place.priceLevel ? "$".repeat(item.place.priceLevel) : null;

    return (
        <div className="flex gap-3 py-3 border-b border-white/5 last:border-b-0">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#1c1c1e] shrink-0 relative">
                {photoUrl ? (
                    <Image src={photoUrl} alt={item.place.name} fill className="object-cover" sizes="64px" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{item.place.name}</h3>
                <p className="text-xs text-gray-400 truncate mt-0.5">{item.place.address}</p>
                <div className="flex items-center gap-2 mt-1">
                    {item.place.rating && (
                        <span className="text-xs text-gray-300 flex items-center gap-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            {item.place.rating.toFixed(1)}
                        </span>
                    )}
                    {priceStr && (
                        <span className="text-xs text-gray-400">{priceStr}</span>
                    )}
                </div>
                {item.note && (
                    <p className="text-xs text-gray-500 italic mt-1 truncate">&ldquo;{item.note}&rdquo;</p>
                )}
            </div>
        </div>
    );
}

/* ─── Main Public View ─── */
export default function PublicListView({ id }: { id: string }) {
    const { status } = useSession();
    const router = useRouter();
    const [list, setList] = useState<PublicList | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (status !== "authenticated") {
            router.push("/profile");
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch(`/api/curated-lists/${id}/save`, { method: "POST" });
            if (res.ok) {
                setHasSaved(true);
                if (list) setList({ ...list, stats: { ...list.stats, saves: list.stats.saves + 1 } });
            } else if (res.status === 409) {
                setHasSaved(true);
            }
        } catch {
            // silent
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        fetch(`/api/lists/${id}/public`)
            .then((r) => {
                if (!r.ok) {
                    setNotFound(true);
                    return null;
                }
                return r.json();
            })
            .then((data) => {
                if (data?.list) setList(data.list);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-dvh bg-[#0E1116] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }} />
            </div>
        );
    }

    if (notFound || !list) {
        return (
            <div className="min-h-dvh bg-[#0E1116] flex flex-col items-center justify-center px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-600">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">List not found</h2>
                <p className="text-gray-400 text-sm mb-6 text-center">This list may be private or no longer exists.</p>
                <Link href="/boards" className="text-sm font-semibold text-[#E85D2A] hover:underline">
                    Browse lists
                </Link>
            </div>
        );
    }

    const coverPhotos = list.items.map(i => i.place.photoUrl).filter(Boolean) as string[];
    const hasCollage = coverPhotos.length >= 4;
    const singleCover = coverPhotos.length > 0 ? coverPhotos[0] : null;

    return (
        <div className="min-h-dvh bg-[#0E1116] pb-12 relative w-full overflow-hidden">

            {/* Back button */}
            <div className="absolute top-0 left-0 right-0 z-40 px-4 py-4 pointer-events-none w-full max-w-[900px] mx-auto">
                <Link href="/boards" className="pointer-events-auto inline-flex w-10 h-10 rounded-full bg-black/40 backdrop-blur-md items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
            </div>

            {/* Cover Photo / Collage */}
            <div className="relative w-full h-[200px] md:h-[280px] bg-[#161B22]">
                {hasCollage ? (
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                        {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className="relative w-full h-full overflow-hidden border border-black/10">
                                <CoverPhoto photoRef={coverPhotos[idx]} />
                            </div>
                        ))}
                    </div>
                ) : singleCover ? (
                    <div className="relative w-full h-full">
                        <CoverPhoto photoRef={singleCover} />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1e] to-[#2a1711]" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />

                {/* Header content */}
                <div className="absolute inset-0 pt-20 px-4 md:px-8 pb-4 flex flex-col justify-end z-10 w-full md:max-w-[900px] mx-auto">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {list.category && (
                            <span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded font-bold text-[10px] md:text-xs text-white uppercase tracking-widest shadow-sm">
                                {list.category.replace(/[-_]/g, " ")}
                            </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded font-bold text-[10px] md:text-xs tracking-widest uppercase bg-green-500/20 text-green-300 border border-green-500/30 shadow-sm">
                            PUBLISHED
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-1.5 drop-shadow-lg tracking-tight">
                        {list.title}
                    </h1>

                    {list.description && (
                        <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-3 max-w-2xl drop-shadow-md line-clamp-2">
                            {list.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                                {list.creator.image ? (
                                    <img src={list.creator.image} alt={list.creator.name} className="w-8 h-8 rounded-full object-cover border border-white/30 shadow-sm" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-600 border border-white/30 shadow-sm" />
                                )}
                                {list.creator.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-[#111]">
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" /></svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white leading-tight">{list.creator.name}</span>
                                <span className="text-[10px] font-semibold text-gray-300 mt-0.5">{list.stats.places} places · {list.stats.saves} saves</span>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || hasSaved}
                            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${hasSaved ? "bg-white/10 text-gray-300 border border-white/10" : "bg-[#E85D2A] text-white hover:bg-[#d45222]"}`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={hasSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                            {hasSaved ? "Saved" : "Save List"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Places list */}
            <div className="w-full md:max-w-[900px] mx-auto px-4 pt-4 md:pt-6">
                <h2 className="text-base md:text-lg font-black text-white mb-4">Places in this list</h2>

                <div className="flex flex-col">
                    {list.items.map((item) => (
                        <PlaceRow key={item.id} item={item} />
                    ))}
                </div>

                {/* CTA Banner */}
                <div className="bg-[#E85D2A]/10 border border-[#E85D2A]/20 rounded-xl p-6 text-center mt-8">
                    <p className="text-white font-semibold">Discover more places on WhereTo</p>
                    <p className="text-gray-400 text-sm mt-1">
                        Save places, create your own lists, and explore Toronto
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-[#E85D2A] text-white px-6 py-2.5 rounded-lg font-medium mt-3 hover:bg-[#d45222] transition-colors"
                    >
                        Open WhereTo
                    </Link>
                </div>
            </div>
        </div>
    );
}
