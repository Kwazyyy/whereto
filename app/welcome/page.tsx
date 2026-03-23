"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UtensilsCrossed, Heart, Flame } from "lucide-react";
import { isNativePlatform } from "@/lib/is-native";

const FRONT_PHOTO = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=800&fit=crop";
const BACK_PHOTO = "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=600&h=800&fit=crop";

function DemoCard({
  photoUrl,
  name,
  rating,
  type,
  price,
  tags,
  rotate,
  translateY,
  translateX,
  zIndex,
}: {
  photoUrl: string;
  name: string;
  rating: number;
  type: string;
  price: string;
  tags: string[];
  rotate: number;
  translateY: number;
  translateX: number;
  zIndex: number;
}) {
  return (
    <div
      className="absolute rounded-3xl overflow-hidden shadow-2xl"
      style={{
        width: 280,
        height: 360,
        transform: `rotate(${rotate}deg) translateY(${translateY}px) translateX(${translateX}px)`,
        zIndex,
      }}
    >
      {/* Photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />

      {/* Gradient overlay */}
      <div className="absolute bottom-0 inset-x-0 h-[55%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="text-2xl font-bold text-white leading-tight">{name}</h2>
        <div className="flex items-center gap-2 mt-1.5 text-white/80 text-xs font-medium">
          <span className="capitalize">{type}</span>
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span>{price}</span>
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span>&#9733; {rating.toFixed(1)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      className="min-h-screen bg-[#0E1116] overflow-hidden flex flex-col items-center justify-between px-6"
      style={{
        paddingTop: "max(3.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Radial center glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(232,93,42,0.07) 0%, transparent 70%)" }}
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

      {/* ── Card stack ── */}
      <div className="relative z-10 flex items-center justify-center" style={{ width: 320, height: 380 }}>
        {/* Orange glow behind cards */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-[#E85D2A]/20 blur-3xl" />
        </div>

        {/* Floating icons */}
        <div className="absolute -top-3 -right-2 z-30 w-10 h-10 rounded-full bg-[#161B22] border border-white/10 flex items-center justify-center">
          <UtensilsCrossed size={16} color="#8B949E" />
        </div>
        <div className="absolute top-1/2 -right-5 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#161B22] border border-white/10 flex items-center justify-center">
          <Heart size={16} color="white" />
        </div>
        <div className="absolute -bottom-2 -left-2 z-30 w-10 h-10 rounded-full bg-[#161B22] border border-white/10 flex items-center justify-center">
          <Flame size={16} color="#8B949E" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
          style={{ width: 280, height: 360 }}
        >
          {/* Back card */}
          <DemoCard
            photoUrl={BACK_PHOTO}
            name="Pilot Coffee Roasters"
            rating={4.4}
            type="café"
            price="$$"
            tags={["Study / Work"]}
            rotate={6}
            translateY={8}
            translateX={4}
            zIndex={1}
          />

          {/* Front card */}
          <DemoCard
            photoUrl={FRONT_PHOTO}
            name="The Little Goat"
            rating={4.6}
            type="café"
            price="$$"
            tags={["Chill Vibes", "Coffee & Catch-Up"]}
            rotate={0}
            translateY={0}
            translateX={0}
            zIndex={2}
          />
        </motion.div>
      </div>

      {/* ── CTA + legal ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full flex flex-col items-center gap-4 mb-16"
      >
        <Link
          href="/auth"
          className="block w-full py-4 bg-[#E85D2A] text-white font-bold text-lg rounded-full text-center shadow-[0_0_30px_rgba(232,93,42,0.4)] active:scale-[0.98] transition-transform duration-150"
        >
          GET STARTED
        </Link>

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
      </motion.div>
    </div>
  );
}
