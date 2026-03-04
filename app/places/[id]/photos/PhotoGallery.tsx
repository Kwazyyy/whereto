"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { PHOTO_CATEGORIES } from "@/lib/photo-categories";
import { relativeTime } from "@/lib/utils/time";
import PhotoUploadPrompt from "@/components/PhotoUploadPrompt";

/* ─── Types ─── */
type Photo = {
    id: string;
    cloudinaryUrl: string;
    caption: string | null;
    category: string;
    createdAt: string;
    user: { id: string; name: string | null; avatarUrl: string | null };
    likeCount: number;
    likedByMe: boolean;
};

type TopContributor = {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    photoCount: number;
};

const categoryMap: Map<string, (typeof PHOTO_CATEGORIES)[number]> = new Map(PHOTO_CATEGORIES.map((c) => [c.id, c]));

/* ─── Heart Icon ─── */
function HeartIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );
}

/* ─── Skeleton Grid ─── */
function SkeletonGrid() {
    return (
        <div className="columns-2 md:columns-3 gap-3 px-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mb-3 break-inside-avoid">
                    <div
                        className="bg-[#161B22] dark:bg-[#161B22] bg-gray-100 rounded-xl animate-pulse"
                        style={{ height: `${160 + (i % 3) * 40}px` }}
                    />
                </div>
            ))}
        </div>
    );
}

/* ─── Empty State ─── */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-white dark:text-white text-gray-900 mb-1">No community photos yet</h3>
            <p className="text-sm text-gray-400 max-w-xs">
                Visit this place and be the first to share!
            </p>
        </div>
    );
}

/* ─── Photo Card ─── */
function PhotoCard({
    photo,
    onLike,
    onOpen,
}: {
    photo: Photo;
    onLike: (id: string) => void;
    onOpen: (photo: Photo) => void;
}) {
    const cat = categoryMap.get(photo.category);

    return (
        <div className="mb-3 break-inside-avoid">
            <div
                className="relative rounded-xl overflow-hidden bg-[#161B22] cursor-pointer group"
                onClick={() => onOpen(photo)}
            >
                <Image
                    src={photo.cloudinaryUrl}
                    alt={photo.caption || "Community photo"}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    sizes="(max-width: 768px) 50vw, 33vw"
                />

                {/* Category badge */}
                {cat && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[10px] font-medium text-white flex items-center gap-1">
                        <span>{cat.icon}</span> {cat.label}
                    </span>
                )}

                {/* Like button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onLike(photo.id);
                    }}
                    className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs font-medium transition-colors cursor-pointer ${
                        photo.likedByMe ? "text-[#E85D2A]" : "text-white"
                    }`}
                >
                    <HeartIcon filled={photo.likedByMe} size={14} />
                    {photo.likeCount > 0 && <span>{photo.likeCount}</span>}
                </button>
            </div>

            {/* Caption */}
            {photo.caption && (
                <p className="text-xs text-gray-300 mt-1.5 line-clamp-2 px-0.5">{photo.caption}</p>
            )}

            {/* User + time */}
            <div className="flex items-center gap-1.5 mt-1 px-0.5">
                {photo.user.avatarUrl ? (
                    <img src={photo.user.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-600" />
                )}
                <span className="text-[11px] text-gray-400 truncate">
                    {photo.user.name || "Anonymous"}
                </span>
                <span className="text-[11px] text-gray-500">·</span>
                <span className="text-[11px] text-gray-500">{relativeTime(photo.createdAt)}</span>
            </div>
        </div>
    );
}

/* ─── Lightbox ─── */
function Lightbox({
    photos,
    index,
    onClose,
    onLike,
    onNavigate,
}: {
    photos: Photo[];
    index: number;
    onClose: () => void;
    onLike: (id: string) => void;
    onNavigate: (dir: -1 | 1) => void;
}) {
    const photo = photos[index];
    const cat = categoryMap.get(photo.category);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft" && index > 0) onNavigate(-1);
            if (e.key === "ArrowRight" && index < photos.length - 1) onNavigate(1);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [index, photos.length, onClose, onNavigate]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col"
            onClick={onClose}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                <span className="text-sm text-gray-400">{index + 1} / {photos.length}</span>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>

            {/* Image area */}
            <div className="flex-1 relative flex items-center justify-center px-4 min-h-0" onClick={(e) => e.stopPropagation()}>
                {/* Nav arrows */}
                {index > 0 && (
                    <button
                        onClick={() => onNavigate(-1)}
                        className="absolute left-2 md:left-6 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                )}
                {index < photos.length - 1 && (
                    <button
                        onClick={() => onNavigate(1)}
                        className="absolute right-2 md:right-6 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="relative max-w-3xl w-full max-h-[70vh] flex items-center justify-center"
                    >
                        <Image
                            src={photo.cloudinaryUrl}
                            alt={photo.caption || "Community photo"}
                            width={1200}
                            height={900}
                            className="max-h-[70vh] w-auto mx-auto rounded-lg object-contain"
                            priority
                            sizes="(max-width: 768px) 100vw, 80vw"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom info */}
            <div className="shrink-0 px-4 pb-6 pt-3 max-w-3xl mx-auto w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {photo.user.avatarUrl ? (
                            <img src={photo.user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-600" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-white">{photo.user.name || "Anonymous"}</p>
                            <p className="text-xs text-gray-400">{relativeTime(photo.createdAt)}{cat ? ` · ${cat.icon} ${cat.label}` : ""}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => onLike(photo.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                            photo.likedByMe
                                ? "border-[#E85D2A]/30 bg-[#E85D2A]/10 text-[#E85D2A]"
                                : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                    >
                        <HeartIcon filled={photo.likedByMe} size={16} />
                        <span className="text-sm font-medium">{photo.likeCount}</span>
                    </button>
                </div>

                {photo.caption && (
                    <p className="text-sm text-gray-300 mt-2">{photo.caption}</p>
                )}
            </div>
        </motion.div>
    );
}

/* ─── Main Gallery ─── */
export default function PhotoGallery({ placeId, placeName }: { placeId: string; placeName: string }) {
    const router = useRouter();
    const { status } = useSession();
    const [photos, setPhotos] = useState<Record<string, Photo[]>>({});
    const [totalCount, setTotalCount] = useState(0);
    const [topContributor, setTopContributor] = useState<TopContributor | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [canUpload, setCanUpload] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);

    // Check if user can upload (signed in + verified visit)
    useEffect(() => {
        if (status !== "authenticated") {
            console.log("[PhotoGallery] Upload check skipped — session status:", status);
            setCanUpload(false);
            return;
        }
        console.log("[PhotoGallery] Checking upload eligibility for place:", placeId);
        fetch(`/api/photos/categories?placeId=${placeId}`)
            .then(async (r) => {
                if (r.ok) {
                    console.log("[PhotoGallery] Upload eligible — showing button");
                    setCanUpload(true);
                } else {
                    const body = await r.json().catch(() => ({}));
                    console.log("[PhotoGallery] Upload not eligible —", r.status, body);
                }
            })
            .catch((err) => {
                console.error("[PhotoGallery] Upload check failed:", err);
            });
    }, [status, placeId]);

    // Fetch photos
    useEffect(() => {
        fetch(`/api/photos?placeId=${placeId}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.photos) setPhotos(data.photos);
                if (typeof data.totalCount === "number") setTotalCount(data.totalCount);
                if (data.topContributor) setTopContributor(data.topContributor);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [placeId]);

    // Flat list of all photos (for lightbox navigation)
    const filteredPhotos: Photo[] =
        activeTab === "all"
            ? Object.values(photos).flat()
            : photos[activeTab] || [];

    // Categories that have photos
    const activeCats = PHOTO_CATEGORIES.filter((c) => (photos[c.id]?.length ?? 0) > 0);

    // Like handler with optimistic update
    const handleLike = useCallback(
        async (photoId: string) => {
            if (status !== "authenticated") {
                router.push("/profile");
                return;
            }

            // Optimistic update across all category groups
            setPhotos((prev) => {
                const next = { ...prev };
                for (const cat of Object.keys(next)) {
                    next[cat] = next[cat].map((p) =>
                        p.id === photoId
                            ? {
                                  ...p,
                                  likedByMe: !p.likedByMe,
                                  likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
                              }
                            : p
                    );
                }
                return next;
            });

            try {
                const res = await fetch(`/api/photos/${photoId}/like`, { method: "POST" });
                if (!res.ok) throw new Error();
                const data = await res.json();

                // Sync with server truth
                setPhotos((prev) => {
                    const next = { ...prev };
                    for (const cat of Object.keys(next)) {
                        next[cat] = next[cat].map((p) =>
                            p.id === photoId
                                ? { ...p, likedByMe: data.liked, likeCount: data.likeCount }
                                : p
                        );
                    }
                    return next;
                });
            } catch {
                // Revert on error
                setPhotos((prev) => {
                    const next = { ...prev };
                    for (const cat of Object.keys(next)) {
                        next[cat] = next[cat].map((p) =>
                            p.id === photoId
                                ? {
                                      ...p,
                                      likedByMe: !p.likedByMe,
                                      likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
                                  }
                                : p
                        );
                    }
                    return next;
                });
            }
        },
        [status, router]
    );

    const openLightbox = useCallback(
        (photo: Photo) => {
            const idx = filteredPhotos.findIndex((p) => p.id === photo.id);
            if (idx !== -1) setLightboxIndex(idx);
        },
        [filteredPhotos]
    );

    const navigateLightbox = useCallback(
        (dir: -1 | 1) => {
            setLightboxIndex((prev) => {
                if (prev === null) return null;
                const next = prev + dir;
                if (next < 0 || next >= filteredPhotos.length) return prev;
                return next;
            });
        },
        [filteredPhotos.length]
    );

    return (
        <div className="min-h-dvh bg-[#0E1116] pb-28">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0E1116]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition shrink-0 cursor-pointer"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-sm font-bold text-white truncate">{placeName}</h1>
                        <p className="text-xs text-gray-400">Community Photos</p>
                    </div>
                    {canUpload && (
                        <button
                            onClick={() => setUploadOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E85D2A] text-white text-xs font-bold shrink-0 active:scale-[0.97] transition-transform cursor-pointer"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                            Upload
                        </button>
                    )}
                </div>
            </div>

            {/* Stats row */}
            {!loading && totalCount > 0 && (
                <div className="max-w-3xl mx-auto px-4 pt-4 flex items-center gap-2 text-xs text-gray-400">
                    <span>{totalCount} photo{totalCount !== 1 ? "s" : ""}</span>
                    {topContributor && (
                        <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                                Top contributor:
                                {topContributor.avatarUrl ? (
                                    <img src={topContributor.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover inline" />
                                ) : (
                                    <span className="w-4 h-4 rounded-full bg-gray-600 inline-block" />
                                )}
                                <span className="font-medium text-gray-300">{topContributor.name}</span>
                                <span>({topContributor.photoCount})</span>
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Category tabs */}
            {!loading && activeCats.length > 0 && (
                <div className="max-w-3xl mx-auto mt-3 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 px-4 pb-1">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                activeTab === "all"
                                    ? "bg-[#E85D2A] text-white"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                            }`}
                        >
                            All
                        </button>
                        {activeCats.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                                    activeTab === cat.id
                                        ? "bg-[#E85D2A] text-white"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                            >
                                <span>{cat.icon}</span> {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-3xl mx-auto mt-4">
                {loading ? (
                    <SkeletonGrid />
                ) : totalCount === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="columns-2 md:columns-3 gap-3 px-4">
                        {filteredPhotos.map((photo) => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onLike={handleLike}
                                onOpen={openLightbox}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <Lightbox
                        photos={filteredPhotos}
                        index={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                        onLike={handleLike}
                        onNavigate={navigateLightbox}
                    />
                )}
            </AnimatePresence>

            {/* Upload prompt */}
            <PhotoUploadPrompt
                placeId={placeId}
                placeName={placeName}
                isOpen={uploadOpen}
                onClose={() => {
                    setUploadOpen(false);
                    // Re-fetch photos after upload
                    fetch(`/api/photos?placeId=${placeId}`)
                        .then((r) => r.json())
                        .then((data) => {
                            if (data.photos) setPhotos(data.photos);
                            if (typeof data.totalCount === "number") setTotalCount(data.totalCount);
                            if (data.topContributor) setTopContributor(data.topContributor);
                        })
                        .catch(() => {});
                }}
            />
        </div>
    );
}
