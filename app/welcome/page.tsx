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
    <div className="min-h-screen bg-[#0E1116] flex flex-col items-center justify-between py-16 px-8">
      {/* Top: logo + tagline */}
      <div className="flex flex-col items-center">
        <h1
          className="text-4xl font-bold tracking-tight text-[#E85D2A]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Savrd
        </h1>
        <p className="text-white text-2xl font-semibold text-center mt-3 leading-relaxed">
          Discover your city,<br />one swipe at a time.
        </p>
      </div>

      {/* Middle: app icon */}
      <Image
        src="/icon-1024.png"
        alt="Savrd"
        width={180}
        height={180}
        className="rounded-3xl shadow-2xl"
        style={{ boxShadow: "0 0 80px rgba(232, 93, 42, 0.2)" }}
        priority
      />

      {/* Bottom: button + legal */}
      <div className="w-full flex flex-col items-center gap-4">
        <Link
          href="/auth"
          className="w-full max-w-sm py-4 bg-[#E85D2A] hover:bg-[#D14E1F] text-white text-lg font-semibold rounded-full text-center transition-colors duration-200"
        >
          Get Started
        </Link>

        <p className="text-xs text-[#8B949E] text-center">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-[#E85D2A] hover:underline transition-colors duration-200">
            Terms
          </Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[#E85D2A] hover:underline transition-colors duration-200">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
