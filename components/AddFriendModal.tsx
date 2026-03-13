"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useToast } from "@/components/Toast";

export function AddFriendModal({
    onClose,
    onSent,
}: {
    onClose: () => void;
    onSent?: () => void;
}) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const userId = session?.user?.id ?? "";
    const inviteUrl = `https://whereto-nu.vercel.app/invite?ref=${userId}`;
    const shareText = "Check out Savrd — discover the best cafés and restaurants near you!";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
                setError(data.error ?? "Something went wrong");
            } else {
                setSuccess(true);
                onSent?.();
                setTimeout(onClose, 1200);
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            showToast("Link copied!");
        } catch {
            showToast("Failed to copy");
        }
    }

    function handleWhatsApp() {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${inviteUrl}`)}`, "_blank");
    }

    function handleTwitter() {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${inviteUrl}`)}`, "_blank");
    }

    return (
        <motion.div
            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            <motion.div
                className="w-full md:w-auto md:min-w-[420px] md:max-w-[460px] bg-white/[0.65] dark:bg-white/[0.05] rounded-t-2xl md:rounded-2xl px-6 pt-6 pb-24 md:pb-6 border border-black/[0.08] dark:border-white/[0.15] shadow-2xl relative"
                style={{
                    backdropFilter: "blur(64px) saturate(180%)",
                    WebkitBackdropFilter: "blur(64px) saturate(180%)",
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer transition-colors duration-200"
                >
                    <X size={20} />
                </button>

                <h2 className="text-lg font-bold mb-1 text-[#0E1116] dark:text-[#e8edf4] pr-8">
                    Add a Friend
                </h2>
                <p className="text-sm text-[#8B949E] mb-5">
                    Enter their email address to send a friend request.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="email"
                        placeholder="friend@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0E1116] border border-gray-200 dark:border-[#30363D] text-[#0E1116] dark:text-white placeholder-gray-400 dark:placeholder-[#8B949E] transition-colors duration-200 focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/30 focus:outline-none"
                    />

                    {error && (
                        <p className="text-xs text-red-500 font-medium px-1">{error}</p>
                    )}

                    {success && (
                        <p className="text-xs text-green-400 font-medium px-1">
                            Friend request sent!
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-[#E85D2A] hover:bg-[#D14E1F] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? "Sending\u2026" : "Send Request"}
                    </button>
                </form>

                {/* Invite Friends */}
                <div className="border-t border-gray-200 dark:border-[#30363D] my-5" />
                <p className="text-sm font-semibold text-[#0E1116] dark:text-[#C9D1D9] mb-3">Invite Friends</p>
                <div className="flex gap-3">
                    <button
                        onClick={handleCopyLink}
                        className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-[#30363D] hover:border-[#E85D2A] cursor-pointer transition-colors duration-200"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-[#8B949E]">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="text-xs text-gray-400 dark:text-[#8B949E]">Copy Link</span>
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-[#30363D] hover:border-[#E85D2A] cursor-pointer transition-colors duration-200"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 dark:text-[#8B949E]">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-xs text-gray-400 dark:text-[#8B949E]">WhatsApp</span>
                    </button>
                    <button
                        onClick={handleTwitter}
                        className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-[#30363D] hover:border-[#E85D2A] cursor-pointer transition-colors duration-200"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 dark:text-[#8B949E]">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="text-xs text-gray-400 dark:text-[#8B949E]">X / Twitter</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
