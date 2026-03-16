"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
            className="fixed top-4 right-4 left-4 md:left-auto z-[100] flex justify-center md:justify-end pointer-events-none"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            <div
              className="pointer-events-auto bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] text-[#0E1116] dark:text-white rounded-lg shadow-lg text-sm font-medium px-4 py-3 max-w-sm"
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
