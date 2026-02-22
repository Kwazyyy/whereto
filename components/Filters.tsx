"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const DISTANCE_OPTIONS = [
    { label: "1km", value: 1000 },
    { label: "2km", value: 2000 },
    { label: "5km", value: 5000 },
    { label: "10km", value: 10000 },
    { label: "25km", value: 25000 },
];

export function DistanceBubble({
    radius,
    onRadiusChange,
}: {
    radius: number;
    onRadiusChange: (value: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const bubbleRef = useRef<HTMLDivElement>(null);

    const currentLabel =
        DISTANCE_OPTIONS.find((o) => o.value === radius)?.label ?? "5km";

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("pointerdown", handleClick);
        return () => document.removeEventListener("pointerdown", handleClick);
    }, [open]);

    return (
        <div ref={bubbleRef}>
            <motion.div
                layout
                className="inline-flex items-center rounded-full overflow-hidden cursor-pointer bg-black/40 backdrop-blur-md border border-white/15 shadow-lg"
                onClick={() => !open && setOpen(true)}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
            >
                <AnimatePresence mode="wait">
                    {!open ? (
                        <motion.div
                            key="collapsed"
                            className="flex items-center gap-1.5 px-3 py-1.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => setOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="text-white text-xs font-semibold">{currentLabel}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            className="flex items-center gap-0.5 px-1.5 py-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {DISTANCE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRadiusChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${radius === opt.value ? "bg-[#E85D2A] text-white" : "text-white/70 hover:text-white"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export const BUDGET_OPTIONS = ["All", "$", "$$", "$$$", "$$$$"];

export function BudgetBubble({
    priceFilter,
    onPriceFilterChange,
}: {
    priceFilter: string;
    onPriceFilterChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const bubbleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("pointerdown", handleClick);
        return () => document.removeEventListener("pointerdown", handleClick);
    }, [open]);

    return (
        <div ref={bubbleRef}>
            <motion.div
                layout
                className="inline-flex items-center rounded-full overflow-hidden cursor-pointer bg-black/40 backdrop-blur-md border border-white/15 shadow-lg"
                onClick={() => !open && setOpen(true)}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
            >
                <AnimatePresence mode="wait">
                    {!open ? (
                        <motion.div
                            key="collapsed"
                            className="flex items-center gap-1.5 px-3 py-1.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => setOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            <span className="text-white text-xs font-semibold">{priceFilter}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            className="flex items-center gap-0.5 px-1.5 py-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {BUDGET_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPriceFilterChange(opt);
                                        setOpen(false);
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${priceFilter === opt ? "bg-[#E85D2A] text-white" : "text-white/70 hover:text-white"
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
