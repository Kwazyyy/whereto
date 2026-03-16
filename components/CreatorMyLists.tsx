import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/Toast";

interface ListSummary {
    id: string;
    title: string;
    description: string | null;
    category: string;
    isPublic: boolean;
    createdAt: string;
    stats: {
        places: number;
        saves: number;
    };
    heroImage: string | null;
}

const CATEGORIES = ["date-night", "study-spots", "budget-eats", "hidden-gems", "brunch", "patios", "coffee", "late-night", "groups"];

export function CreatorMyLists() {
    const [lists, setLists] = useState<ListSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [createSheetOpen, setCreateSheetOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ListSummary | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchLists = async () => {
        try {
            const res = await fetch("/api/curated-lists/mine");
            if (res.ok) {
                const data = await res.json();
                setLists(data.lists || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLists();
    }, []);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/curated-lists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDescription,
                    category: newCategory,
                }),
            });
            if (res.ok) {
                setCreateSheetOpen(false);
                setNewTitle("");
                setNewDescription("");
                setNewCategory(CATEGORIES[0]);
                fetchLists(); // Re-fetch
            } else {
                const d = await res.json();
                showToast(d.error || "Failed to create list", "error");
            }
        } catch {
            showToast("Network error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/curated-lists/${deleteTarget.id}`, { method: "DELETE" });
            if (res.ok) {
                setLists(prev => prev.filter(l => l.id !== deleteTarget.id));
                showToast("List deleted", "success");
            } else {
                try {
                    const data = await res.json();
                    showToast(data.error || "Failed to delete list", "error");
                } catch {
                    showToast(`Failed to delete list (${res.status})`, "error");
                }
            }
        } catch {
            showToast("Network error", "error");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    if (loading) return null; // or a tiny spinner

    return (
        <div className="w-full text-left">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">My Lists</h3>
            </div>

            {lists.length === 0 ? (
                <div className="bg-gray-50 dark:bg-[#161B22] border border-gray-100 dark:border-white/5 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500 font-medium mb-2">You haven&apos;t created any lists yet.</p>
                    <button
                        onClick={() => setCreateSheetOpen(true)}
                        className="bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer text-sm"
                    >
                        Create your first list
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {lists.map((list) => (
                        <div key={list.id} className="flex bg-gray-50 dark:bg-[#161B22] border border-gray-100 dark:border-white/5 rounded-2xl p-3 items-center gap-4 hover:bg-gray-100 dark:hover:bg-[#1C2128] transition-colors cursor-pointer group">
                            <Link href={`/boards/list/${list.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-[#0E1116] shrink-0 relative overflow-hidden">
                                    {list.heroImage ? (
                                        <Image src={list.heroImage} alt={list.title} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[#0E1116] dark:text-gray-100 text-sm truncate">{list.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${list.isPublic ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400"}`}>
                                            {list.isPublic ? "PUBLIC" : "DRAFT"}
                                        </span>
                                        <span className="text-[11px] text-gray-500 font-medium">{list.stats.places} places</span>
                                    </div>
                                </div>
                            </Link>
                            <button
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(list); }}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                                title="Delete list"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                        </div>
                    ))}

                    <button onClick={() => setCreateSheetOpen(true)} className="border border-dashed border-gray-200 dark:border-[#30363D] hover:border-[#E85D2A] rounded-lg py-3 px-4 text-sm text-[#8B949E] hover:text-[#E85D2A] transition-colors duration-200 cursor-pointer w-full text-center mt-2">
                        + New List
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-[#161B22] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
                        <h2 className="text-lg font-semibold text-white">Delete this list?</h2>
                        <p className="text-gray-400 text-sm mt-2">
                            This will permanently delete &ldquo;{deleteTarget.title}&rdquo; and remove all its places. This can&apos;t be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 bg-white/5 text-gray-300 px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Sheet Modal */}
            {createSheetOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end flex-col">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreateSheetOpen(false)} />
                    <div className="relative bg-white dark:bg-[#161B22] rounded-t-3xl p-6 w-full max-w-xl mx-auto animate-slide-up pb-safe shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Create List</h2>
                            <button onClick={() => setCreateSheetOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Best Late Night Bites"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full bg-white dark:bg-[#0E1116] border border-[#D0D7DE] dark:border-[#30363D] rounded-lg px-4 py-3 text-sm text-[#0E1116] dark:text-white placeholder-[#656D76] dark:placeholder-[#8B949E] focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                                <textarea
                                    placeholder="What makes this list special?"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="w-full bg-white dark:bg-[#0E1116] border border-[#D0D7DE] dark:border-[#30363D] rounded-lg px-4 py-3 text-sm text-[#0E1116] dark:text-white placeholder-[#656D76] dark:placeholder-[#8B949E] focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200 resize-none h-24"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                                <div className="relative flex items-center">
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#0E1116] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#0E1116] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E85D2A] appearance-none"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat.replace("-", " ")}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 pointer-events-none text-gray-400">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={isSubmitting || !newTitle.trim()}
                                className="w-full bg-[#E85D2A] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl mt-4"
                            >
                                {isSubmitting ? "Creating..." : "Create List"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
