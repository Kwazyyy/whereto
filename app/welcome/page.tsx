"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coffee, Croissant, UtensilsCrossed, IceCreamCone, Soup, CupSoda } from "lucide-react";
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
    <div
      className="min-h-screen bg-[#0E1116] overflow-hidden flex flex-col items-center justify-between"
      style={{
        paddingTop: "max(3.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(3rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Radial center glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(232,93,42,0.07) 0%, transparent 70%)" }}
      />

      {/* ── Floating food icons ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Coffee — top-left */}
        <motion.div
          className="absolute top-[7%] left-[4%] opacity-30"
          style={{ rotate: 12 }}
          animate={{ y: [0, -15, 0], rotate: [12, 17, 12] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-48 h-48 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Coffee color="#E85D2A" size={90} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* Croissant — top-right */}
        <motion.div
          className="absolute top-[6%] right-[5%] opacity-30"
          style={{ rotate: -15 }}
          animate={{ y: [0, -15, 0], rotate: [-15, -10, -15] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-48 h-48 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Croissant color="#E85D2A" size={85} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* UtensilsCrossed — mid-left */}
        <motion.div
          className="absolute top-[44%] left-[2%] opacity-30"
          style={{ rotate: 20 }}
          animate={{ y: [0, -14, 0], rotate: [20, 25, 20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-40 h-40 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <UtensilsCrossed color="#E85D2A" size={70} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* IceCreamCone — mid-right */}
        <motion.div
          className="absolute top-[42%] right-[3%] opacity-30"
          style={{ rotate: -8 }}
          animate={{ y: [0, -14, 0], rotate: [-8, -3, -8] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-40 h-40 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <IceCreamCone color="#E85D2A" size={70} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* Soup — bottom-left */}
        <motion.div
          className="absolute bottom-[18%] left-[6%] opacity-30"
          style={{ rotate: 6 }}
          animate={{ y: [0, -14, 0], rotate: [6, 11, 6] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-36 h-36 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Soup color="#E85D2A" size={65} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* CupSoda — bottom-right */}
        <motion.div
          className="absolute bottom-[16%] right-[5%] opacity-30"
          style={{ rotate: -20 }}
          animate={{ y: [0, -15, 0], rotate: [-20, -15, -20] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-36 h-36 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <CupSoda color="#E85D2A" size={65} strokeWidth={1.5} className="relative" />
        </motion.div>
      </div>

      {/* ── Center: title + tagline ── */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-6xl font-bold text-[#E85D2A]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Savrd
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
          className="text-[#8B949E] text-lg mt-3"
        >
          Discover your city, one swipe at a time.
        </motion.p>
      </div>

      {/* ── Bottom: button + legal ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full flex flex-col items-center gap-4 px-6 pb-12"
      >
        <Link
          href="/auth"
          className="block w-full py-4 bg-[#E85D2A] text-white font-bold text-lg rounded-full text-center shadow-[0_0_30px_rgba(232,93,42,0.4)] active:scale-[0.98] transition-transform duration-150"
        >
          GET STARTED
        </Link>

        <p className="text-xs text-[#8B949E] text-center">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-white transition-colors duration-200">
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-white transition-colors duration-200">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
