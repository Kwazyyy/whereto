"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { CompareData } from "@/components/FriendCompareModal";

// ── Avatars ─────────────────────────────────────────────────────────────────

function CompareAvatar({ src, name, size, borderColor }: { src: string | null; name: string | null; size: number; borderColor: string }) {
  const bgClass = borderColor === "#E85D2A" ? "bg-[#E85D2A]/20 text-[#E85D2A]" : "bg-[#3B82F6]/20 text-[#3B82F6]";
  return (
    <div className={`rounded-full overflow-hidden border-2 shrink-0 relative`} style={{ width: size, height: size, borderColor }}>
      {src ? (
        <Image src={src} alt={name ?? ""} fill className="object-cover" unoptimized />
      ) : (
        <div className={`w-full h-full flex items-center justify-center font-bold ${bgClass}`} style={{ fontSize: size * 0.36 }}>
          {name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

function SmallAvatar({ src, name }: { src: string | null; name: string | null }) {
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 relative">
      {src ? (
        <Image src={src} alt={name ?? ""} fill className="object-cover" unoptimized />
      ) : (
        <div className="w-full h-full bg-[#30363D] flex items-center justify-center text-[10px] font-bold text-[#8B949E]">
          {name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ExplorationComparePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const friendId = params.friendId as string;

  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState("All");

  const ALL_AREAS = ["All", "Downtown", "West End", "East End", "Midtown", "North York", "Scarborough", "Etobicoke"];

  useEffect(() => {
    if (status !== "authenticated" || !friendId) return;
    setLoading(true);
    fetch(`/api/friends/${friendId}/exploration-compare`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(d => { setData(d); setError(null); })
      .catch(() => setError("Could not load comparison data."))
      .finally(() => setLoading(false));
  }, [status, friendId]);

  const combinedList = useMemo(() => {
    if (!data) return [];
    return data.user.neighborhoods.map((un, index) => {
      const fn = data.friend.neighborhoods[index];
      let s = 0;
      if (un.explored && fn.explored) s = 3;
      else if (un.explored && !fn.explored) s = 2;
      else if (!un.explored && fn.explored) s = 1;
      return { name: un.name, area: un.area, status: s };
    }).sort((a, b) => b.status - a.status);
  }, [data]);

  const filteredList = selectedArea === "All" ? combinedList : combinedList.filter(n => n.area === selectedArea);

  // Drag-to-scroll for area chips
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const lastClientX = useRef(0);
  const lastTimestamp = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);
  const isDragPreventClick = useRef(false);

  useEffect(() => {
    return () => { if (rafId.current !== null) cancelAnimationFrame(rafId.current); };
  }, []);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    isDragPreventClick.current = false;
    if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null; }
    if (!scrollRef.current) return;
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    startX.current = pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    lastClientX.current = pageX;
    lastTimestamp.current = performance.now();
    velocity.current = 0;
  };

  const applyMomentum = () => {
    if (!scrollRef.current) return;
    const friction = 0.95;
    const tick = () => {
      if (!scrollRef.current || Math.abs(velocity.current) < 0.1) { rafId.current = null; return; }
      scrollRef.current.scrollLeft -= velocity.current * 16;
      velocity.current *= friction;
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
  };

  const handleMouseLeaveOrUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(velocity.current) > 0.1) applyMomentum();
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    if (e.cancelable) e.preventDefault();
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const x = pageX - scrollRef.current.offsetLeft;
    const walk = x - startX.current;
    if (Math.abs(walk) > 5) isDragPreventClick.current = true;
    const now = performance.now();
    const dt = now - lastTimestamp.current;
    if (dt > 0) velocity.current = (pageX - lastClientX.current) / dt;
    lastClientX.current = pageX;
    lastTimestamp.current = now;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleChipClick = (area: string) => {
    if (isDragPreventClick.current) return;
    setSelectedArea(area);
  };

  // ── Loading / Error states ──

  if (status === "loading" || loading) {
    return (
      <div className="min-h-dvh bg-[#0E1116] px-6 pt-6 pb-24">
        <button onClick={() => router.push("/social")} className="text-sm text-[#8B949E] hover:text-white transition-colors cursor-pointer mb-6">
          &larr; Back to Social
        </button>
        <h1 className="text-2xl font-bold text-white mb-8">Exploration Comparison</h1>
        <div className="flex gap-8">
          <div className="w-full lg:w-[360px] space-y-4">
            <div className="h-20 bg-[#161B22] rounded-xl animate-pulse" />
            <div className="h-40 bg-[#161B22] rounded-xl animate-pulse" />
            <div className="h-32 bg-[#161B22] rounded-xl animate-pulse" />
          </div>
          <div className="hidden lg:block flex-1 space-y-4">
            <div className="h-10 bg-[#161B22] rounded-xl animate-pulse w-1/2" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-20 bg-[#161B22] rounded-xl animate-pulse" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh bg-[#0E1116] px-6 pt-6 pb-24">
        <button onClick={() => router.push("/social")} className="text-sm text-[#8B949E] hover:text-white transition-colors cursor-pointer mb-6">
          &larr; Back to Social
        </button>
        <div className="text-center py-20">
          <p className="text-white font-semibold mb-2">{error ?? "Something went wrong"}</p>
          <button onClick={() => router.push("/social")} className="text-sm text-[#E85D2A] hover:underline cursor-pointer">
            Return to Social
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ──

  const totalNeighborhoods = data.user.neighborhoods.length;
  const friendFirstName = data.friend.name?.split(" ")[0] || "Friend";

  let ctaTitle = "";
  let ctaDesc = "";
  if (data.user.totalExplored > data.friend.totalExplored) {
    ctaTitle = "You're in the lead!";
    ctaDesc = "Keep exploring to maintain your crown.";
  } else if (data.friend.totalExplored > data.user.totalExplored) {
    ctaTitle = "They're ahead!";
    ctaDesc = `Explore somewhere new to catch up to ${friendFirstName}!`;
  } else {
    ctaTitle = "You're neck and neck!";
    ctaDesc = "Who'll break the tie first?";
  }

  // ── Shared sections ──

  const VSHeader = (
    <div className="flex items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-1.5">
        <CompareAvatar src={data.user.avatarUrl} name={data.user.name} size={56} borderColor="#E85D2A" />
        <span className="text-xs font-semibold text-[#C9D1D9]">You</span>
      </div>
      <span className="text-sm font-bold text-[#8B949E]">vs</span>
      <div className="flex flex-col items-center gap-1.5">
        <CompareAvatar src={data.friend.avatarUrl} name={data.friend.name} size={56} borderColor="#3B82F6" />
        <span className="text-xs font-semibold text-[#C9D1D9]">{friendFirstName}</span>
      </div>
    </div>
  );

  const StatCards = (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <div className="bg-[#161B22] rounded-xl p-5 border border-[#30363D]">
        <div className="flex items-center gap-2 mb-3">
          <SmallAvatar src={data.user.avatarUrl} name={data.user.name} />
          <span className="text-sm text-[#8B949E]">You</span>
        </div>
        <p className="text-4xl font-bold text-[#E85D2A] mb-1">{data.user.totalExplored}</p>
        <p className="text-sm text-[#8B949E] mb-3">Neighborhoods Explored</p>
        <div className="w-full h-2 rounded-full bg-[#30363D]">
          <div className="h-full rounded-full bg-[#E85D2A] transition-all duration-500" style={{ width: `${data.user.percentage}%` }} />
        </div>
        <p className="text-xs text-[#8B949E] mt-1.5">{data.user.percentage}% of {totalNeighborhoods}</p>
      </div>
      <div className="bg-[#161B22] rounded-xl p-5 border border-[#30363D]">
        <div className="flex items-center gap-2 mb-3">
          <SmallAvatar src={data.friend.avatarUrl} name={data.friend.name} />
          <span className="text-sm text-[#8B949E]">{friendFirstName}</span>
        </div>
        <p className="text-4xl font-bold text-[#3B82F6] mb-1">{data.friend.totalExplored}</p>
        <p className="text-sm text-[#8B949E] mb-3">Neighborhoods Explored</p>
        <div className="w-full h-2 rounded-full bg-[#30363D]">
          <div className="h-full rounded-full bg-[#3B82F6] transition-all duration-500" style={{ width: `${data.friend.percentage}%` }} />
        </div>
        <p className="text-xs text-[#8B949E] mt-1.5">{data.friend.percentage}% of {totalNeighborhoods}</p>
      </div>
    </div>
  );

  const MobileStatCards = (
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="bg-[#161B22] rounded-xl p-4 border border-[#30363D]">
        <div className="flex items-center gap-2 mb-2">
          <SmallAvatar src={data.user.avatarUrl} name={data.user.name} />
          <span className="text-xs text-[#8B949E]">You</span>
        </div>
        <p className="text-3xl font-bold text-[#E85D2A] mb-0.5">{data.user.totalExplored}</p>
        <p className="text-xs text-[#8B949E] mb-2">Neighborhoods</p>
        <div className="w-full h-1.5 rounded-full bg-[#30363D]">
          <div className="h-full rounded-full bg-[#E85D2A] transition-all duration-500" style={{ width: `${data.user.percentage}%` }} />
        </div>
        <p className="text-[10px] text-[#8B949E] mt-1">{data.user.percentage}%</p>
      </div>
      <div className="bg-[#161B22] rounded-xl p-4 border border-[#30363D]">
        <div className="flex items-center gap-2 mb-2">
          <SmallAvatar src={data.friend.avatarUrl} name={data.friend.name} />
          <span className="text-xs text-[#8B949E]">{friendFirstName}</span>
        </div>
        <p className="text-3xl font-bold text-[#3B82F6] mb-0.5">{data.friend.totalExplored}</p>
        <p className="text-xs text-[#8B949E] mb-2">Neighborhoods</p>
        <div className="w-full h-1.5 rounded-full bg-[#30363D]">
          <div className="h-full rounded-full bg-[#3B82F6] transition-all duration-500" style={{ width: `${data.friend.percentage}%` }} />
        </div>
        <p className="text-[10px] text-[#8B949E] mt-1">{data.friend.percentage}%</p>
      </div>
    </div>
  );

  const OverlapSummary = (
    <div className="bg-[#161B22] rounded-xl p-5 border border-[#30363D] mt-6">
      <h3 className="text-xs font-semibold tracking-wider text-[#8B949E] uppercase mb-4">Exploration Overlap</h3>
      <div className="flex flex-col">
        <div className="flex items-center gap-3 py-2 border-b border-[#30363D]">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#E85D2A] to-[#3B82F6] shrink-0" />
          <span className="flex-1 text-sm lg:text-base text-[#C9D1D9]">Both Explored</span>
          <span className="text-sm lg:text-base font-semibold text-white">{data.shared}</span>
        </div>
        <div className="flex items-center gap-3 py-2 border-b border-[#30363D]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E85D2A] shrink-0" />
          <span className="flex-1 text-sm lg:text-base text-[#C9D1D9]">Only You</span>
          <span className="text-sm lg:text-base font-semibold text-[#E85D2A]">{data.onlyUser}</span>
        </div>
        <div className="flex items-center gap-3 py-2 border-b border-[#30363D]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
          <span className="flex-1 text-sm lg:text-base text-[#C9D1D9]">Only {friendFirstName}</span>
          <span className="text-sm lg:text-base font-semibold text-[#3B82F6]">{data.onlyFriend}</span>
        </div>
        <div className="flex items-center gap-3 py-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8B949E] shrink-0" />
          <span className="flex-1 text-sm lg:text-base text-[#C9D1D9]">Neither</span>
          <span className="text-sm lg:text-base font-semibold text-[#8B949E]">{data.neither}</span>
        </div>
      </div>
    </div>
  );

  const NudgeCard = (
    <div className="bg-[#1C2128] border border-[#30363D] rounded-xl p-4 mt-6">
      <p className="text-sm font-medium text-white">{ctaTitle}</p>
      <p className="text-xs text-[#8B949E] mt-0.5">{ctaDesc}</p>
      <Link
        href="/map"
        className="inline-flex mt-3 px-4 py-2 bg-[#E85D2A] hover:bg-[#D14E1F] text-white text-sm font-semibold rounded-lg transition-colors duration-200 cursor-pointer"
      >
        Explore &rarr;
      </Link>
    </div>
  );

  const AreaChips = (
    <div
      ref={scrollRef}
      className={`flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeaveOrUp}
      onMouseUp={handleMouseLeaveOrUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseLeaveOrUp}
      onTouchMove={handleMouseMove}
    >
      {ALL_AREAS.map(area => (
        <button
          key={area}
          onClick={() => handleChipClick(area)}
          className={`px-4 py-1.5 rounded-full text-sm lg:text-base whitespace-nowrap transition-colors duration-200 cursor-pointer ${selectedArea === area
            ? "bg-[#E85D2A] text-white border border-transparent"
            : "bg-[#1C2128] text-[#8B949E] border border-[#30363D] hover:border-[#8B949E]"
            }`}
        >
          {area}
        </button>
      ))}
    </div>
  );

  const Legend = (
    <div className="flex items-center gap-4 text-xs lg:text-sm text-[#8B949E] mt-3">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#E85D2A]" />
        <span>You</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
        <span>{friendFirstName}</span>
      </div>
    </div>
  );

  const NeighborhoodGrid = ({ cols }: { cols: string }) => (
    <div className={`grid ${cols} gap-3 mt-4 w-full`}>
      {filteredList.map(n => (
        <div key={n.name} className="bg-[#161B22] rounded-xl p-4 border border-[#30363D] hover:border-[#8B949E] transition-colors duration-200 relative">
          <p className="text-sm font-medium text-white pr-10 truncate">{n.name}</p>
          <p className="text-sm text-[#8B949E] mt-0.5">{n.area}</p>
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full ${n.status === 3 || n.status === 2 ? "bg-[#E85D2A]" : "bg-transparent border-2 border-[#E85D2A]/40"}`} />
            <div className={`w-3.5 h-3.5 rounded-full ${n.status === 3 || n.status === 1 ? "bg-[#3B82F6]" : "bg-transparent border-2 border-[#3B82F6]/40"}`} />
          </div>
        </div>
      ))}
    </div>
  );

  const MobileNeighborhoodGrid = (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {filteredList.map(n => (
        <div key={n.name} className="bg-[#161B22] rounded-xl p-3 border border-[#30363D] hover:border-[#8B949E] transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{n.name}</p>
              <p className="text-xs text-[#8B949E] mt-0.5">{n.area}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <div className={`w-3.5 h-3.5 rounded-full ${n.status === 3 || n.status === 2 ? "bg-[#E85D2A]" : "bg-transparent border-2 border-[#E85D2A]/40"}`} />
              <div className={`w-3.5 h-3.5 rounded-full ${n.status === 3 || n.status === 1 ? "bg-[#3B82F6]" : "bg-transparent border-2 border-[#3B82F6]/40"}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#0E1116] pb-24">
      {/* ── DESKTOP (lg:+) ── */}
      <div className="hidden lg:block max-w-6xl mx-auto px-6 pt-6">
        <button onClick={() => router.push("/social")} className="text-sm text-[#8B949E] hover:text-white transition-colors cursor-pointer mb-6">
          &larr; Back to Social
        </button>

        <div className="flex gap-8 items-start">
          {/* Left column — sticky */}
          <div className="w-[360px] shrink-0 sticky top-6 self-start pr-6">
            {VSHeader}
            {StatCards}
            {OverlapSummary}
            {NudgeCard}
          </div>

          {/* Right column */}
          <div className="flex-1 min-w-0 pb-10">
            <h1 className="text-3xl font-bold text-white">Exploration Comparison</h1>
            <div className="mt-4">{AreaChips}</div>
            {Legend}
            <NeighborhoodGrid cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
          </div>
        </div>
      </div>

      {/* ── MOBILE (<lg) ── */}
      <div className="lg:hidden px-5 pt-5 pb-10">
        <button onClick={() => router.push("/social")} className="text-sm text-[#8B949E] hover:text-white transition-colors cursor-pointer mb-4">
          &larr; Back
        </button>

        <h1 className="text-xl font-bold text-white">Exploration Comparison</h1>

        <div className="mt-4">{VSHeader}</div>
        {MobileStatCards}

        <div className="mt-4">{OverlapSummary}</div>

        <div className="mt-6">{AreaChips}</div>
        {Legend}
        {MobileNeighborhoodGrid}

        <div className="mt-6 mb-24">{NudgeCard}</div>
      </div>
    </div>
  );
}
