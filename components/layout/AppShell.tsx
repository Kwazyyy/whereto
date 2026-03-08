"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { Compass, Map, LayoutGrid, Users, User, Sun, Moon, Monitor } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Discover", icon: Compass, exact: true },
  { href: "/map", label: "Map", icon: Map },
  { href: "/boards", label: "Boards", icon: LayoutGrid },
  { href: "/social", label: "Social", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

// Pages that should NOT show the AppShell (sidebar)
const EXCLUDED_PATHS = ["/landing", "/business", "/for-business", "/lists", "/pro", "/privacy", "/terms"];
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
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 w-[72px] xl:w-[240px] transition-all duration-200 ease-in-out"
      style={{
        backgroundColor: isDark ? 'rgba(14, 17, 22, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      }}
    >
      {/* Logo */}
      <div className="px-4 xl:px-5 pt-6 pb-4 shrink-0 flex items-center justify-center xl:justify-start">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-[#E85D2A] xl:hidden">S</span>
          <span className="text-2xl font-bold text-[#E85D2A] hidden xl:block">Savrd</span>
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

      {/* Theme Toggle */}
      <div className="shrink-0 px-2 xl:px-3">
        <button
          onClick={() => {
            if (theme === "system") setTheme("light");
            else if (theme === "light") setTheme("dark");
            else setTheme("system");
          }}
          className="w-full flex items-center justify-center xl:justify-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[#656D76] dark:text-[#8B949E] hover:text-[#E85D2A] transition-colors duration-200"
          title={theme === "system" ? "System theme" : theme === "light" ? "Light theme" : "Dark theme"}
        >
          {theme === "light" ? (
            <Sun size={24} strokeWidth={2} />
          ) : theme === "dark" ? (
            <Moon size={24} strokeWidth={2} />
          ) : (
            <Monitor size={24} strokeWidth={2} />
          )}
          <span className="hidden xl:block text-base font-medium">
            {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
          </span>
        </button>
      </div>

      {/* User Avatar */}
      <div className="shrink-0 px-4 pt-2 pb-6">
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
          <span className="hidden xl:flex items-center gap-1.5 text-sm text-[#656D76] dark:text-[#8B949E] truncate max-w-[180px]">
            {session?.user?.name || "Sign in"}
            {session?.user?.plan && session?.user?.subscriptionStatus === "active" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ filter: "drop-shadow(0 0 6px rgba(202,138,4,0.5))" }}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
            )}
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
