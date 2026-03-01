"use client";

import { useState } from "react";

export function AddFriendModal({
    onClose,
    onSent,
}: {
    onClose: () => void;
    onSent?: () => void;
}) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-[#161B22] rounded-t-3xl px-6 pt-4 pb-28"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-6" />

                <h2 className="text-lg font-bold mb-1 text-[#0E1116] dark:text-[#e8edf4]">
                    Add a Friend
                </h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
                    Enter their email address to send a friend request.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="email"
                        placeholder="friend@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#1C2128] text-sm font-medium outline-none border-2 border-transparent focus:border-[#E85D2A] transition-colors text-[#0E1116] dark:text-[#e8edf4] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />

                    {error && (
                        <p className="text-xs text-red-500 font-medium px-1">{error}</p>
                    )}

                    {success && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium px-1">
                            Friend request sent!
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-opacity disabled:opacity-50 cursor-pointer"
                        style={{ backgroundColor: "#E85D2A" }}
                    >
                        {loading ? "Sending…" : "Send Request"}
                    </button>
                </form>
            </div>
        </div>
    );
}
