"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/Toast";
import { PHOTO_CATEGORIES } from "@/lib/photo-categories";
import { relativeTime } from "@/lib/utils/time";

/* ─── Types ─── */
interface AdminPhoto {
  id: string;
  cloudinaryUrl: string;
  publicId: string;
  category: string;
  caption: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  place: { id: string; name: string; googlePlaceId: string; address: string | null };
  likeCount: number;
}

type StatusTab = "pending" | "approved" | "rejected" | "archived";

const TABS: { key: StatusTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
];

const categoryMap: Map<string, (typeof PHOTO_CATEGORIES)[number]> = new Map(PHOTO_CATEGORIES.map((c) => [c.id, c]));

/* ─── Admin Sub Nav ─── */
function AdminSubNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/business/admin", label: "Claims" },
    { href: "/business/admin/analytics", label: "Analytics" },
    { href: "/business/admin/photos", label: "Photos" },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/business/admin"
            ? pathname === "/business/admin"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              isActive
                ? "bg-[#E85D2A] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Skeleton ─── */
function PhotoSkeleton() {
  return (
    <div className="bg-[#161B22] rounded-xl overflow-hidden border border-white/5 animate-pulse">
      <div className="w-full h-48 bg-[#1C2128]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-8 bg-white/5 rounded w-full mt-3" />
      </div>
    </div>
  );
}

/* ─── Photo Card ─── */
function PhotoCard({
  photo,
  tab,
  onAction,
}: {
  photo: AdminPhoto;
  tab: StatusTab;
  onAction: (photoId: string, action: "approve" | "reject") => void;
}) {
  const cat = categoryMap.get(photo.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="bg-[#161B22] rounded-xl overflow-hidden border border-white/5"
    >
      {/* Image */}
      <div className="relative w-full max-h-[300px] overflow-hidden">
        <Image
          src={photo.cloudinaryUrl}
          alt={photo.caption || "Community photo"}
          width={600}
          height={400}
          className="w-full h-auto object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Category badge */}
        {cat && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[10px] font-medium text-white flex items-center gap-1">
            <span>{cat.icon}</span> {cat.label}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* Uploader */}
        <div className="flex items-center gap-2">
          {photo.user.avatarUrl ? (
            <img src={photo.user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-white font-bold">
              {photo.user.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{photo.user.name || "Anonymous"}</p>
            <p className="text-[10px] text-gray-500 truncate">{photo.user.email}</p>
          </div>
        </div>

        {/* Place */}
        <Link
          href={`/places/${photo.place.id}/photos`}
          className="text-xs text-[#E85D2A] hover:underline font-medium truncate block"
        >
          {photo.place.name}
        </Link>

        {/* Caption */}
        {photo.caption && (
          <p className="text-xs text-gray-400 italic truncate">&ldquo;{photo.caption}&rdquo;</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>{relativeTime(photo.createdAt)}</span>
          {photo.likeCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#E85D2A]">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {photo.likeCount}
              </span>
            </>
          )}
        </div>

        {/* Action buttons */}
        {(tab === "pending" || tab === "approved" || tab === "rejected") && (
          <div className="flex gap-2 pt-1">
            {(tab === "pending" || tab === "rejected") && (
              <button
                onClick={() => onAction(photo.id, "approve")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Approve
              </button>
            )}
            {(tab === "pending" || tab === "approved") && (
              <button
                onClick={() => onAction(photo.id, "reject")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function AdminPhotosPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<StatusTab, number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
  });

  // Fetch photos for active tab
  const fetchPhotos = useCallback(async (tab: StatusTab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/admin/photos?status=${tab}&limit=50`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch counts for all tabs
  const fetchCounts = useCallback(async () => {
    const results = await Promise.allSettled(
      TABS.map(async (t) => {
        const res = await fetch(`/api/business/admin/photos?status=${t.key}&limit=1`);
        if (!res.ok) return { key: t.key, count: 0 };
        const data = await res.json();
        return { key: t.key, count: data.total ?? 0 };
      })
    );

    const newCounts = { ...counts };
    for (const r of results) {
      if (r.status === "fulfilled") {
        newCounts[r.value.key as StatusTab] = r.value.count;
      }
    }
    setCounts(newCounts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPhotos(activeTab);
  }, [activeTab, fetchPhotos]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Handle approve/reject
  const handleAction = useCallback(
    async (photoId: string, action: "approve" | "reject") => {
      // Optimistic: remove from current view
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, prev[activeTab] - 1),
        [action === "approve" ? "approved" : "rejected"]:
          prev[action === "approve" ? "approved" : "rejected"] + 1,
      }));

      try {
        const res = await fetch("/api/business/admin/photos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId, action }),
        });

        if (!res.ok) {
          // Revert on failure
          fetchPhotos(activeTab);
          fetchCounts();
          showToast("Action failed — please try again", "error");
          return;
        }

        const data = await res.json();

        if (action === "approve") {
          showToast("Photo approved", "success");
          if (data.archived) {
            const archivedCat = categoryMap.get(
              photos.find((p) => p.id === photoId)?.category || ""
            );
            setTimeout(() => {
              showToast(
                `Oldest photo in ${archivedCat?.label || "category"} was archived to make room`
              );
            }, 2500);
          }
        } else {
          showToast("Photo rejected", "success");
        }
      } catch {
        fetchPhotos(activeTab);
        fetchCounts();
        showToast("Network error", "error");
      }
    },
    [activeTab, fetchPhotos, fetchCounts, showToast, photos]
  );

  const tabChange = (tab: StatusTab) => {
    setActiveTab(tab);
  };

  const emptyLabels: Record<StatusTab, string> = {
    pending: "No pending photos to review",
    approved: "No approved photos",
    rejected: "No rejected photos",
    archived: "No archived photos",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <AdminSubNav />

      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <h1 className="text-xl font-bold text-white">Photo Moderation</h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => tabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? "bg-[#E85D2A] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : tab.key === "pending"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PhotoSkeleton key={i} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">{emptyLabels[activeTab]}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                tab={activeTab}
                onAction={handleAction}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
