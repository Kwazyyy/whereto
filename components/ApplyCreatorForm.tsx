"use client";

import { useState } from "react";
import { useToast } from "./Toast";

export function ApplyCreatorForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate network
        setTimeout(() => {
            setIsSubmitting(false);
            setIsOpen(false);
            showToast("Application submitted! We'll be in touch.");
        }, 1500);
    }

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-[#E85D2A]/10 dark:to-amber-500/10 rounded-xl border border-orange-100 dark:border-[#E85D2A]/20 cursor-pointer hover:opacity-90 transition-opacity mt-4">
                <span className="text-sm font-bold text-[#E85D2A]">✨ Become a Creator</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-white/5 p-4 mt-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#0E1116] dark:text-white mb-1">Apply for a Creator Profile</h3>
            <p className="text-xs text-gray-500 mb-4">Get a verified badge, build a following, and share your taste with the community.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input required type="text" placeholder="Instagram / TikTok Handle" className="w-full bg-gray-50 dark:bg-[#1C2128] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2A]/50 text-[#0E1116] dark:text-[#e8edf4]" />
                <textarea required placeholder="Why should you be a WhereTo creator?" rows={2} className="w-full bg-gray-50 dark:bg-[#1C2128] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2A]/50 text-[#0E1116] dark:text-[#e8edf4]" />
                <div className="flex gap-2">
                    <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-sm font-semibold text-gray-700 dark:text-gray-300 w-1/3">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-[#E85D2A] text-white text-sm font-bold shadow-sm">{isSubmitting ? "Sending..." : "Submit Application"}</button>
                </div>
            </form>
        </div>
    )
}
