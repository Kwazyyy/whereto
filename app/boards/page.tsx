"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { SavedPlace } from "@/lib/saved-places";
import { usePhotoUrl } from "@/lib/use-photo-url";

const INTENT_LABELS: Record<string, string> = {
  study: "Study / Work",
  date: "Date / Chill",
  trending: "Trending Now",
  quiet: "Quiet Cafes",
  laptop: "Laptop-Friendly",
  group: "Group Hangouts",
  budget: "Budget Eats",
  coffee: "Coffee & Catch-Up",
  outdoor: "Outdoor / Patio",
};

interface CreatorInfo {
  id: string;
  name: string;
  image: string;
  isVerified: boolean;
}

interface CuratedListSummary {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  creator: CreatorInfo;
  stats: {
    places: number;
    saves: number;
  };
  heroImage: string | null;
}

const CATEGORIES = ["All", "Date Night", "Study Spots", "Budget Eats", "Hidden Gems", "Brunch", "Patios", "Coffee", "Late Night", "Groups"];

function ChevronLeftIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function GridIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function BoardCard({ intent, label, items }: { intent: string; label: string; items: SavedPlace[] }) {
  const previewItem = items[0];
  const photoUrl = usePhotoUrl(previewItem?.photoRef ?? null);

  return (
    <Link href={`/boards/${intent}`} className="block">
      <div className="bg-white dark:bg-[#161B22] rounded-2xl overflow-hidden border shadow-sm cursor-pointer group border-gray-100 dark:border-white/10">
        <div className="h-32 w-full relative bg-gray-100 dark:bg-[#1C2128]">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={label}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
              <GridIcon size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-bold text-lg text-white capitalize drop-shadow-md">{label}</h3>
            <p className="text-sm text-gray-200 drop-shadow-md">{items.length} place{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BoardsPage() {
  const { status } = useSession();
  const [saves, setSaves] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const [savedLists, setSavedLists] = useState<CuratedListSummary[]>([]);
  const [featuredLists, setFeaturedLists] = useState<CuratedListSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      fetch("/api/saves")
        .then((r) => r.json())
        .then((data: SavedPlace[]) => {
          if (Array.isArray(data)) {
            setSaves(data);
          } else {
            setSaves([]);
          }
          setLoading(false);
        })
        .catch(() => {
          setSaves([]);
          setLoading(false);
        });

      fetch("/api/curated-lists/saved")
        .then((r) => r.json())
        .then((d) => setSavedLists(d.lists || []))
        .catch(console.error);

      // Fetch featured
      fetch(`/api/curated-lists?category=${encodeURIComponent(selectedCategory)}`)
        .then((r) => r.json())
        .then((d) => setFeaturedLists(d.lists || []))
        .catch(console.error);

    } else {
      setLoading(false);
    }
  }, [status, selectedCategory]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0E1116] flex flex-col items-center justify-center pb-16">
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-24">
        <header className="flex items-center px-5 pt-5 pb-4 sticky top-0 bg-white/80 dark:bg-[#0E1116]/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-white/10">
          <h1 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Your Boards</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-8 pt-24 text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#161B22] flex items-center justify-center">
            <GridIcon size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Sign in to view your boards</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs">
              Save places while discovering to create boards grouped by your vibe.
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-white dark:bg-[#161B22] border-2 border-gray-200 dark:border-white/10 font-semibold text-sm text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-[#1C2128] transition-colors cursor-pointer"
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
      </div>
    );
  }

  // Group by intent
  const groupedSaves: Record<string, SavedPlace[]> = {};
  saves.forEach((save) => {
    // Only group by assigned intents or uncategorized. Re-routing recs back into standard boards or omitting them here.
    if (save.intent === "recs_from_friends") return;

    const intent = save.intent || "uncategorized";
    if (!groupedSaves[intent]) groupedSaves[intent] = [];
    groupedSaves[intent].push(save);
  });

  const intents = Object.keys(groupedSaves).sort((a, b) => {
    return a.localeCompare(b);
  });

  const BOARD_LABELS: Record<string, string> = {
    ...INTENT_LABELS,
  };

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-24">
      <header className="flex items-center px-5 pt-5 pb-4 sticky top-0 bg-white/80 dark:bg-[#0E1116]/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-white/10">
        <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#161B22] transition-colors cursor-pointer">
          <div className="text-[#0E1116] dark:text-[#e8edf4]">
            <ChevronLeftIcon size={24} />
          </div>
        </Link>
        <h1 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4] ml-2 flex-1">Your Boards</h1>
      </header>

      <div className="px-5 pt-6">
        {intents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
              <GridIcon size={32} />
            </div>
            <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4] mb-2">No boards yet</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Save places while discovering to automatically create boards based on your intentions!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intents.map((intent) => {
              const items = groupedSaves[intent];
              const label = BOARD_LABELS[intent] || intent;
              return <BoardCard key={intent} intent={intent} label={label} items={items} />;
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Saved Lists */}
      {savedLists.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4] px-5 mb-4">Saved Lists</h2>
          <div className="flex overflow-x-auto hide-scrollbar pl-5 pr-5 pb-4 gap-4">
            {savedLists.map((list) => (
              <Link key={list.id} href={`/boards/list/${list.id}`} className="block shrink-0 w-[200px]">
                <div className="h-[140px] w-full rounded-2xl overflow-hidden relative bg-gray-100 dark:bg-[#1C2128] shadow-sm border border-gray-100 dark:border-white/5">
                  {list.heroImage && (
                    <Image src={list.heroImage} alt={list.title} fill className="object-cover" unoptimized />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{list.title}</h3>
                    <p className="text-[11px] font-medium text-gray-300 mt-1">
                      {list.creator.name} {list.creator.isVerified && '✓'} · {list.stats.places} places
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Featured Lists */}
      <div className="mt-12 px-5 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">Featured Lists</h2>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-4 mb-2 -mx-5 px-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat
                ? "bg-[#0E1116] dark:bg-white text-white dark:text-[#0E1116]"
                : "bg-gray-100 dark:bg-[#161B22] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {featuredLists.length === 0 ? (
          <div className="text-center py-12 px-6 bg-gray-50 dark:bg-[#161B22] rounded-3xl border border-gray-100 dark:border-white/5 mt-2">
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Lists from Toronto&apos;s best food creators are on the way! Check back soon. 📋</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {featuredLists.map((list) => (
              <Link key={list.id} href={`/boards/list/${list.id}`} className="block group">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden relative bg-gray-100 dark:bg-[#1C2128] shadow-sm border border-gray-100 dark:border-white/5">
                  {list.heroImage && (
                    <Image
                      src={list.heroImage}
                      alt={list.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md rounded-full px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                    {list.category.replace("-", " ")}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-sm mb-2 leading-tight line-clamp-2 drop-shadow-md">
                      {list.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {list.creator.image ? (
                          <Image src={list.creator.image} alt="Avatar" width={16} height={16} className="rounded-full shrink-0 object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-600 shrink-0" />
                        )}
                        <span className="text-[10px] font-semibold text-gray-200 truncate pr-1">
                          {list.creator.name.split(" ")[0]} {list.creator.isVerified && '✓'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white shrink-0 bg-black/20 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                        <span className="flex items-center gap-0.5">❤️ {list.stats.saves}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
