"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bookmark, ClipboardList, Compass, ArrowRight } from "lucide-react";
import { SavedPlace } from "@/lib/saved-places";
import { usePhotoUrl } from "@/lib/use-photo-url";
import { useToast } from "@/components/Toast";
import { TabTooltip } from "@/components/onboarding/TabTooltip";
import { normalizeIntent, intentLabel } from "@/lib/intents";

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

const CATEGORIES = [
  { label: "All", value: "All" },
  { label: "Romantic", value: "romantic" },
  { label: "Chill Vibes", value: "chill" },
  { label: "Study Spots", value: "study_spots" },
  { label: "Budget Eats", value: "budget_eats" },
  { label: "Hidden Gems", value: "hidden_gems" },
  { label: "Brunch", value: "brunch" },
  { label: "Patios", value: "patios" },
  { label: "Coffee", value: "coffee" },
  { label: "Late Night", value: "late_night" },
  { label: "Groups", value: "groups" },
];

/* ── Board Card (Section 1) ────────────────────────────────────── */

function BoardCardPhoto({ photoRef }: { photoRef: string | null }) {
  const photoUrl = usePhotoUrl(photoRef);
  if (!photoUrl) return null;
  return (
    <Image
      src={photoUrl}
      alt=""
      fill
      className="object-cover"
      unoptimized
    />
  );
}

function BoardCard({
  intent,
  label,
  items,
  index,
}: {
  intent: string;
  label: string;
  items: SavedPlace[];
  index: number;
}) {
  const hasPlaces = items.length > 0;
  const previewRef = hasPlaces ? items[0].photoRef ?? null : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/boards/${intent}`} className="block cursor-pointer">
        <div className="aspect-[4/5] rounded-xl overflow-hidden relative hover:scale-[1.02] transition-transform duration-200">
          {hasPlaces ? (
            <>
              <BoardCardPhoto photoRef={previewRef} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-semibold text-sm line-clamp-1 capitalize">
                  {label}
                </h3>
                <p className="text-white/60 text-xs mt-0.5">
                  {items.length} place{items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-[#F6F8FA] dark:bg-[#161B22] border-2 border-dashed border-[#D0D7DE] dark:border-[#30363D] rounded-xl flex flex-col items-center justify-center">
              <Bookmark className="w-8 h-8 text-[#D0D7DE] dark:text-[#30363D]" />
              <span className="text-[#656D76] dark:text-[#8B949E] text-xs mt-2">
                No saves yet
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Saved List Card (Section 2) ───────────────────────────────── */

function SavedListCard({
  list,
  onUnsave,
  index,
}: {
  list: CuratedListSummary;
  onUnsave: (id: string) => void;
  index: number;
}) {
  const photoUrl = usePhotoUrl(list.heroImage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/boards/list/${list.id}`} className="block cursor-pointer">
        <div className="aspect-[4/5] rounded-xl overflow-hidden relative hover:scale-[1.02] transition-transform duration-200">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={list.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#E85D2A]/30 to-[#161B22]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Bookmark badge */}
          <div className="absolute top-2.5 right-2.5">
            <button
              className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-black/50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnsave(list.id);
              }}
            >
              <Bookmark className="w-4 h-4 fill-[#E85D2A] text-[#E85D2A]" />
            </button>
          </div>

          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm line-clamp-1">
              {list.title}
            </h3>
            <p className="text-white/60 text-xs mt-0.5">
              by @{list.creator.name}
            </p>
            <p className="text-white/60 text-xs">
              {list.stats.places} place{list.stats.places !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Featured List Card (Section 3) ────────────────────────────── */

function FeaturedListCard({
  list,
  isSaved,
  onToggleSave,
  index,
}: {
  list: CuratedListSummary;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  index: number;
}) {
  const photoUrl = usePhotoUrl(list.heroImage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/boards/list/${list.id}`} className="block cursor-pointer">
        <div className="aspect-[4/5] rounded-xl overflow-hidden relative hover:scale-[1.02] transition-transform duration-200">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={list.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1e] to-[#2a1711]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Bookmark toggle */}
          <div className="absolute top-2.5 right-2.5">
            <button
              className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-black/50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(list.id);
              }}
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isSaved
                    ? "fill-[#E85D2A] text-[#E85D2A]"
                    : "fill-none text-white/60"
                }`}
              />
            </button>
          </div>

          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm line-clamp-1">
              {list.title}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              {list.creator.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={list.creator.image}
                  alt=""
                  className="w-4 h-4 rounded-full shrink-0 object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-600 shrink-0" />
              )}
              <span className="text-white/60 text-xs truncate">
                {list.creator.name}
                {list.creator.isVerified && " \u2713"}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-white/60 text-xs">
              <Bookmark className="w-3 h-3" />
              <span>{list.stats.saves}</span>
              <span>·</span>
              <span>
                {list.stats.places} place{list.stats.places !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export default function BoardsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [saves, setSaves] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const [savedLists, setSavedLists] = useState<CuratedListSummary[]>([]);
  const [savedListIds, setSavedListIds] = useState<Set<string>>(new Set());
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
        .then((d) => {
          const lists = d.lists || [];
          setSavedLists(lists);
          setSavedListIds(new Set(lists.map((l: CuratedListSummary) => l.id)));
        })
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

  const handleToggleSave = async (listId: string) => {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }
    const wasSaved = savedListIds.has(listId);
    const method = wasSaved ? "DELETE" : "POST";

    // Optimistic update
    setSavedListIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(listId);
      else next.add(listId);
      return next;
    });
    if (wasSaved) {
      setSavedLists((prev) => prev.filter((l) => l.id !== listId));
    } else {
      const matched = featuredLists.find((l) => l.id === listId);
      if (matched) setSavedLists((prev) => [matched, ...prev]);
    }

    try {
      const res = await fetch(`/api/curated-lists/${listId}/save`, { method });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      setSavedListIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(listId);
        else next.delete(listId);
        return next;
      });
      if (!wasSaved) {
        setSavedLists((prev) => prev.filter((l) => l.id !== listId));
      }
    }
  };

  const handleUnsave = async (listId: string) => {
    const removed = savedLists.find((l) => l.id === listId);
    setSavedLists((prev) => prev.filter((l) => l.id !== listId));
    setSavedListIds((prev) => {
      const next = new Set(prev);
      next.delete(listId);
      return next;
    });

    try {
      const res = await fetch(`/api/curated-lists/${listId}/save`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      showToast("List removed from saved", "success");
    } catch {
      if (removed) setSavedLists((prev) => [removed, ...prev]);
      setSavedListIds((prev) => {
        const next = new Set(prev);
        next.add(listId);
        return next;
      });
    }
  };

  /* ── Loading state ─────────────────────────────────────────── */
  if (status === "loading") {
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0E1116] flex items-center justify-center pb-32 lg:pb-6">
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  /* ── Unauthenticated → redirect to /auth ─────────────────── */
  if (status === "unauthenticated") {
    router.replace("/auth");
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  /* ── Group saves by intent (normalize legacy → current) ───── */
  const groupedSaves: Record<string, SavedPlace[]> = {};
  saves.forEach((save) => {
    if (save.intent === "recs_from_friends") return;
    const raw = save.intent || "uncategorized";
    const intent = normalizeIntent(raw);
    if (!groupedSaves[intent]) groupedSaves[intent] = [];
    groupedSaves[intent].push(save);
  });

  const intents = Object.keys(groupedSaves).sort((a, b) =>
    a.localeCompare(b)
  );

  const hasSavedLists = savedLists.length > 0;

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0E1116] pb-32 lg:pb-6">
      <TabTooltip
        storageKey="hasSeenBoardsTooltips"
        steps={[
          { title: "Your Saved Spots", description: "Every place you swipe right on lands here, sorted by vibe.", animationKey: "boards-saved" },
        ]}
      />
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        {/* ── Page Header ────────────────────────────────────── */}
        <div className="pt-2 lg:pt-10">
          <h1 className="text-2xl font-bold text-[#0E1116] dark:text-white">
            My Boards
          </h1>
          <p className="text-[#656D76] dark:text-[#8B949E] text-sm mt-1">
            Your saved places, organized by mood
          </p>
        </div>

        {/* ── Section 1: My Boards ───────────────────────────── */}
        <div className="mt-8">
          {intents.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12">
              <Compass size={48} className="text-[#8B949E] mb-4 mx-auto" />
              <h2 className="text-xl font-semibold text-[#0E1116] dark:text-white mb-2">
                Start discovering
              </h2>
              <p className="text-[#8B949E] text-sm max-w-[300px] mx-auto mb-6">
                Swipe right on places you love and they&apos;ll appear here, organized by mood.
              </p>
              <Link href="/">
                <div className="bg-[#E85D2A] hover:bg-[#D14E1F] text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 inline-flex items-center gap-2">
                  Explore now
                  <ArrowRight size={16} />
                </div>
              </Link>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4"
              initial="hidden"
              animate="visible"
            >
              {intents.map((intent, i) => {
                const items = groupedSaves[intent];
                const label = intentLabel(intent);
                return (
                  <BoardCard
                    key={intent}
                    intent={intent}
                    label={label}
                    items={items}
                    index={i}
                  />
                );
              })}
            </motion.div>
          )}
        </div>

        {/* ── Divider ────────────────────────────────────────── */}
        {(hasSavedLists || true) && (
          <div className="border-t border-[#D0D7DE]/50 dark:border-[#30363D]/50 mt-8 pt-8" />
        )}

        {/* ── Section 2: Saved Lists ─────────────────────────── */}
        {hasSavedLists && (
          <>
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-[#0E1116] dark:text-white">
                Saved Lists
              </h2>
              <span className="text-[#656D76] dark:text-[#8B949E] text-sm ml-2">
                ({savedLists.length})
              </span>
            </div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 mt-4"
              initial="hidden"
              animate="visible"
            >
              {savedLists.map((list, i) => (
                <SavedListCard
                  key={list.id}
                  list={list}
                  onUnsave={handleUnsave}
                  index={i}
                />
              ))}
            </motion.div>

            {/* Divider between Section 2 and 3 */}
            <div className="border-t border-[#D0D7DE]/50 dark:border-[#30363D]/50 mt-8 pt-8" />
          </>
        )}

        {/* ── Section 3: Featured Lists ──────────────────────── */}
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#0E1116] dark:text-white">
              Featured Lists
            </h2>
            <Link
              href="/lists"
              className="text-[#656D76] dark:text-[#8B949E] hover:text-[#E85D2A] dark:hover:text-[#E85D2A] text-sm cursor-pointer transition-colors duration-200"
            >
              See all &rarr;
            </Link>
          </div>

          {/* Category filter chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mt-3 mb-4 -mx-4 px-4 lg:-mx-6 lg:px-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all duration-200 ${
                  selectedCategory === cat.value
                    ? "bg-[#E85D2A] text-white"
                    : "bg-[#F6F8FA] dark:bg-[#1C2128] text-[#656D76] dark:text-[#8B949E] border border-gray-200 dark:border-[#30363D] hover:border-[#E85D2A] hover:text-[#E85D2A]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {featuredLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 dark:text-[#8B949E]" />
              <p className="text-gray-500 dark:text-[#8B949E] text-sm mt-4 max-w-sm">
                Lists from Toronto&apos;s best food creators are on the way!
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4"
              initial="hidden"
              animate="visible"
            >
              {featuredLists.map((list, i) => (
                <FeaturedListCard
                  key={list.id}
                  list={list}
                  isSaved={savedListIds.has(list.id)}
                  onToggleSave={handleToggleSave}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
