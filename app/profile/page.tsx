"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-dvh bg-white flex items-center justify-center pb-16">
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: "#E85D2A", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="min-h-dvh bg-white pb-20">
        <header className="px-5 pt-5 pb-3">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
            Profile
          </h1>
        </header>

        <div className="px-5 mt-4">
          {/* User Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ""}
                width={56}
                height={56}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#E85D2A] flex items-center justify-center text-white text-xl font-bold">
                {session.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate" style={{ color: "#1B2A4A" }}>
                {session.user.name}
              </h2>
              <p className="text-sm text-gray-400 truncate">{session.user.email}</p>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            className="mt-6 w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-20">
      <header className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
          Profile
        </h1>
      </header>

      <div className="px-5 mt-8 flex flex-col items-center text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1B2A4A" }}>
            Sign in to WhereTo
          </h2>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xs">
            Save your favorite places across devices and share boards with friends.
          </p>
        </div>

        <button
          onClick={() => signIn("google")}
          className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-white border-2 border-gray-200 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
          style={{ color: "#1B2A4A" }}
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
