"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

function TopNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = session?.user?.role === "admin";

  const navLinks = [
    { href: "/business/dashboard", label: "Dashboard" },
    { href: "/business/pricing", label: "Pricing" },
    { href: "/business/settings", label: "Settings" },
    ...(isAdmin ? [{ href: "/business/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="border-b border-white/10 bg-[#0E1116]">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/business/dashboard" className="flex items-center gap-2">
          <span className="text-3xl tracking-tight text-[#E85D2A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>Savrd</span>
          <span className="text-sm text-white font-normal">for Business</span>
        </Link>

        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#E85D2A]/20 flex items-center justify-center text-[#E85D2A] text-xs font-bold">
                  {session?.user?.name?.[0]?.toUpperCase() || "B"}
                </div>
              )}
              <span className="hidden sm:inline">
                {session?.user?.name || "Account"}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#161B22] border border-white/10 rounded-lg shadow-xl py-1 z-50">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm text-white font-medium truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/business/login" })}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center p-6">
      <div className="bg-[#161B22] border border-white/10 rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6">
          This area is for verified business accounts only. If you own a business on Savrd, please register for a business account.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/for-business"
            className="px-4 py-2.5 bg-[#E85D2A] text-white rounded-lg text-sm font-medium hover:bg-[#d04e1f] transition-colors"
          >
            Learn About Savrd for Business
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 bg-white/5 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Back to Savrd
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0E1116]">
      <div className="border-b border-white/10 bg-[#0E1116]">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-7 w-7 bg-white/5 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-4" />
        <div className="h-4 w-72 bg-white/5 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = pathname === "/business/login" || pathname === "/business/register";
  const isOpenPage = pathname === "/business/pricing";

  // Public pages: render without auth guard or top nav
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Open pages: render with layout but skip auth/role check
  if (isOpenPage) {
    return (
      <div className="min-h-screen bg-[#0E1116]">
        <TopNav />
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </div>
    );
  }

  if (status === "loading") {
    return <LoadingSkeleton />;
  }

  if (status === "unauthenticated") {
    router.push("/business/login");
    return <LoadingSkeleton />;
  }

  const role = session?.user?.role;
  if (role !== "business" && role !== "admin") {
    return <AccessDenied />;
  }

  // Admin-only pages
  if (pathname.startsWith("/business/admin") && role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0E1116]">
        <TopNav />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-gray-400 mt-2">Admin only.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1116]">
      <TopNav />
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
