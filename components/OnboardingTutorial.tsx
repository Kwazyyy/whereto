"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
    {
        icon: "↔️",
        title: "Swipe to decide",
        desc: "Swipe right to save, left to skip, or swipe up for directions",
        // Tooltip near bottom — arrow points up toward card
        placement: { bottom: 180 } as React.CSSProperties,
    },
    {
        icon: "🎯",
        title: "Pick your vibe",
        desc: "Tap a chip at the top to find places that match your mood",
        // Tooltip just below chips row — arrow points up to chips
        placement: { top: 120 } as React.CSSProperties,
    },
    {
        icon: "👆",
        title: "See more details",
        desc: "Tap any card to flip it and see hours, photos, and more",
        // Tooltip near bottom — arrow points up toward card
        placement: { bottom: 180 } as React.CSSProperties,
    },
];

export function OnboardingTutorial({ onDismiss }: { onDismiss: () => void }) {
    const [step, setStep] = useState(0);

    function advance() {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            onDismiss();
        }
    }

    const current = STEPS[step];

    return (
        <div className="fixed inset-0 z-[80] pointer-events-auto">
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/65" />

            {/* Tooltip card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-5 right-5"
                    style={current.placement}
                >
                    {/* Arrow pointing up */}
                    <div className="flex justify-center">
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: "11px solid transparent",
                                borderRight: "11px solid transparent",
                                borderBottom: "11px solid #1e1e30",
                            }}
                        />
                    </div>

                    <div className="bg-[#1e1e30] rounded-2xl p-5 shadow-2xl border border-white/10">
                        {/* Step dots */}
                        <div className="flex gap-1.5 mb-4">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step
                                        ? "w-5 bg-[#E85D2A]"
                                        : i < step
                                            ? "w-1.5 bg-[#E85D2A]/40"
                                            : "w-1.5 bg-white/20"
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-0.5 leading-none">{current.icon}</span>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-base leading-snug">
                                    {current.title}
                                </h3>
                                <p className="text-white/65 text-sm mt-1 leading-relaxed">
                                    {current.desc}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={advance}
                            className="mt-4 w-full py-3 rounded-xl bg-[#E85D2A] text-white font-semibold text-sm active:scale-[0.97] transition-transform cursor-pointer"
                        >
                            {step < STEPS.length - 1 ? "Next →" : "Got it!"}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
