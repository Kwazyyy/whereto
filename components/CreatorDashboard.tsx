"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function CreatorDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [bio, setBio] = useState("");
    const [instagram, setInstagram] = useState("");
    const [tiktok, setTiktok] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user?.id) return;

        fetch(`/api/creators/${session.user.id}/analytics`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) setStats(data);
            })
            .finally(() => setLoading(false));

        fetch(`/api/creators/${session.user.id}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.creator) {
                    setBio(data.creator.creatorBio || "");
                    setInstagram(data.creator.instagramHandle || "");
                    setTiktok(data.creator.tiktokHandle || "");
                }
            });
    }, [session?.user?.id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch("/api/creators/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creatorBio: bio,
                    instagramHandle: instagram,
                    tiktokHandle: tiktok
                })
            });
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="bg-white dark:bg-[#161B22] rounded-3xl p-5 border border-gray-100 dark:border-white/5 shadow-sm mt-8 w-full max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#0E1116] dark:text-[#e8edf4] flex items-center gap-2">
                    <span className="text-[#E85D2A] bg-[#E85D2A]/10 p-1.5 rounded-lg border border-[#E85D2A]/20">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    Creator Dashboard
                </h3>
                <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-semibold text-[#E85D2A] px-2 py-1 hover:bg-[#E85D2A]/10 rounded-md transition-colors">
                    {isEditing ? "Cancel" : "Edit Profile"}
                </button>
            </div>

            {isEditing ? (
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Bio (Max 200 chars)</label>
                        <textarea maxLength={200} value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1C2128] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2A]/50 text-[#0E1116] dark:text-[#e8edf4]" rows={3} placeholder="Tell us about your food journey..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Instagram</label>
                            <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" className="w-full bg-gray-50 dark:bg-[#1C2128] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2A]/50 text-[#0E1116] dark:text-[#e8edf4]" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">TikTok</label>
                            <input type="text" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" className="w-full bg-gray-50 dark:bg-[#1C2128] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2A]/50 text-[#0E1116] dark:text-[#e8edf4]" />
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className="mt-2 w-full py-3.5 rounded-xl bg-[#E85D2A] text-white font-bold text-sm hover:bg-[#d65223] transition-colors">
                        {isSaving ? "Saving..." : "Save Profile"}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 dark:bg-[#1C2128] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl font-bold text-[#0E1116] dark:text-white flex items-center gap-1">
                                {stats?.totalFollowers || 0}
                                {(stats?.followerGrowth || 0) > 0 && (
                                    <span className="text-[10px] text-green-500 flex items-center bg-green-500/10 px-1 py-0.5 rounded">↑ {stats.followerGrowth}</span>
                                )}
                            </div>
                            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-1">Followers</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#1C2128] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl font-bold text-[#0E1116] dark:text-white flex items-center gap-1">
                                {stats?.totalViews || "—"}
                            </div>
                            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-1">Profile Views</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#1C2128] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl font-bold text-[#0E1116] dark:text-white">{stats?.totalSaves || 0}</div>
                            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-1">Places Saved</div>
                        </div>
                    </div>

                    {stats?.topPlaces && stats.topPlaces.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Your Top Places (By saves)</h4>
                            <div className="flex flex-col gap-2">
                                {stats.topPlaces.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 py-2.5 px-3 rounded-xl border border-gray-100 dark:border-white/5 text-sm shadow-sm">
                                        <span className="font-semibold text-[#0E1116] dark:text-[#e8edf4] truncate pr-4">{p.name}</span>
                                        <span className="text-[#E85D2A] font-bold shrink-0">{p.saves} saves</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
