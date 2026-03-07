"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Compass, Map, LayoutGrid, Users, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Discover", icon: Compass, exact: true },
  { href: "/map", label: "Map", icon: Map },
  { href: "/boards", label: "Boards", icon: LayoutGrid },
  { href: "/social", label: "Social", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

// Pages that should NOT show the AppShell (sidebar)
const EXCLUDED_PATHS = ["/landing", "/business", "/for-business", "/lists", "/pro"];
const EXCLUDED_SUFFIXES = ["/photos"];

function shouldShowShell(pathname: string): boolean {
  for (const p of EXCLUDED_PATHS) {
    if (pathname === p || pathname.startsWith(p + "/")) return false;
  }
  for (const s of EXCLUDED_SUFFIXES) {
    if (pathname.endsWith(s)) return false;
  }
  return true;
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  const { data: session } = useSession();
  const isMapPage = pathname === "/map" || pathname.startsWith("/map/");

  return (
    <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 w-[72px] xl:w-[240px] transition-all duration-200 ease-in-out ${isMapPage ? "bg-white/90 dark:bg-[#0E1116]/90 backdrop-blur-sm" : "bg-white dark:bg-[#0E1116]"}`}>
      {/* Soft fade edge on map page */}
      {isMapPage && (
        <div className="absolute top-0 -right-5 bottom-0 w-5 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(14,17,22,0.3), transparent)" }} />
      )}
      {/* Logo */}
      <div className="px-4 xl:px-5 pt-6 pb-4 shrink-0 flex items-center justify-center xl:justify-start">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-[#E85D2A] xl:hidden">W</span>
          <span className="text-xl font-bold text-[#E85D2A] hidden xl:block">WhereTo</span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col justify-center pb-24 gap-1 px-2 xl:px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center justify-center xl:justify-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                transition-colors duration-200
                ${active
                  ? "text-[#E85D2A]"
                  : "text-[#656D76] dark:text-[#8B949E] hover:text-[#E85D2A] transition-colors duration-200"
                }
              `}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[#E85D2A]" />
              )}
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              <span className="hidden xl:block text-base font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="shrink-0 px-4 pt-4 pb-6">
        <Link
          href="/profile"
          className="flex items-center justify-center xl:justify-start gap-3"
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#F6F8FA] dark:bg-[#161B22] flex items-center justify-center text-[#656D76] dark:text-[#8B949E]">
              <User size={18} />
            </div>
          )}
          <span className="hidden xl:block text-sm text-[#656D76] dark:text-[#8B949E] truncate max-w-[140px]">
            {session?.user?.name || "Sign in"}
          </span>
        </Link>
      </div>
    </aside>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!shouldShowShell(pathname)) {
    return <>{children}</>;
  }

  const isMapPage = pathname === "/map" || pathname.startsWith("/map/");

  return (
    <>
      <DesktopSidebar pathname={pathname} />
      <main className={`transition-all duration-200 min-h-0 ${isMapPage ? "" : "lg:ml-[72px] xl:ml-[240px]"}`}>
        {children}
      </main>
    </>
  );
}
