"use client";

import { motion, useScroll, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isNativePlatform } from "@/lib/is-native";
import { Map, LayoutGrid, Users, Camera, UtensilsCrossed } from "lucide-react";

/* ─── Images ────────────────────────────────────────────────── */
const IMAGES = {
    latte: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop",
    toronto: "https://images.unsplash.com/photo-1698958578220-3517a2b2e7f2?q=80&w=1080&auto=format&fit=crop",
    vancouver: "https://images.unsplash.com/photo-1664813174433-778f3068fb2c?q=80&w=1080&auto=format&fit=crop",
    montreal: "https://images.unsplash.com/photo-1571072668274-53ca1e414f25?q=80&w=1080&auto=format&fit=crop",
    nyc: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1080&auto=format&fit=crop",
    cafeOwner: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?q=80&w=800&auto=format&fit=crop",
};

/* ─── Confetti ───────────────────────────────────────────────── */
function Confetti() {
    const C = ["#E85D2A", "#ff8a5c", "#fbbf24", "#a78bfa", "#34d399", "#60a5fa", "#f472b6"];
    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {Array.from({ length: 80 }).map((_, i) => (
                <motion.div key={i}
                    initial={{ opacity: 1, y: -10, x: 0, rotate: 0 }}
                    animate={{ opacity: 0, y: "100vh", x: (Math.random() - 0.5) * 300, rotate: Math.random() * 720 }}
                    transition={{ duration: 1.8 + Math.random() * 1.5, delay: Math.random() * 0.6, ease: "easeIn" }}
                    style={{ position: "absolute", left: `${Math.random() * 100}%`, top: 0, width: 5 + Math.random() * 7, height: 4 + Math.random() * 4, backgroundColor: C[i % C.length], borderRadius: 1 }}
                />
            ))}
        </div>
    );
}

/* ─── Inline SVG icons ───────────────────────────────────────── */
function MapPinIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}
function MenuIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}
function XIcon() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function ArrowRightIcon({ size = 20 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
}
function ArrowUpIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
}
function HeartIcon({ filled = false }: { filled?: boolean }) {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
}
function SkipIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function CoffeeIcon() {
    return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></svg>;
}
function SwipeIcon() {
    return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" /><path d="m15 11 4 4-4 4M11 15h8" /></svg>;
}
function BoardsIcon() {
    return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3h-8l-2 4h12z" /></svg>;
}
function CameraIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>;
}
function BarChart3Icon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>;
}
function StarIcon({ filled = false }: { filled?: boolean }) {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function UsersIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function LockIcon() {
    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
}

/* ─── Animation presets ──────────────────────────────────────── */
const ease = [0.25, 1, 0.5, 1] as const;
const fadeInView = (delay = 0) => ({ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.7, delay, ease } });

/* ═══════════════════════════════════════════════════════════════
   WAITLIST FORM
   ═══════════════════════════════════════════════════════════════ */
function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errMsg, setErrMsg] = useState("");
    const [confetti, setConfetti] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { inputRef.current?.focus(); return; }
        setStatus("loading");
        setErrMsg("");
        try {
            const r = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const d = await r.json();
            if (r.ok) {
                setStatus("success");
                setEmail("");
                setConfetti(true);
                setTimeout(() => setConfetti(false), 4000);
            } else {
                setStatus("error");
                setErrMsg(d.error || "Something went wrong.");
            }
        } catch {
            setStatus("error");
            setErrMsg("Network error. Please try again.");
        }
    };

    return (
        <>
            {confetti && <Confetti />}
            <AnimatePresence mode="wait">
                {status === "success" ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/10 border border-green-500/20 text-green-400 p-8 rounded-2xl flex flex-col items-center gap-3"
                    >
                        <div className="mb-1 text-green-400"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
                        <h3 className="text-xl font-bold text-white">You&apos;re on the list!</h3>
                        <p className="text-green-400/70 text-sm">We&apos;ll notify you when we launch in your city.</p>
                    </motion.div>
                ) : (
                    <motion.div key="form" exit={{ opacity: 0 }}>
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                            <input
                                ref={inputRef}
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === "loading"}
                                className="flex-1 bg-[#0E1116] border border-[#30363D] rounded-full px-6 py-3 text-white placeholder-[#8B949E] focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200 disabled:opacity-50"
                                required
                            />
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="bg-[#E85D2A] hover:bg-[#D14E1F] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full shadow-[0_0_20px_rgba(232,93,42,0.4)] transition-all whitespace-nowrap"
                            >
                                {status === "loading"
                                    ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />Joining...</span>
                                    : "Join Waitlist"}
                            </button>
                        </form>
                        {status === "error" && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-sm mt-3 text-center"
                            >
                                {errMsg}
                            </motion.p>
                        )}
                        <p className="text-zinc-600 text-xs mt-4 flex items-center justify-center gap-1.5">
                            <LockIcon />
                            No spam. Unsubscribe anytime.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const { status } = useSession();
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const { scrollY } = useScroll();

    // Safety net: native Capacitor users should never see /landing — send to /welcome
    useEffect(() => {
        if (isNativePlatform()) {
            router.replace("/welcome");
            return;
        }
        if (status === "authenticated") router.replace("/");
    }, [status, router]);


    // Mark that this user has seen the landing page so they won't be redirected here again
    useEffect(() => {
        localStorage.setItem("savrd_seen_landing", "true");
    }, []);

    useEffect(() => {
        return scrollY.on("change", (latest) => {
            setIsScrolled(latest > 50);
        });
    }, [scrollY]);

    const scrollToSection = (id: string) => {
        setMobileMenu(false);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    const navLinks: { label: string; id?: string; href?: string }[] = [
        { label: "About", id: "about" },
        { label: "How It Works", id: "how-it-works" },
        { label: "Features", id: "features" },
        { label: "Cities", id: "cities" },
        { label: "For Business", href: "/for-business" },
    ];

    return (
        <div className="bg-[#0E1116] text-white min-h-screen w-full overflow-x-hidden selection:bg-[#E85D2A] selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            <style>{`
                @keyframes pulse-ring { 0% { transform: scale(1); opacity:.5 } 100% { transform: scale(2.5); opacity:0 } }
                @keyframes shimmer { from { transform: translateX(-100%) skewX(-12deg) } to { transform: translateX(200%) skewX(-12deg) } }
            `}</style>

            {/* ═══════ NAV ═══════ */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#0E1116]/90 backdrop-blur-md py-4" : "bg-transparent py-6"}`}>
                <div className="px-4 md:px-6 flex items-center justify-between">
                    {/* Logo */}
                    <span className="text-3xl leading-none tracking-tight text-[#E85D2A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>Savrd</span>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((l) => (
                            l.href ? (
                                <Link key={l.label} href={l.href}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                                    {l.label}
                                </Link>
                            ) : (
                                <button key={l.id} onClick={() => scrollToSection(l.id!)}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                                    {l.label}
                                </button>
                            )
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/auth"
                            className="hidden md:block bg-[#E85D2A] hover:bg-[#D14E1F] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-[0_0_20px_rgba(232,93,42,0.4)] cursor-pointer">
                            Start Swiping
                        </Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-zinc-400 hover:text-white cursor-pointer">
                            {mobileMenu ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {mobileMenu && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-[#0E1116]/95 backdrop-blur-xl overflow-hidden">
                            <div className="p-4 flex flex-col gap-1">
                                {navLinks.map((l) => (
                                    l.href ? (
                                        <Link key={l.label} href={l.href}
                                            className="px-4 py-3 rounded-xl text-left text-[15px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                                            {l.label}
                                        </Link>
                                    ) : (
                                        <button key={l.id} onClick={() => scrollToSection(l.id!)}
                                            className="px-4 py-3 rounded-xl text-left text-[15px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                                            {l.label}
                                        </button>
                                    )
                                ))}
                                <Link href="/auth"
                                    className="px-4 py-3 rounded-xl text-left text-[15px] font-semibold text-[#E85D2A] hover:bg-white/5 transition-all cursor-pointer">
                                    Start Swiping
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ═══════ HERO ═══════ */}
            <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
                {/* Background orbs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#E85D2A]/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center py-16">
                    {/* Left: copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        {/* Live badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300">
                            <span className="relative flex h-[7px] w-[7px]">
                                <span className="absolute inset-0 rounded-full bg-green-400" style={{ animation: "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite" }} />
                                <span className="relative rounded-full h-[7px] w-[7px] bg-green-400 shadow-[0_0_6px_#4ade80]" />
                            </span>
                            Now live in Toronto
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.06] tracking-[-0.03em]">
                            Finding spots<br />should be{" "}
                            <span className="text-[#E85D2A]" style={{ textShadow: "0 0 50px rgba(232,93,42,0.5), 0 0 120px rgba(232,93,42,0.2)" }}>
                                fun
                            </span>
                            ,<br />not frustrating.
                        </h1>

                        {/* Subtext */}
                        <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
                            Swipe through curated cafés and restaurants near you. No more doom-scrolling Google Maps or group chat debates.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link href="/auth"
                                className="group relative overflow-hidden bg-[#E85D2A] hover:bg-[#D14E1F] text-white px-8 py-4 rounded-full font-bold text-[15px] transition-all shadow-[0_0_20px_rgba(232,93,42,0.4)] flex items-center gap-2">
                                <span className="relative z-10">Start Swiping</span>
                                <ArrowRightIcon size={18} />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100" style={{ animation: "shimmer 2.5s infinite" }} />
                            </Link>
                            <button onClick={() => scrollToSection("how-it-works")}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-full font-bold text-[15px] transition-all">
                                How It Works
                            </button>
                        </div>

                        {/* Social proof */}
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex -space-x-2.5">
                                {[1, 5, 8, 12].map((n) => (
                                    <img key={n} src={`https://i.pravatar.cc/80?img=${n}`} alt=""
                                        className="w-9 h-9 rounded-full ring-[2.5px] ring-zinc-950 object-cover" />
                                ))}
                            </div>
                            <p className="text-sm text-zinc-500">Join Toronto&apos;s discovery community</p>
                        </div>
                    </motion.div>

                    {/* Right: phone mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="relative flex justify-center md:justify-end"
                    >
                        {/* Decorative spinning rings */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full"
                            style={{ animation: "spin 20s linear infinite" }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/5 rounded-full"
                            style={{ animation: "spin 30s linear infinite reverse" }} />

                        {/* Phone shell */}
                        <div className="relative w-[300px] h-[620px] bg-[#0E1116] border-[7px] border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden z-20 ring-1 ring-white/10">
                            {/* Dynamic island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-30" />

                            <div className="w-full h-full bg-zinc-900 flex flex-col">
                                {/* Status bar */}
                                <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[9px] text-zinc-500 font-semibold shrink-0">
                                    <span>9:41</span>
                                    <div className="flex items-center gap-1 opacity-60">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.8 5.3 4.5 6.8V21l3.3-1.8c.7.1 1.4.3 2.2.3 5.5 0 10-3.6 10-8S17.5 3 12 3z" /></svg>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="7" width="20" height="10" rx="2" /><rect x="22" y="10" width="2" height="4" rx="1" /></svg>
                                    </div>
                                </div>

                                {/* App header */}
                                <div className="px-5 pt-6 pb-2 flex justify-between items-center shrink-0">
                                    <span className="font-extrabold text-[#E85D2A] text-[14px]">Savrd</span>
                                    <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
                                        Toronto
                                    </span>
                                </div>

                                {/* Vibe chips */}
                                <div className="px-4 flex gap-1.5 mb-3 overflow-hidden shrink-0">
                                    {[{ l: "Study / Work", a: false }, { l: "Romantic", a: false }, { l: "Chill Vibes", a: false }, { l: "Trending Now", a: true }].map((c, i) => (
                                        <div key={i} className={`shrink-0 px-3 py-1.5 rounded-full text-[8px] font-semibold ${c.a ? "bg-[#E85D2A] text-white" : "bg-[#1C2128] text-white border border-[#30363D]"}`}>
                                            {c.l}
                                        </div>
                                    ))}
                                </div>

                                {/* Card */}
                                <div className="flex-1 flex items-center px-3 pb-2 min-h-0">
                                    <motion.div
                                        animate={{ rotate: [0, -2, 0] }}
                                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                        className="w-full rounded-2xl overflow-hidden relative shadow-2xl"
                                        style={{ aspectRatio: "3/4" }}
                                    >
                                        <img src="/images/10-dean-waverley--toronto.jpg" alt="10 DEAN Café" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                                        {/* Budget & distance pills */}
                                        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                                            <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">$ All</span>
                                            <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">5km</span>
                                        </div>

                                        {/* SAVE flash */}
                                        <motion.div
                                            animate={{ opacity: [0, 0.9, 0] }}
                                            transition={{ delay: 2.5, duration: 1.8, repeat: Infinity, repeatDelay: 7 }}
                                            className="absolute top-12 right-3 px-3 py-1 rounded-md border-2 border-green-400/70 text-green-400 text-[10px] font-black rotate-12 uppercase tracking-wider">
                                            Save
                                        </motion.div>

                                        <div className="absolute bottom-0 inset-x-0 p-4">
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <h3 className="text-[14px] font-bold text-white leading-tight">10 DEAN | Waverley</h3>
                                                    <div className="flex items-center gap-1 text-[9px] text-zinc-400 mt-0.5">
                                                        <span>1.5 km</span><span className="text-zinc-600">·</span>
                                                        <span>Café</span><span className="text-zinc-600">·</span>
                                                        <span>$$</span><span className="text-zinc-600">·</span>
                                                        <span className="text-[#CA8A04]">★</span><span>4.6</span>
                                                    </div>
                                                    <div className="flex gap-1 mt-2">
                                                        {["Trending", "Coffee", "Study Spot"].map((t) => (
                                                            <span key={t} className="px-2 py-[3px] rounded-full bg-white/10 backdrop-blur-sm text-[7px] font-semibold text-zinc-300">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-[#1C2128] border border-[#30363D] flex items-center justify-center shrink-0 mb-0.5">
                                                    <UtensilsCrossed size={14} color="#8B949E" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Bottom nav pill */}
                                <div className="flex items-center justify-around bg-[#1C2128] rounded-full mx-6 py-2 px-4 mb-4 shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B949E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B949E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
                                    <span className="bg-[#E85D2A] text-white text-[10px] font-semibold px-3 py-1 rounded-full">Discover</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B949E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B949E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════ PROBLEM ═══════ */}
            <section id="about" className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <motion.div {...fadeInView(0)}>
                            <span className="inline-block text-xs font-semibold text-[#E85D2A] uppercase tracking-[0.18em] mb-3">Sound familiar?</span>
                            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">Still arguing about<br />where to eat?</h2>
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 items-stretch max-w-4xl mx-auto">
                        {/* Left: messy chat */}
                        <motion.div {...fadeInView(0)}
                            className="bg-zinc-900 rounded-3xl p-8 border border-white/5 relative overflow-hidden flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">The Group Chat</span>
                            </div>
                            <div className="space-y-3 font-sans flex-1">
                                {[
                                    { from: false, text: "Where should we go for dinner?" },
                                    { from: false, text: "Idk you pick 🙃" },
                                    { from: true, text: "How about that pasta place?" },
                                    { from: false, text: "Nah we went there last week" },
                                    { from: false, text: "Too expensive anyway lol" },
                                    { from: true, text: "..." },
                                ].map((m, i) => (
                                    <motion.div key={i}
                                        initial={{ opacity: 0, x: m.from ? 10 : -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.05 + i * 0.08 }}
                                        className={`flex ${m.from ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] font-medium ${m.from ? "bg-blue-600/20 text-blue-200 rounded-tr-sm" : "bg-zinc-800 text-zinc-300 rounded-tl-sm"}`}>
                                            {m.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-900 to-transparent" />
                        </motion.div>

                        {/* Right: clean solution */}
                        <motion.div {...fadeInView(0.15)} className="relative flex">
                            <div className="bg-zinc-900 rounded-3xl p-1.5 border border-[#E85D2A]/30 shadow-[0_0_50px_rgba(232,93,42,0.1)] flex-1 flex">
                                <div className="rounded-[22px] overflow-hidden relative flex-1">
                                    {/* Blurry café background */}
                                    <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80" alt="" className="absolute inset-0 w-full h-full object-cover blur-lg scale-110" />
                                    <div className="absolute inset-0 bg-black/50" />
                                    {/* Content */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
                                        <div className="bg-[#E85D2A] w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#E85D2A]/40 text-white">
                                            <HeartIcon filled />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1">It&apos;s a Match!</h3>
                                        <p className="text-zinc-300 text-sm">Everyone liked <span className="text-[#E85D2A] font-bold">Founders Coffee</span></p>
                                        <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-50" />
                                                <span className="relative rounded-full h-2 w-2 bg-green-400" />
                                            </span>
                                            <span className="text-green-400 text-xs font-semibold">Added to &quot;Date Spots&quot;</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════ HOW IT WORKS ═══════ */}
            <section id="how-it-works" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div {...fadeInView(0)} className="text-center mb-16">
                        <span className="inline-block text-xs font-semibold text-[#E85D2A] uppercase tracking-[0.18em] mb-3">How it works</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Three steps. Zero effort.</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: <CoffeeIcon />, n: "01", title: "Pick your vibe", desc: "Choose from 9 moods — Study, Date, Budget Eats, Trending and more. We filter thousands of options instantly." },
                            { icon: <SwipeIcon />, n: "02", title: "Swipe to discover", desc: "Right to save, left to skip, up for instant directions. It's the simplest way to decide — in under 3 seconds." },
                            { icon: <BoardsIcon />, n: "03", title: "Build your list", desc: "Saves auto-organize into boards by vibe. Share boards with friends — stop screenshotting map links." },
                        ].map((s, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.6 }}
                                className="group p-8 rounded-3xl bg-[#161B22] border border-white/5 hover:border-[#E85D2A]/30 transition-colors relative overflow-hidden">
                                <div className="absolute top-6 right-6 text-[80px] font-black text-white/[0.04] leading-none select-none pointer-events-none group-hover:text-white/[0.06] transition-colors">
                                    {s.n}
                                </div>
                                <div className="w-12 h-12 bg-white/[0.05] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#E85D2A]/10 group-hover:text-[#E85D2A] transition-colors text-zinc-400">
                                    {s.icon}
                                </div>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">{s.n}</span>
                                <h3 className="text-lg font-bold text-white mt-1.5 mb-3">{s.title}</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ FEATURES ═══════ */}
            <section id="features" className="py-20 md:py-32 overflow-hidden">
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <span className="text-sm font-semibold tracking-widest uppercase text-[#E85D2A] mb-4 block">WHY SAVRD</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">More than just a list of restaurants</h2>
                        <p className="text-lg text-[#8B949E] mb-16">The features that make discovering your city actually fun.</p>
                    </motion.div>
                </div>

                {[
                    { icon: Map, label: "EXPLORE", title: "Your city, unlocked", desc: "Toronto starts covered in fog. Every café you visit reveals the neighborhood around it — like a video game, but for real life. Watch your map light up as you explore.", reverse: false },
                    { icon: LayoutGrid, label: "ORGANIZE", title: "Saves that sort themselves", desc: "Swipe right and your spots automatically organize by mood — date night, study spots, budget eats. No folders to create, no lists to manage. Just swipe and go.", reverse: true },
                    { icon: Users, label: "CONNECT", title: "Discover with friends", desc: "See where your friends save and eat. Get taste compatibility scores, swap recommendations, and find out you both saved the same hidden gem.", reverse: false },
                    { icon: Camera, label: "CONTRIBUTE", title: "Real photos from real visitors", desc: "Forget stock photos. See what the food, vibe, and seating actually look like — shot by people who've been there. Visit a spot and add your own.", reverse: true },
                ].map((feature, i) => (
                    <div key={i}>
                        {i > 0 && <div className="w-16 h-px bg-[#30363D] mx-auto" />}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 py-12 md:py-16 max-w-5xl mx-auto px-6 ${feature.reverse ? "md:flex-row-reverse" : ""}`}
                        >
                            {/* Icon/Visual half */}
                            <div className="md:w-1/2">
                                <div
                                    className="w-full aspect-square max-w-[320px] mx-auto rounded-3xl flex items-center justify-center relative overflow-hidden"
                                    style={{ background: 'rgba(22, 27, 34, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                                >
                                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(232, 93, 42, 0.15) 0%, transparent 70%)' }} />
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <feature.icon color="#E85D2A" size={80} strokeWidth={1.2} />
                                    </motion.div>
                                </div>
                            </div>

                            {/* Text half */}
                            <div className="md:w-1/2 text-center md:text-left">
                                <span
                                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4"
                                    style={{ background: 'rgba(232, 93, 42, 0.15)', color: '#E85D2A' }}
                                >
                                    {feature.label}
                                </span>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-base md:text-lg text-[#8B949E] leading-relaxed">{feature.desc}</p>
                            </div>
                        </motion.div>
                    </div>
                ))}
            </section>

            {/* ═══════ CITIES ═══════ */}
            <section id="cities" className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
                        <motion.div {...fadeInView(0)}>
                            <span className="inline-block text-xs font-semibold text-[#E85D2A] uppercase tracking-[0.18em] mb-3">Coverage</span>
                            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Expanding city by city.</h2>
                        </motion.div>
                        <button onClick={() => scrollToSection("waitlist")}
                            className="text-[#E85D2A] font-medium hover:text-[#E85D2A] flex items-center gap-2 text-sm shrink-0">
                            Vote for your city <ArrowRightIcon size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: "Toronto", img: IMAGES.toronto, active: true },
                            { name: "Vancouver", img: IMAGES.vancouver, active: false },
                            { name: "Montreal", img: IMAGES.montreal, active: false },
                            { name: "New York", img: IMAGES.nyc, active: false },
                        ].map((city, i) => (
                            <motion.div key={city.name}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="relative group overflow-hidden rounded-3xl h-[400px] md:h-[450px]"
                            >
                                <img src={city.img} alt={city.name}
                                    className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${city.active ? "" : "grayscale group-hover:grayscale-0"}`} />
                                <div className={`absolute inset-0 ${city.active ? "bg-gradient-to-t from-black/90 via-black/20 to-transparent" : "bg-black/60 group-hover:bg-black/40"} transition-colors p-6 flex flex-col justify-end`}>
                                    {city.active ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold w-fit mb-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            NOW LIVE
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[9px] font-bold text-zinc-400 w-fit mb-2">
                                            COMING SOON
                                        </div>
                                    )}
                                    <h3 className="text-lg font-extrabold text-white">{city.name}</h3>
                                    <p className="text-zinc-400 text-sm mt-1">{city.active ? "2,400+ curated spots" : "Stay tuned"}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ FOR CAFÉS ═══════ */}
            <section id="for-cafes" className="py-24 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-1/3 h-full bg-[#E85D2A]/5 blur-3xl pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div {...fadeInView(0)}>
                            <span className="inline-block text-xs font-semibold text-indigo-400 uppercase tracking-[0.15em] mb-5">For Business</span>
                            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
                                Own a café?<br /><span className="text-zinc-500">Get discovered.</span>
                            </h2>
                            <p className="text-zinc-400 text-[15px] leading-relaxed mb-10 max-w-md">
                                Reach customers actively searching by vibe — not just proximity. Claim your listing and see real-time engagement.
                            </p>

                            <div className="grid grid-cols-2 gap-5 mb-10">
                                {[
                                    { icon: <CameraIcon />, label: "Add Photos" },
                                    { icon: <BarChart3Icon />, label: "See Analytics" },
                                    { icon: <StarIcon />, label: "Get Featured" },
                                    { icon: <MapPinIcon />, label: "Reach Locals" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#E85D2A]">
                                            {item.icon}
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="bg-white text-zinc-950 hover:bg-zinc-200 px-8 py-3.5 rounded-full font-bold text-[14px] transition-all shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                                Partner With Us
                            </button>
                        </motion.div>

                        <motion.div {...fadeInView(0.15)} className="relative">
                            <div className="aspect-square rounded-3xl overflow-hidden relative"
                                style={{ transform: "rotate(3deg)", transition: "transform 0.5s ease" }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(3deg)")}
                            >
                                <img src={IMAGES.cafeOwner} alt="Café owner" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                                    <div className="flex gap-4 items-center">
                                        <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center text-black font-extrabold text-sm shrink-0">
                                            +45%
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">Foot Traffic Increased</p>
                                            <p className="text-zinc-300 text-xs mt-0.5">Since joining Savrd</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════ WAITLIST ═══════ */}
            <section id="waitlist" className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,93,42,0.08),transparent_70%)] pointer-events-none" />

                <div className="max-w-xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300">
                            <span className="relative flex h-[7px] w-[7px]">
                                <span className="absolute inset-0 rounded-full bg-green-400" style={{ animation: "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite" }} />
                                <span className="relative rounded-full h-[7px] w-[7px] bg-green-400 shadow-[0_0_6px_#4ade80]" />
                            </span>
                            Now Live in Toronto
                        </div>

                        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
                            Ready to discover<br />your city?
                        </h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Savrd is live in Toronto. Start swiping for free — no download needed.
                        </p>

                        <div className="pt-4">
                            <WaitlistForm />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════ FOOTER ═══════ */}
            <footer className="py-12">
                <div className="px-4 md:px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <span className="text-2xl tracking-tight text-[#E85D2A]/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>Savrd</span>

                        <div className="flex flex-wrap justify-center gap-8 text-sm text-zinc-500">
                            <button onClick={() => scrollToSection("about")} className="hover:text-white transition-colors">About</button>
                            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                            <Link href="mailto:hello@savrd.app" className="hover:text-white transition-colors">Contact</Link>
                            <a href="https://instagram.com/savrd.to" target="_blank" rel="noopener noreferrer" className="text-[#8B949E] hover:text-white transition-colors">Instagram</a>
                            <a href="https://tiktok.com/@savrd.to" target="_blank" rel="noopener noreferrer" className="text-[#8B949E] hover:text-white transition-colors">TikTok</a>
                        </div>

                        <span className="text-sm text-zinc-600">© {new Date().getFullYear()} Savrd. Made with love in Toronto.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
