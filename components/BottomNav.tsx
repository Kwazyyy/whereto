"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function BoardsIcon({ active }: { active: boolean }) {
  const color = active ? "#E85D2A" : "#9CA3AF";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? color : "none"} />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? color : "none"} />
      <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? color : "none"} />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? color : "none"} />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  const color = active ? "#E85D2A" : "#9CA3AF";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" fill={active ? color : "none"} />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <div className={`flex items-center justify-center w-11 h-11 rounded-full ${active ? "bg-[#E85D2A]" : "bg-[#E85D2A]"} shadow-md shadow-[#E85D2A]/30`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white" />
      </svg>
    </div>
  );
}

function FriendsIcon({ active }: { active: boolean }) {
  const color = active ? "#E85D2A" : "#9CA3AF";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" fill={active ? color : "none"} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? "#E85D2A" : "#9CA3AF";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" fill={active ? color : "none"} />
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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-end justify-around h-16 max-w-lg mx-auto px-2 pb-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const isDiscover = item.href === "/";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-end flex-1 ${isDiscover ? "-mt-3" : ""}`}
            >
              <item.Icon active={active} />
              <span
                className={`text-[10px] font-medium mt-0.5 ${
                  active ? "text-[#E85D2A]" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
