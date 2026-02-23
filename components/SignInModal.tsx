"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

export function SignInModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-t-3xl px-6 pt-4 pb-12"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 20, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-6" />
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-[#E85D2A]/15 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="#E85D2A" stroke="#E85D2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#2D2D2D] dark:text-[#e8edf4]">
                            Sign in to save your favorite places
                        </h2>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs mx-auto">
                            Create boards, track your spots, and share vibes with friends.
                        </p>
                    </div>
                    <button
                        onClick={() => signIn("google")}
                        className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-white dark:bg-[#22223b] border-2 border-gray-200 dark:border-white/10 font-semibold text-sm text-[#2D2D2D] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-[#2d2d44] transition-colors cursor-pointer shadow-sm"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
