"use client";

import Image from "next/image";
import { usePhotoUrl } from "@/lib/use-photo-url";
import type { CompatibilityResult, SharedPlace } from "@/lib/tasteScore";

export interface Friend {
    friendshipId: string;
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    friendsSince: string;
    compatibility?: CompatibilityResult | null;
}

export function scoreBadgeClass(score: number): string {
    if (score >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
    if (score >= 50) return "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400";
    return "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400";
}

export function Avatar({
    image,
    name,
    size = 44,
}: {
    image: string | null;
    name: string | null;
    size?: number;
}) {
    if (image) {
        return (
            <Image
                src={image}
                alt={name ?? ""}
                width={size}
                height={size}
                className="rounded-full shrink-0 object-cover"
                unoptimized
            />
        );
    }
    return (
        <div
            className="rounded-full bg-[#E85D2A] flex items-center justify-center text-white font-bold shrink-0"
            style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
            {name?.[0]?.toUpperCase() ?? "?"}
        </div>
    );
}

export function SharedPlaceCard({ place }: { place: SharedPlace }) {
    const photoUrl = usePhotoUrl(place.photoRef);
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1C2128] relative">
                {photoUrl ? (
                    <Image src={photoUrl} alt={place.name} fill className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0E1116] dark:text-[#e8edf4] truncate">{place.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{place.intent}</p>
            </div>
        </div>
    );
}

export function CompatibilityDrawer({
    friend,
    compat,
    onClose,
    onCompare,
}: {
    friend: Friend;
    compat: CompatibilityResult | null | undefined;
    onClose: () => void;
    onCompare: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-[#161B22] rounded-t-3xl px-6 pt-4 pb-28 max-h-[85dvh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-5" />

                <div className="flex items-center gap-3 mb-6">
                    <Avatar image={friend.image} name={friend.name} size={48} />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#0E1116] dark:text-[#e8edf4] truncate">{friend.name ?? friend.email}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Taste Compatibility</p>
                    </div>
                </div>

                {!compat ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }} />
                    </div>
                ) : compat.noData || compat.sharedCount === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center gap-3">
                        <div className="text-4xl">🗺️</div>
                        <p className="text-base font-semibold text-[#0E1116] dark:text-[#e8edf4]">Keep exploring!</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                            Save more places and discover your taste match with {friend.name?.split(" ")[0] ?? "your friend"}.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="relative flex items-center justify-center w-28 h-28">
                                <svg className="absolute inset-0" viewBox="0 0 110 110">
                                    <circle cx="55" cy="55" r="48" fill="none" stroke="#F3F4F6" strokeWidth="8" className="dark:stroke-white/10" />
                                    <circle
                                        cx="55" cy="55" r="48"
                                        fill="none"
                                        stroke={compat.score >= 80 ? "#22c55e" : compat.score >= 50 ? "#E85D2A" : "#9CA3AF"}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(compat.score / 100) * 301.6} 301.6`}
                                        transform="rotate(-90 55 55)"
                                    />
                                </svg>
                                <div className="text-center z-10">
                                    <p className="text-2xl font-black text-[#0E1116] dark:text-[#e8edf4] leading-none">{compat.score}%</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">match</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mb-6">
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1C2128]">
                                <span className="text-xl">🏠</span>
                                <p className="text-sm text-[#0E1116] dark:text-[#e8edf4] font-medium">
                                    You both saved <span className="font-bold">{compat.sharedCount} place{compat.sharedCount !== 1 ? "s" : ""}</span>
                                </p>
                            </div>

                            {compat.sharedIntents.length > 0 && (
                                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1C2128]">
                                    <span className="text-xl">✨</span>
                                    <div>
                                        <p className="text-sm text-[#0E1116] dark:text-[#e8edf4] font-medium">Top shared vibes</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{compat.sharedIntents.join(", ")}</p>
                                    </div>
                                </div>
                            )}

                            {compat.sharedPrice && (
                                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1C2128]">
                                    <span className="text-xl">💰</span>
                                    <p className="text-sm text-[#0E1116] dark:text-[#e8edf4] font-medium">
                                        You both love <span className="font-bold">{compat.sharedPrice}</span> restaurants
                                    </p>
                                </div>
                            )}
                        </div>

                        {compat.sharedPlaces.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                                    Shared Saves
                                </p>
                                <div className="divide-y divide-gray-100 dark:divide-white/8">
                                    {compat.sharedPlaces.map((p) => (
                                        <SharedPlaceCard key={p.placeId} place={p} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {compat && !compat.noData && (
                    <button
                        onClick={() => { onClose(); onCompare(); }}
                        className="w-full mt-6 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all outline-none"
                    >
                        <span className="text-xl">🗺️</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Compare Exploration Map</span>
                        <span className="text-gray-400">→</span>
                    </button>
                )}
            </div>
        </div>
    );
}
