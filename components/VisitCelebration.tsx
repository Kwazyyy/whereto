"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VisitCelebrationProps {
    placeName: string;
    onClose: () => void;
    onSharePhotos?: () => void;
}

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

export default function VisitCelebration({ placeName, onClose, onSharePhotos }: VisitCelebrationProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    const dismiss = () => { setVisible(false); setTimeout(onClose, 300); };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={dismiss}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Confetti */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <ConfettiPiece key={i} index={i} />
                        ))}
                    </div>

                    {/* Card */}
                    <motion.div
                        className="relative z-10 bg-white dark:bg-[#161B22] rounded-3xl px-8 py-10 mx-6 text-center shadow-2xl max-w-sm"
                        initial={{ scale: 0.5, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">
                            You visited!
                        </h2>
                        <p className="text-lg font-semibold mt-2" style={{ color: "#E85D2A" }}>
                            {placeName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                            Visit verified and added to your profile ✓
                        </p>
                        <div className="flex flex-col gap-2 mt-6">
                            {onSharePhotos && (
                                <button
                                    onClick={() => { dismiss(); setTimeout(onSharePhotos, 350); }}
                                    className="w-full px-6 py-3 rounded-2xl bg-[#E85D2A] text-white font-bold text-sm shadow-lg shadow-[#E85D2A]/30 active:scale-[0.97] transition-transform cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    Share Photos
                                </button>
                            )}
                            <button
                                onClick={dismiss}
                                className={`w-full px-6 py-3 rounded-2xl font-bold text-sm active:scale-[0.97] transition-transform cursor-pointer ${
                                    onSharePhotos
                                        ? "bg-white/5 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                                        : "bg-[#E85D2A] text-white shadow-lg shadow-[#E85D2A]/30"
                                }`}
                            >
                                Awesome!
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
