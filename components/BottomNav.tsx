"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Compass, Map, LayoutGrid, Users, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/boards", label: "Boards", Icon: LayoutGrid },
  { href: "/map", label: "Map", Icon: Map },
  { href: "/", label: "Discover", Icon: Compass, exact: true },
  { href: "/social", label: "Social", Icon: Users },
  { href: "/profile", label: "Profile", Icon: User },
];

// Separate client island for the unseen count badge
function UnseenBadge() {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    function fetchCount() {
      fetch("/api/recommendations/unseen-count")
        .then((r) => r.ok ? r.json() : { count: 0 })
        .then((d: { count: number }) => setCount(d.count))
        .catch(() => { });
    }
    fetchCount();
    function onVisible() { if (document.visibilityState === "visible") fetchCount(); }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status]);

  if (count === 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/landing" || pathname === "/welcome" || pathname.startsWith("/business") || pathname === "/for-business" || pathname.startsWith("/lists") || pathname === "/pro" || pathname === "/privacy" || pathname === "/terms" || pathname === "/auth" || pathname === "/onboarding" || (pathname.startsWith("/places/") && pathname.endsWith("/photos"))) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pb-8 lg:hidden" style={{ paddingBottom: `max(2rem, env(safe-area-inset-bottom))` }}>
      <nav className="flex items-center gap-2 px-3 py-2.5 rounded-full bg-white/80 dark:bg-[#161B22]/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.Icon;
          const isSocial = item.href === "/social";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center justify-center rounded-full cursor-pointer
                transition-all duration-300 ease-in-out
                ${active
                  ? "gap-2 px-4 py-2.5 border border-[#E85D2A] text-[#E85D2A]"
                  : "w-11 h-11 text-[#656D76] dark:text-[#8B949E] hover:text-[#0E1116]/70 dark:hover:text-white/70"
                }
              `}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
              {active && (
                <span className="text-sm font-semibold text-[#E85D2A] whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
              {isSocial && <UnseenBadge />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
