"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Friend {
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
}

type Screen = "menu" | "pick_friend" | "write_note" | "sent";

export function ShareModal({
    place,
    onClose,
}: {
    place: { placeId: string; name: string };
    onClose: () => void;
}) {
    const [screen, setScreen] = useState<Screen>("menu");
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [note, setNote] = useState("");
    const [sending, setSending] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Fetch friends when picking
    useEffect(() => {
        if (screen !== "pick_friend") return;
        setFriendsLoading(true);
        fetch("/api/friends")
            .then((r) => r.ok ? r.json() : { friends: [] })
            .then((data: { friends: Friend[] }) => setFriends(data.friends ?? []))
            .catch(() => setFriends([]))
            .finally(() => setFriendsLoading(false));
    }, [screen]);

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(
                `${window.location.origin}/places/${place.placeId}`
            );
            setCopySuccess(true);
            setTimeout(onClose, 1400);
        } catch {
            // Fallback: select text
            setCopySuccess(true);
            setTimeout(onClose, 1400);
        }
    }

    async function handleSend() {
        if (!selectedFriend) return;
        setSending(true);
        try {
            await fetch("/api/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiverId: selectedFriend.userId,
                    googlePlaceId: place.placeId,
                    note: note.trim() || undefined,
                }),
            });
            setScreen("sent");
        } catch {
            // ignore
            setSending(false);
        }
    }

    function pickFriend(friend: Friend) {
        setSelectedFriend(friend);
        setScreen("write_note");
    }

    const slideVariants = {
        initial: { x: "100%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "-30%", opacity: 0 },
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-t-3xl overflow-hidden"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 380 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mt-4 mb-1" />

                <AnimatePresence mode="wait">
                    {/* ── Menu ── */}
                    {screen === "menu" && (
                        <motion.div
                            key="menu"
                            className="px-6 pt-3 pb-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <h2 className="text-lg font-bold text-[#1B2A4A] dark:text-[#e8edf4] mb-1">{place.name}</h2>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Share this place</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-[#22223b] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/15 flex items-center justify-center shrink-0">
                                        {copySuccess ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-[#1B2A4A] dark:text-[#e8edf4]">
                                            {copySuccess ? "Link copied!" : "Copy Link"}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Share with anyone</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setScreen("pick_friend")}
                                    className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#E85D2A] flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-[#1B2A4A] dark:text-[#e8edf4]">Send to a Friend</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Add a personal note</p>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0">
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Pick Friend ── */}
                    {screen === "pick_friend" && (
                        <motion.div
                            key="pick_friend"
                            className="px-6 pt-3 pb-10"
                            variants={slideVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ type: "spring", damping: 22, stiffness: 380 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <button onClick={() => setScreen("menu")} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>
                                <h2 className="text-base font-bold text-[#1B2A4A] dark:text-[#e8edf4]">Send to a Friend</h2>
                            </div>

                            {friendsLoading ? (
                                <div className="flex flex-col gap-2.5">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-2xl animate-pulse bg-gray-50 dark:bg-[#22223b]">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                                            <div className="w-32 h-4 bg-gray-200 dark:bg-white/10 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    No friends yet. Add friends first!
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                    {friends.map((f) => (
                                        <button
                                            key={f.userId}
                                            onClick={() => pickFriend(f)}
                                            className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gray-50 dark:bg-[#22223b] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-left w-full"
                                        >
                                            {f.image ? (
                                                <Image src={f.image} alt={f.name ?? ""} width={40} height={40} className="rounded-full shrink-0 object-cover" unoptimized />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[#E85D2A] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {f.name?.[0]?.toUpperCase() ?? "?"}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4] truncate">{f.name ?? f.email}</p>
                                                {f.name && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{f.email}</p>}
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Write Note ── */}
                    {screen === "write_note" && selectedFriend && (
                        <motion.div
                            key="write_note"
                            className="px-6 pt-3 pb-10"
                            variants={slideVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ type: "spring", damping: 22, stiffness: 380 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <button onClick={() => setScreen("pick_friend")} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>
                                <h2 className="text-base font-bold text-[#1B2A4A] dark:text-[#e8edf4]">Adding a note</h2>
                            </div>

                            <div className="flex items-center gap-2.5 mb-4 p-3 rounded-2xl bg-gray-50 dark:bg-[#22223b]">
                                {selectedFriend.image ? (
                                    <Image src={selectedFriend.image} alt={selectedFriend.name ?? ""} width={36} height={36} className="rounded-full object-cover shrink-0" unoptimized />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {selectedFriend.name?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                )}
                                <p className="text-sm font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">
                                    Sending <span className="text-[#E85D2A]">{place.name}</span> to {selectedFriend.name?.split(" ")[0] ?? selectedFriend.email}
                                </p>
                            </div>

                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value.slice(0, 120))}
                                placeholder="You'd love this place! (optional)"
                                rows={3}
                                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#22223b] text-sm text-[#1B2A4A] dark:text-[#e8edf4] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none border-2 border-transparent focus:border-[#E85D2A] transition-colors resize-none mb-1"
                            />
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right mb-4">{note.length}/120</p>

                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-opacity disabled:opacity-60 cursor-pointer"
                                style={{ backgroundColor: "#E85D2A" }}
                            >
                                {sending ? "Sending…" : "Send Recommendation"}
                            </button>
                        </motion.div>
                    )}

                    {/* ── Sent ── */}
                    {screen === "sent" && (
                        <motion.div
                            key="sent"
                            className="px-6 pt-6 pb-12 flex flex-col items-center text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-3xl">
                                ✅
                            </div>
                            <p className="text-lg font-bold text-[#1B2A4A] dark:text-[#e8edf4] mb-1">Sent!</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {selectedFriend?.name?.split(" ")[0] ?? "Your friend"} will see <span className="font-semibold text-[#1B2A4A] dark:text-[#e8edf4]">{place.name}</span> next time they open the app.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-8 py-2.5 rounded-full text-sm font-semibold text-white cursor-pointer"
                                style={{ backgroundColor: "#E85D2A" }}
                            >
                                Done
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
