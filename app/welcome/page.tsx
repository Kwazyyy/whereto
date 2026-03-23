"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function WelcomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  return (
    <div className="min-h-screen bg-[#0E1116] flex flex-col items-center justify-between px-6 py-12" style={{ paddingTop: "max(3rem, env(safe-area-inset-top))", paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-1">
        <h1
          className="text-4xl font-extrabold tracking-tight text-[#E85D2A]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Savrd
        </h1>
        <p className="text-white text-lg text-center font-medium">
          Discover your city, one swipe at a time.
        </p>
      </div>

      {/* App icon */}
      <div className="flex items-center justify-center">
        <Image
          src="/icon-1024.png"
          alt="Savrd"
          width={200}
          height={200}
          className="rounded-3xl shadow-[0_8px_40px_rgba(232,93,42,0.25)]"
          priority
        />
      </div>

      {/* Buttons + legal */}
      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <Link
          href="/auth?tab=signup"
          className="w-full py-4 bg-[#E85D2A] hover:bg-[#D14E1F] text-white text-base font-bold rounded-full text-center transition-colors duration-200 shadow-[0_4px_20px_rgba(232,93,42,0.4)]"
        >
          Get Started
        </Link>

        <Link
          href="/auth?tab=signin"
          className="text-sm text-[#8B949E] hover:text-white transition-colors duration-200"
        >
          I already have an account
        </Link>

        <p className="text-xs text-[#8B949E]/50 text-center mt-2">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-[#8B949E] hover:text-white underline transition-colors duration-200">
            Terms
          </Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[#8B949E] hover:text-white underline transition-colors duration-200">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
