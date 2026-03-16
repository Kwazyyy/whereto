"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/Toast";

type Category = {
    id: string;
    label: string;
    prompt: string;
    icon: string;
    currentCount: number;
    isFull: boolean;
};

type SelectedPhoto = {
    categoryId: string;
    dataUri: string;
    caption: string;
};

/* ─── Image compression via canvas ─── */
function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new window.Image();
            img.onload = () => {
                const MAX = 1200;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    if (width > height) {
                        height = Math.round((height * MAX) / width);
                        width = MAX;
                    } else {
                        width = Math.round((width * MAX) / height);
                        height = MAX;
                    }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("Canvas not supported"));
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ─── Category Card ─── */
function CategoryCard({
    category,
    photo,
    onSelectFile,
    onRemove,
    onCaptionChange,
}: {
    category: Category;
    photo: SelectedPhoto | undefined;
    onSelectFile: (categoryId: string) => void;
    onRemove: (categoryId: string) => void;
    onCaptionChange: (categoryId: string, caption: string) => void;
}) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {photo ? (
                /* ─ Preview ─ */
                <div>
                    <div className="relative">
                        <img
                            src={photo.dataUri}
                            alt=""
                            className="w-full h-40 object-cover"
                        />
                        {/* Category label */}
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[10px] font-medium text-white flex items-center gap-1">
                            <span>{category.icon}</span> {category.label}
                        </span>
                        {/* Remove */}
                        <button
                            onClick={() => onRemove(category.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition cursor-pointer"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-3">
                        <input
                            type="text"
                            value={photo.caption}
                            onChange={(e) => onCaptionChange(category.id, e.target.value)}
                            placeholder="Add a caption (optional)"
                            maxLength={200}
                            className="w-full bg-transparent text-sm text-white placeholder-[#8B949E] border-none focus:outline-none focus:ring-0 transition-colors duration-200"
                        />
                    </div>
                </div>
            ) : (
                /* ─ Empty slot ─ */
                <button
                    onClick={() => onSelectFile(category.id)}
                    className="w-full p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                >
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/15 flex items-center justify-center shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base">{category.icon}</span>
                            <span className="text-sm font-semibold text-white">{category.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{category.prompt}</p>
                        <p className="text-[10px] text-gray-500 mt-1">Tap to add</p>
                    </div>
                </button>
            )}
        </div>
    );
}

/* ─── Main Component ─── */
export default function PhotoUploadPrompt({
    placeId,
    placeName,
    isOpen,
    onClose,
}: {
    placeId: string;
    placeName: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [alreadyUploaded, setAlreadyUploaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState<Map<string, SelectedPhoto>>(new Map());
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeCategoryRef = useRef<string>("");

    // Fetch categories when opened
    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setPhotos(new Map());
        fetch(`/api/photos/categories?placeId=${placeId}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.alreadyUploaded) {
                    setAlreadyUploaded(true);
                    setCategories([]);
                } else {
                    setAlreadyUploaded(false);
                    setCategories(data.categories || []);
                }
            })
            .catch(() => {
                showToast("Failed to load categories");
            })
            .finally(() => setLoading(false));
    }, [isOpen, placeId, showToast]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = ""; };
        }
    }, [isOpen]);

    const handleSelectFile = useCallback((categoryId: string) => {
        activeCategoryRef.current = categoryId;
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset so same file can be re-selected
        e.target.value = "";

        try {
            const dataUri = await compressImage(file);
            const catId = activeCategoryRef.current;
            setPhotos((prev) => {
                const next = new Map(prev);
                next.set(catId, { categoryId: catId, dataUri, caption: "" });
                return next;
            });
        } catch {
            showToast("Failed to process image");
        }
    }, [showToast]);

    const handleRemove = useCallback((categoryId: string) => {
        setPhotos((prev) => {
            const next = new Map(prev);
            next.delete(categoryId);
            return next;
        });
    }, []);

    const handleCaptionChange = useCallback((categoryId: string, caption: string) => {
        setPhotos((prev) => {
            const existing = prev.get(categoryId);
            if (!existing) return prev;
            const next = new Map(prev);
            next.set(categoryId, { ...existing, caption: caption.slice(0, 200) });
            return next;
        });
    }, []);

    const handleUpload = useCallback(async () => {
        const entries = Array.from(photos.values());
        if (entries.length === 0) return;

        setUploading(true);
        let successCount = 0;

        try {
            for (let i = 0; i < entries.length; i++) {
                setUploadProgress(`Uploading ${i + 1} of ${entries.length}...`);
                const entry = entries[i];
                const res = await fetch("/api/photos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        placeId,
                        category: entry.categoryId,
                        imageBase64: entry.dataUri,
                        caption: entry.caption || undefined,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: "Upload failed" }));
                    throw new Error(err.error || "Upload failed");
                }
                successCount++;
            }

            showToast("Photos submitted for review!");
            onClose();
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Upload failed";
            showToast(`Error: ${msg}. ${successCount} of ${entries.length} uploaded.`);
        } finally {
            setUploading(false);
            setUploadProgress("");
        }
    }, [photos, placeId, showToast, onClose]);

    const selectedCount = photos.size;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[90] bg-black/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        className="fixed inset-x-0 bottom-0 z-[91] max-h-[90dvh] md:inset-auto md:top-1/2 md:left-1/2 md:max-w-lg md:w-full md:max-h-[85vh] md:rounded-2xl overflow-hidden flex flex-col bg-[#161B22] rounded-t-2xl md:transform md:-translate-x-1/2 md:-translate-y-1/2"
                        initial={{ y: "100%", opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between px-5 pt-5 pb-3 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white">Share your experience</h2>
                                <p className="text-xs text-gray-400 mt-0.5">{placeName}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition shrink-0 cursor-pointer"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-5 pb-5">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }} />
                                </div>
                            ) : alreadyUploaded ? (
                                /* Already uploaded state */
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">📸</div>
                                    <h3 className="text-base font-semibold text-white">You&apos;ve already shared photos for this visit!</h3>
                                    <p className="text-sm text-gray-400 mt-1">Come back tomorrow to share more.</p>
                                    <div className="flex gap-3 mt-6 justify-center">
                                        <Link
                                            href={`/places/${placeId}/photos`}
                                            onClick={onClose}
                                            className="px-4 py-2 rounded-lg bg-[#E85D2A] text-white text-sm font-medium hover:bg-[#d04e1f] transition-colors"
                                        >
                                            View Gallery
                                        </Link>
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Upload UI */
                                <>
                                    <p className="text-xs text-gray-400 mb-4">Help others discover what this place is really like</p>

                                    <div className="flex flex-col gap-3">
                                        {categories.map((cat) => (
                                            <CategoryCard
                                                key={cat.id}
                                                category={cat}
                                                photo={photos.get(cat.id)}
                                                onSelectFile={handleSelectFile}
                                                onRemove={handleRemove}
                                                onCaptionChange={handleCaptionChange}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer (only show when upload UI is visible) */}
                        {!loading && !alreadyUploaded && categories.length > 0 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 shrink-0">
                                <button
                                    onClick={onClose}
                                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={selectedCount === 0 || uploading}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                        selectedCount > 0 && !uploading
                                            ? "bg-[#E85D2A] text-white hover:bg-[#d04e1f]"
                                            : "bg-white/5 text-gray-500 cursor-not-allowed"
                                    }`}
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
                                            {uploadProgress}
                                        </>
                                    ) : (
                                        `Share ${selectedCount > 0 ? selectedCount + " " : ""}Photo${selectedCount !== 1 ? "s" : ""}`
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
