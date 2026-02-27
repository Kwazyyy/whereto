"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { VIBE_CATEGORIES, VIBE_TAGS, VibeTagDef } from "@/lib/vibeTags";

interface VibeVotingSheetProps {
    isOpen: boolean;
    placeId: string;
    placeName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function VibeVotingSheet({
    isOpen,
    placeId,
    placeName,
    onClose,
    onSuccess
}: VibeVotingSheetProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            }
            if (prev.length >= 8) {
                return prev;
            }
            return [...prev, tag];
        });
    };

    const handleSubmit = async () => {
        if (selectedTags.length === 0) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/vibe-votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeId, vibeTags: selectedTags })
            });

            if (res.ok) {
                onSuccess?.();
                onClose();
            } else {
                console.error("Failed to submit vibe votes");
            }
        } catch (error) {
            console.error("Error submitting vibe votes:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[201] max-h-[90vh] flex flex-col bg-white dark:bg-[#0E1116] rounded-t-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Drag Handle & Header */}
                        <div className="shrink-0 pt-4 pb-2 px-6 border-b border-gray-100 dark:border-white/5 relative bg-white dark:bg-[#0E1116]">
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-4" />
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-[#0E1116] dark:text-white leading-tight">
                                        How was {placeName}?
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Help others know what to expect</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 hide-scrollbar space-y-8">
                            <style>{`
                                .hide-scrollbar::-webkit-scrollbar { display: none; }
                                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                            `}</style>

                            {VIBE_CATEGORIES.map(category => {
                                const tagsInCategory = VIBE_TAGS.filter(t => t.category === category);
                                if (tagsInCategory.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                            {category}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {tagsInCategory.map(tagDef => {
                                                const isSelected = selectedTags.includes(tagDef.label);
                                                return (
                                                    <button
                                                        key={tagDef.label}
                                                        onClick={() => toggleTag(tagDef.label)}
                                                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors border ${isSelected
                                                                ? "bg-[#E85D2A]/20 border-[#E85D2A] text-[#E85D2A]"
                                                                : "bg-gray-50 dark:bg-[#161B22] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                                            }`}
                                                    >
                                                        <span>{tagDef.emoji}</span>
                                                        <span>{tagDef.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="h-4" /> {/* Bottom padding */}
                        </div>

                        {/* Sticky Bottom Actions */}
                        <div className="shrink-0 p-4 pb-safe bg-white dark:bg-[#0E1116] border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <span className="text-sm font-medium text-gray-500">
                                    <strong className={selectedTags.length > 0 ? "text-[#E85D2A]" : "text-gray-400"}>
                                        {selectedTags.length}
                                    </strong>
                                    <span className="text-gray-400"> / 8 selected</span>
                                </span>
                                <button
                                    onClick={onClose}
                                    className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={selectedTags.length === 0 || isSubmitting}
                                className="w-full h-12 flex items-center justify-center rounded-xl bg-[#E85D2A] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-[#E85D2A]/20"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Submit Vibes"
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
