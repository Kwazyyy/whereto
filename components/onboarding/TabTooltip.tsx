"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TabTooltipAnimation } from "./TabTooltipAnimations";

export interface TabTooltipStep {
  title: string;
  description: string;
  animationKey: string;
}

interface TabTooltipProps {
  steps: TabTooltipStep[];
  storageKey: string;
  onComplete?: () => void;
}

export function TabTooltip({ steps, storageKey, onComplete }: TabTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(storageKey)) {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
    onComplete?.();
  };

  const advance = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  };

  const current = steps[step];
  const isMultiStep = steps.length > 1;
  const isLastStep = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={dismiss}
      />

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="relative z-10 w-[320px] max-w-[calc(100vw-48px)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-2xl p-5 shadow-xl relative">
            {/* Skip link — top-right of card */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-[#656D76] dark:text-[#8B949E] text-xs hover:text-[#0E1116] dark:hover:text-white cursor-pointer transition-colors duration-200"
            >
              Skip
            </button>

            {/* Step counter */}
            {isMultiStep && (
              <p className="text-[#656D76] dark:text-[#8B949E] text-xs font-medium tracking-widest text-center mb-3">
                {step + 1} OF {steps.length}
              </p>
            )}

            {/* Animation area */}
            <TabTooltipAnimation animationKey={current.animationKey} />

            {/* Title & description */}
            <h3 className="text-[#0E1116] dark:text-white text-lg font-bold text-center">
              {current.title}
            </h3>
            <p className="text-[#656D76] dark:text-[#8B949E] text-sm text-center mt-1 leading-relaxed">
              {current.description}
            </p>

            {/* Progress dots */}
            {isMultiStep && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-5 h-1.5 bg-[#E85D2A]"
                        : i < step
                        ? "w-1.5 h-1.5 bg-[#E85D2A]"
                        : "w-1.5 h-1.5 bg-[#D0D7DE] dark:bg-[#30363D]"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Action button */}
            <button
              onClick={advance}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold text-sm transition-colors duration-200 cursor-pointer"
            >
              {isLastStep
                ? isMultiStep
                  ? "Done"
                  : "Got it"
                : "Next \u2192"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
