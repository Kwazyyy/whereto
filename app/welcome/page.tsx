"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UtensilsCrossed, Heart, Flame } from "lucide-react";
import { isNativePlatform } from "@/lib/is-native";

export default function WelcomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isNativePlatform()) {
      router.replace("/landing");
      return;
    }
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (!isNativePlatform() || status === "loading" || status === "authenticated") {
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  return (
    <div className="min-h-screen bg-[#0E1116] overflow-hidden flex flex-col items-center justify-between px-6 pt-14 pb-10" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}>
      {/* Radial center glow vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 48%, rgba(232,93,42,0.07) 0%, transparent 70%)" }}
      />

      {/* ── Title + tagline ── */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-5xl font-bold text-[#E85D2A]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Savrd
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-[#8B949E] text-lg mt-2"
        >
          Discover your city, one swipe at a time.
        </motion.p>
      </div>

      {/* ── Card stack illustration ── */}
      <div className="relative z-10 flex items-center justify-center" style={{ width: 260, height: 320 }}>
        {/* Orange glow behind cards */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-[#E85D2A]/20 blur-3xl" />
        </div>

        {/* Floating icons */}
        {/* Top-right */}
        <div className="absolute -top-2 -right-4 z-20 w-10 h-10 rounded-full bg-[#161B22] border border-white/10 flex items-center justify-center">
          <UtensilsCrossed size={16} color="#8B949E" />
        </div>
        {/* Right middle */}
        <div className="absolute top-1/2 -right-6 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#161B22] border border-white/10 flex items-center justify-center">
          <Heart size={16} color="white" />
        </div>
        {/* Bottom-left */}
        <div className="absolute -bottom-2 -left-4 z-20 w-10 h-10 rounded-full bg-[#161B22] border border-white/10 flex items-center justify-center">
          <Flame size={16} color="#8B949E" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
          style={{ width: 240, height: 280 }}
        >
          {/* Back card */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "rgba(232, 93, 42, 0.4)",
              transform: "rotate(6deg) translateY(6px)",
            }}
          />
          {/* Middle card */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "rgba(232, 93, 42, 0.6)",
              transform: "rotate(-3deg) translateY(2px)",
            }}
          />
          {/* Front card */}
          <div
            className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center gap-5"
            style={{ background: "linear-gradient(145deg, #E85D2A 0%, #D14E1F 100%)" }}
          >
            {/* Glassmorphism S box */}
            <div
              className="rounded-xl p-4 flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span className="text-6xl font-bold text-white leading-none select-none">S</span>
            </div>
            {/* Progress bar */}
            <div className="w-32 h-1.5 rounded-full bg-white/40" />
          </div>
        </motion.div>
      </div>

      {/* ── CTA + legal ── */}
      <div className="relative z-10 w-full flex flex-col items-center gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="w-full"
        >
          <Link
            href="/auth"
            className="block w-full py-4 bg-[#E85D2A] text-white font-bold text-lg rounded-full text-center shadow-[0_0_30px_rgba(232,93,42,0.4)] active:scale-[0.98] transition-transform duration-150"
          >
            GET STARTED
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-xs text-[#8B949E] text-center"
        >
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline text-[#8B949E] hover:text-white transition-colors">
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline text-[#8B949E] hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
