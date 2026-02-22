"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

function BoardsIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={color} />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={color} />
      <rect x="3" y="14" width="7" height="7" rx="1" fill={color} />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={color} />
    </svg>
  );
}

function MapIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" fill={color} />
    </svg>
  );
}

function DiscoverIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} />
    </svg>
  );
}

function FriendsIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" fill={color} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" fill={color} />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/boards", label: "Boards", Icon: BoardsIcon },
  { href: "/map", label: "Map", Icon: MapIcon },
  { href: "/", label: "Discover", Icon: DiscoverIcon },
  { href: "/friends", label: "Friends", Icon: FriendsIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
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
    // Re-fetch when tab becomes visible to keep badge fresh
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

  if (pathname === "/landing") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#1a1a2e] border-t border-gray-100 dark:border-white/10 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_8px_rgba(0,0,0,0.3)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-end justify-around h-[68px] max-w-lg mx-auto px-2 pb-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const IconComponent = item.Icon;
          const isDiscover = item.href === "/";

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-end flex-1 min-h-[48px]"
            >
              {active ? (
                <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-[#E85D2A] shadow-md shadow-[#E85D2A]/30">
                  <IconComponent color="white" />
                  {isDiscover && <UnseenBadge />}
                </div>
              ) : (
                <div className="relative">
                  <IconComponent color="#9CA3AF" />
                  {isDiscover && <UnseenBadge />}
                </div>
              )}
              <span className={`text-[10px] font-medium mt-0.5 ${active ? "text-[#E85D2A]" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
