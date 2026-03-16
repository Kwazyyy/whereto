"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

type ToastVariant = "success" | "error" | "neutral";

interface ToastData {
  message: string;
  id: number;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => { } });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = "neutral") => {
    const id = Date.now();
    setToast({ message, id, variant });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 3000);
  }, []);

  const accentColor =
    toast?.variant === "success"
      ? "#E85D2A"
      : toast?.variant === "error"
        ? "#F85149"
        : undefined;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:top-4 md:right-4 z-[100] pointer-events-none"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            {/* Mobile pill */}
            <div className="pointer-events-auto md:hidden flex items-center gap-2 w-auto max-w-[85vw] bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] text-[#0E1116] dark:text-white rounded-full shadow-xl text-sm font-medium px-5 py-2.5">
              {toast.variant === "success" && <CheckCircle size={16} className="text-[#E85D2A] shrink-0" />}
              {toast.variant === "error" && <XCircle size={16} className="text-[#F85149] shrink-0" />}
              {toast.message}
            </div>
            {/* Desktop card */}
            <div
              className="pointer-events-auto hidden md:flex items-center gap-2 w-auto min-w-[280px] max-w-[400px] bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] text-[#0E1116] dark:text-white rounded-lg shadow-lg text-sm font-medium px-4 py-3"
              style={accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : undefined}
            >
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
