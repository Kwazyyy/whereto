"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { markNudgeSeen } from "@/lib/nudges";

interface NudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText: string;
  onCta: () => void;
  secondaryText?: string;
  onSecondary?: () => void;
  nudgeType: string;
}

export default function NudgeModal({
  isOpen,
  onClose,
  icon: Icon,
  title,
  description,
  ctaText,
  onCta,
  secondaryText,
  onSecondary,
  nudgeType,
}: NudgeModalProps) {
  const dismiss = useCallback(() => {
    markNudgeSeen(nudgeType);
    onClose();
  }, [nudgeType, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, dismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="relative pointer-events-auto w-full max-w-sm rounded-2xl px-8 py-8 shadow-2xl bg-white/[0.65] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.15]"
              style={{
                backdropFilter: "blur(64px) saturate(180%)",
                WebkitBackdropFilter: "blur(64px) saturate(180%)",
              }}
            >
              {/* Close button */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#8B949E] hover:text-[#0E1116] dark:hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Content */}
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-[#E85D2A]/10 flex items-center justify-center">
                  <Icon size={28} className="text-[#E85D2A]" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-[#0E1116] dark:text-white mt-4">
                  {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#8B949E] mt-2">
                  {description}
                </p>

                {/* CTA */}
                <button
                  onClick={() => {
                    markNudgeSeen(nudgeType);
                    onCta();
                  }}
                  className="w-full py-3 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-medium transition-colors duration-200 cursor-pointer mt-6"
                >
                  {ctaText}
                </button>

                {/* Secondary */}
                {secondaryText && (
                  <button
                    onClick={onSecondary ?? dismiss}
                    className="text-sm text-[#8B949E] mt-3 cursor-pointer hover:text-[#0E1116] dark:hover:text-white transition-colors duration-200"
                  >
                    {secondaryText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
