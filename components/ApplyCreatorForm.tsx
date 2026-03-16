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
            <button onClick={() => setIsOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5 text-[#E85D2A] hover:text-[#ff7a45] cursor-pointer transition-colors mt-4">
                <span className="text-sm font-bold flex items-center gap-1.5"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>Become a Creator</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-white/5 p-4 mt-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#0E1116] dark:text-white mb-1">Apply for a Creator Profile</h3>
            <p className="text-xs text-gray-500 mb-4">Get a verified badge, build a following, and share your taste with the community.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input required type="text" placeholder="Instagram / TikTok Handle" className="w-full bg-white dark:bg-[#0E1116] border border-[#D0D7DE] dark:border-[#30363D] rounded-lg px-4 py-3 text-sm text-[#0E1116] dark:text-white placeholder-[#656D76] dark:placeholder-[#8B949E] focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200" />
                <textarea required placeholder="Why should you be a Savrd creator?" rows={2} className="w-full bg-white dark:bg-[#0E1116] border border-[#D0D7DE] dark:border-[#30363D] rounded-lg px-4 py-3 text-sm text-[#0E1116] dark:text-white placeholder-[#656D76] dark:placeholder-[#8B949E] focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200" />
                <div className="flex gap-2">
                    <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-sm font-semibold text-gray-700 dark:text-gray-300 w-1/3">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-[#E85D2A] text-white text-sm font-bold shadow-sm">{isSubmitting ? "Sending..." : "Submit Application"}</button>
                </div>
            </form>
        </div>
    )
}
