"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";

const STEPS = [
    {
        target: "card",
        title: "Swipe to decide",
        desc: "Swipe right to save, left to skip",
    },
    {
        target: "chips",
        title: "Pick your vibe",
        desc: "Choose an intent to find places that match your mood",
    },
    {
        target: "card",
        title: "Tap for details",
        desc: "Tap any card to flip it and see photos, hours, and more",
    },
];

const DEMO_CSS = `
@keyframes swipeCard {
    0% { transform: translateX(0) rotate(0deg); box-shadow: none; }
    15% { transform: translateX(40px) rotate(5deg); box-shadow: 0 0 12px rgba(16,185,129,0.4); }
    22.5% { transform: translateX(0) rotate(0deg); box-shadow: none; }
    35% { transform: translateX(0) rotate(0deg); box-shadow: none; }
    50% { transform: translateX(-40px) rotate(-5deg); box-shadow: 0 0 12px rgba(244,63,94,0.4); }
    57.5% { transform: translateX(0) rotate(0deg); box-shadow: none; }
    100% { transform: translateX(0) rotate(0deg); box-shadow: none; }
}
@keyframes saveLabelFade {
    0%, 7%, 25%, 100% { opacity: 0; }
    12%, 18% { opacity: 1; }
}
@keyframes skipLabelFade {
    0%, 40%, 60%, 100% { opacity: 0; }
    47%, 53% { opacity: 1; }
}
@keyframes pillLight {
    0%, 100% { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); }
    10%, 28% { background: #E85D2A; color: white; }
}
@keyframes tapRipple {
    0% { transform: scale(1); opacity: 0.5; }
    24% { transform: scale(2); opacity: 0; }
    25%, 100% { transform: scale(1); opacity: 0; }
}
`;

export function OnboardingTutorial({ onDismiss }: { onDismiss: () => void }) {
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const measure = useCallback(() => {
        if (STEPS[step].target === "chips") {
            // Measure actual chip buttons for a tight bounding box
            const container = document.querySelector('[data-tour="chips"]');
            if (container) {
                const buttons = container.querySelectorAll("button");
                if (buttons.length > 0) {
                    const containerRect = container.getBoundingClientRect();
                    let top = Infinity,
                        left = Infinity,
                        right = -Infinity,
                        bottom = -Infinity;
                    buttons.forEach((btn) => {
                        const r = btn.getBoundingClientRect();
                        // Only include chips visible within the scroll container
                        if (r.right > containerRect.left && r.left < containerRect.right) {
                            top = Math.min(top, r.top);
                            left = Math.min(left, Math.max(r.left, containerRect.left));
                            right = Math.max(right, Math.min(r.right, containerRect.right));
                            bottom = Math.max(bottom, r.bottom);
                        }
                    });
                    if (top !== Infinity) {
                        setRect(new DOMRect(left, top, right - left, bottom - top));
                        return;
                    }
                }
                // Fallback to container rect
                setRect(container.getBoundingClientRect());
            }
        } else {
            const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
            if (el) setRect(el.getBoundingClientRect());
        }
    }, [step]);

    useEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        return () => {
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [measure]);

    const advance = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
        else onDismiss();
    };

    const current = STEPS[step];
    const pad = 8;

    // Tooltip position: centered on the highlighted element
    let tooltipTop = "50%";
    let tooltipStyle: React.CSSProperties = {};
    if (rect) {
        if (current.target === "chips") {
            tooltipTop = `${rect.bottom + 16}px`;
        } else {
            // Card: vertically center on the card area
            tooltipTop = `${rect.top + rect.height * 0.55}px`;
            // Horizontally center on the card
            const tooltipWidth = 320; // max-w-xs = 320px
            const centerX = rect.left + rect.width / 2;
            let left = centerX - tooltipWidth / 2;
            // Constrain to viewport with 24px padding
            left = Math.max(24, Math.min(left, window.innerWidth - tooltipWidth - 24));
            tooltipStyle = { left: `${left}px`, right: "auto" };
        }
    }

    return (
        <div className="fixed inset-0 z-[80]">
            <style>{DEMO_CSS}</style>

            {/* Skip button — top-right of overlay */}
            <button
                onClick={onDismiss}
                className="absolute top-4 right-4 z-[83] text-white/40 hover:text-white/70 text-sm font-medium cursor-pointer transition-colors duration-200"
            >
                Skip
            </button>

            {/* Dark overlay with cutout via box-shadow */}
            {rect && (
                <div
                    className="absolute rounded-xl transition-all duration-300 ease-out pointer-events-none"
                    style={{
                        top: rect.top - pad,
                        left: rect.left - pad,
                        width: rect.width + pad * 2,
                        height: rect.height + pad * 2,
                        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
                        zIndex: 80,
                    }}
                />
            )}

            {/* Subtle highlight glow around targeted element */}
            {rect && (
                <div
                    className="absolute rounded-xl ring-1 ring-white/20 pointer-events-none transition-all duration-300 ease-out"
                    style={{
                        top: rect.top - pad,
                        left: rect.left - pad,
                        width: rect.width + pad * 2,
                        height: rect.height + pad * 2,
                        boxShadow: "0 0 20px rgba(232,93,42,0.15)",
                        zIndex: 81,
                    }}
                />
            )}

            {/* Glassmorphism tooltip */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`absolute max-w-xs ${current.target === "chips" ? "left-5 right-5 mx-auto" : ""}`}
                    style={{ top: tooltipTop, zIndex: 82, ...tooltipStyle }}
                >
                    {/* Arrow pointing up toward highlighted element */}
                    <div className="flex justify-center -mb-px">
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: "8px solid transparent",
                                borderRight: "8px solid transparent",
                                borderBottom: "8px solid rgba(22,27,34,0.8)",
                            }}
                        />
                    </div>

                    <div className="bg-[#161B22]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl">
                        {/* Step indicator */}
                        <p className="text-xs text-white/60 font-medium tracking-wide uppercase text-center mb-3">
                            {step + 1} of {STEPS.length}
                        </p>

                        <h3 className="text-lg font-bold text-white">
                            {current.title}
                        </h3>
                        <p className="text-sm text-white/70 leading-relaxed mt-1">
                            {current.desc}
                        </p>

                        {/* Mini swipe demo animation — step 1 only */}
                        {step === 0 && (
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className="relative h-[80px] w-[200px]">
                                    {/* Skip label — left */}
                                    <span
                                        className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-rose-400/70"
                                        style={{ opacity: 0, animation: "skipLabelFade 4s ease-in-out infinite" }}
                                    >
                                        Skip
                                    </span>
                                    {/* Save label — right */}
                                    <span
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-emerald-400/70"
                                        style={{ opacity: 0, animation: "saveLabelFade 4s ease-in-out infinite" }}
                                    >
                                        Save
                                    </span>
                                    {/* Mini card */}
                                    <div
                                        className="absolute top-0 w-[60px] h-[80px] rounded-lg bg-white/10 border border-white/15 flex items-center justify-center"
                                        style={{
                                            left: "calc(50% - 30px)",
                                            animation: "swipeCard 4s ease-in-out infinite",
                                        }}
                                    >
                                        <MapPin className="w-5 h-5 text-white/30" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mini pill chips animation — step 2 only */}
                        {step === 1 && (
                            <div className="flex items-center justify-center gap-2 py-3">
                                {["Study", "Date", "Cafe"].map((label, i) => (
                                    <span
                                        key={label}
                                        className="px-3 py-1 rounded-full text-[10px] font-medium"
                                        style={{
                                            background: "rgba(255,255,255,0.1)",
                                            color: "rgba(255,255,255,0.4)",
                                            animation: `pillLight 4.5s ease-in-out infinite ${i * 1.5}s`,
                                        }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Mini card tap ripple animation — step 3 only */}
                        {step === 2 && (
                            <div className="flex items-center justify-center py-3">
                                <div className="relative w-[60px] h-[80px] rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-white/30" />
                                    {/* Tap ripple */}
                                    <div
                                        className="absolute rounded-full bg-white/30"
                                        style={{
                                            width: 12,
                                            height: 12,
                                            top: "calc(50% - 6px)",
                                            left: "calc(50% - 6px)",
                                            animation: "tapRipple 2.5s ease-out infinite",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={advance}
                            className="mt-4 w-full py-2.5 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold text-sm transition-colors duration-200 cursor-pointer"
                        >
                            {step < STEPS.length - 1 ? "Next \u2192" : "Start Swiping!"}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
