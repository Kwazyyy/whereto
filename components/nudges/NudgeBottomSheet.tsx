"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

interface NudgeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText: string;
  onCta: () => void;
  secondaryText?: string;
  onSecondary?: () => void;
}

export default function NudgeBottomSheet({
  isOpen,
  onClose,
  icon: Icon,
  title,
  description,
  ctaText,
  onCta,
  secondaryText,
  onSecondary,
}: NudgeBottomSheetProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 80) onClose();
  }

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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#161B22] border-t border-black/[0.08] dark:border-white/[0.1] rounded-t-2xl max-w-md mx-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#656D76] dark:text-[#8B949E] hover:text-[#0E1116] dark:hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="px-6 pt-4 pb-8 flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-[#E85D2A]/10 flex items-center justify-center mb-4">
                <Icon size={24} className="text-[#E85D2A]" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-[#0E1116] dark:text-white mb-2">
                {title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#656D76] dark:text-[#8B949E] mb-6 max-w-[280px]">
                {description}
              </p>

              {/* CTA Button */}
              <button
                onClick={onCta}
                className="w-full py-3 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-medium transition-colors duration-200 cursor-pointer"
              >
                {ctaText}
              </button>

              {/* Secondary action */}
              {secondaryText && (
                <button
                  onClick={onSecondary ?? onClose}
                  className="mt-3 text-sm text-[#8B949E] hover:text-[#656D76] dark:hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {secondaryText}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
