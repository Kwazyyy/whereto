"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

interface NeighborhoodData {
    name: string;
    area: string;
}

interface RevealData {
    neighborhood: NeighborhoodData;
    totalExplored: number;
    totalNeighborhoods: number;
}

interface NeighborhoodRevealContextType {
    triggerNeighborhoodReveal: (data: RevealData) => void;
}

const NeighborhoodRevealContext = createContext<NeighborhoodRevealContextType | undefined>(undefined);

export function NeighborhoodRevealProvider({ children }: { children: ReactNode }) {
    const [revealData, setRevealData] = useState<RevealData | null>(null);
    const { width, height } = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(false);
    const [progressFill, setProgressFill] = useState(0);

    const triggerNeighborhoodReveal = useCallback((data: RevealData) => {
        setRevealData(data);
        setShowConfetti(false);
        setProgressFill(data.totalExplored - 1); // Start animating from previous value

        // Sequence timing
        setTimeout(() => {
            setProgressFill(data.totalExplored);
        }, 1500);

        setTimeout(() => {
            setShowConfetti(true);
        }, 2000);

        // Auto dismiss after 8s
        setTimeout(() => {
            closeModal();
        }, 8000);
    }, []);

    const closeModal = () => {
        setRevealData(null);
        setShowConfetti(false);
    };

    return (
        <NeighborhoodRevealContext.Provider value={{ triggerNeighborhoodReveal }}>
            {children}
            <AnimatePresence>
                {revealData && (
                    <motion.div
                        className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-black/70 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}

                        {/* Radial clearing animation mask */}
                        <motion.div
                            className="absolute inset-0 bg-[#E85D2A]/10 pointer-events-none"
                            initial={{ clipPath: "circle(0% at center)" }}
                            animate={{ clipPath: "circle(100% at center)" }}
                            transition={{ duration: 1.2, ease: "anticipate" }}
                        />

                        {/* Content Container */}
                        <div className="relative z-10 flex flex-col items-center text-center px-6">

                            {/* Step 2: Entrance Text */}
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="text-[#E85D2A] text-sm font-bold tracking-widest uppercase mb-4"
                            >
                                New Area Unlocked
                            </motion.h3>

                            <motion.h1
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 12 }}
                                className="text-4xl md:text-5xl font-black text-white mb-2"
                            >
                                {revealData.neighborhood.name}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className="text-gray-300 text-lg font-medium mb-12"
                            >
                                {revealData.neighborhood.area}
                            </motion.p>

                            {/* Step 3: Progress Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                                className="w-full max-w-sm bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/20"
                            >
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-white font-bold">Exploration</span>
                                    <span className="text-gray-300 text-sm font-semibold">
                                        <motion.span>
                                            {progressFill}
                                        </motion.span>
                                        {" / "}{revealData.totalNeighborhoods} neighborhoods
                                    </span>
                                </div>

                                <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[#E85D2A] to-[#ff7a45] rounded-full"
                                        initial={{ width: `${((revealData.totalExplored - 1) / revealData.totalNeighborhoods) * 100}%` }}
                                        animate={{ width: `${(revealData.totalExplored / revealData.totalNeighborhoods) * 100}%` }}
                                        transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
                                    />
                                </div>
                            </motion.div>

                            {/* Dismiss Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2.5 }}
                                onClick={closeModal}
                                className="mt-12 px-8 py-4 bg-[#E85D2A] hover:bg-[#d04e1f] text-white font-bold rounded-2xl shadow-lg shadow-[#E85D2A]/30 transition-all active:scale-95"
                            >
                                Keep Exploring →
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </NeighborhoodRevealContext.Provider>
    );
}

export function useNeighborhoodReveal() {
    const context = useContext(NeighborhoodRevealContext);
    if (!context) {
        throw new Error("useNeighborhoodReveal must be used within NeighborhoodRevealProvider");
    }
    return context;
}
