"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface BadgeDefinition {
    type: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    requirement: number;
}

interface BadgeContextType {
    triggerBadgeCheck: () => Promise<void>;
}

const BadgeContext = createContext<BadgeContextType>({ triggerBadgeCheck: async () => { } });

export function useBadges() {
    return useContext(BadgeContext);
}

// Reuse the confetti from VisitCelebration
const CONFETTI_COLORS = ["#E85D2A", "#FBBF24", "#34D399", "#60A5FA", "#F472B6", "#A78BFA"];

function ConfettiPiece({ index }: { index: number }) {
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = 1.5 + Math.random() * 1.5;
    const rotation = Math.random() * 360;
    const size = 6 + Math.random() * 6;

    return (
        <motion.div
            className="absolute top-0 pointer-events-none"
            style={{
                left: `${left}%`,
                width: size,
                height: size * 1.5,
                backgroundColor: color,
                borderRadius: 2,
            }}
            initial={{ y: -20, rotate: 0, opacity: 1, scale: 1 }}
            animate={{
                y: "100vh",
                rotate: rotation + 720,
                opacity: [1, 1, 0],
                scale: [1, 0.8, 0.5],
            }}
            transition={{
                duration,
                delay,
                ease: "easeIn",
            }}
        />
    );
}

export function BadgeProvider({ children }: { children: ReactNode }) {
    const [queue, setQueue] = useState<BadgeDefinition[]>([]);
    const [currentBadge, setCurrentBadge] = useState<BadgeDefinition | null>(null);

    const triggerBadgeCheck = async () => {
        try {
            const res = await fetch("/api/badges/check", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                if (data.newBadges && data.newBadges.length > 0) {
                    setQueue(prev => [...prev, ...data.newBadges]);
                }
            }
        } catch (e) {
            console.error("Failed to check badges", e);
        }
    };

    // Process consecutive queued badges
    useEffect(() => {
        if (!currentBadge && queue.length > 0) {
            setCurrentBadge(queue[0]);
            setQueue(prev => prev.slice(1));
        }
    }, [queue, currentBadge]);

    // Auto dismiss smoothly after 5 seconds if not interacted with
    useEffect(() => {
        if (currentBadge) {
            const timer = setTimeout(() => {
                setCurrentBadge(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentBadge]);

    const handleClose = () => {
        setCurrentBadge(null);
    };

    return (
        <BadgeContext.Provider value={{ triggerBadgeCheck }}>
            {children}

            <AnimatePresence>
                {currentBadge && (
                    <motion.div
                        className="fixed inset-0 z-[200] flex items-center justify-center p-5 pt-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Dim Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                            onClick={handleClose}
                        />

                        {/* Confetti Animation Layer */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {Array.from({ length: 50 }).map((_, i) => (
                                <ConfettiPiece key={i} index={i} />
                            ))}
                        </div>

                        {/* Pop up Card */}
                        <motion.div
                            className="relative z-10 bg-white dark:bg-[#161B22] rounded-3xl px-8 py-10 w-full max-w-sm text-center shadow-2xl"
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <button
                                    onClick={handleClose}
                                    className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-300">
                                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                    </svg>
                                </button>
                            </div>

                            <motion.div
                                className="text-7xl mb-6 flex justify-center drop-shadow-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.2, 1] }}
                                transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
                            >
                                {currentBadge.icon}
                            </motion.div>

                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
                                New Badge Unlocked
                            </h3>
                            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                {currentBadge.name}
                            </h2>
                            <p className="text-[15px] text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                {currentBadge.description}
                            </p>

                            <button
                                onClick={handleClose}
                                className="w-full py-3.5 rounded-2xl bg-[#E85D2A] text-white font-bold text-sm shadow-lg shadow-[#E85D2A]/30 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                            >
                                Awesome!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </BadgeContext.Provider>
    );
}
