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
    <div className="min-h-screen bg-[#0E1116] flex flex-col items-center justify-center px-8">
      {/* Logo + tagline */}
      <h1
        className="text-3xl font-bold text-[#E85D2A]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        Savrd
      </h1>
      <p className="text-[#8B949E] text-base mt-2 text-center">
        Discover your city, one swipe at a time.
      </p>

      {/* App icon */}
      <Image
        src="/icon-1024.png"
        alt="Savrd"
        width={160}
        height={160}
        className="rounded-3xl mt-10 shadow-[0_8px_40px_rgba(232,93,42,0.2)]"
        priority
      />

      {/* CTA buttons */}
      <Link
        href="/auth?tab=signup"
        className="w-full max-w-xs mt-10 py-4 bg-[#E85D2A] hover:bg-[#D14E1F] text-white text-lg font-semibold rounded-full text-center transition-colors duration-200"
      >
        Get Started
      </Link>

      <Link
        href="/auth?tab=signin"
        className="mt-4 text-[#8B949E] text-sm hover:text-white transition-colors duration-200"
      >
        I already have an account
      </Link>

      {/* Legal */}
      <p className="mt-8 text-[#8B949E] text-xs text-center">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-white transition-colors duration-200">
          Terms
        </Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline hover:text-white transition-colors duration-200">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
