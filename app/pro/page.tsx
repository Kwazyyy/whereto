"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/Toast";
import {
    Crown,
    ChevronDown,
    Check,
    X,
    Infinity,
    Users,
    ListPlus,
    Camera,
    Sparkles,
    Loader2,
} from "lucide-react";

/* ── Data ─────────────────────────────────────────────────────── */

const FREE_FEATURES = [
    { text: "Discover & swipe places", included: true },
    { text: "Save up to 50 places", included: true },
    { text: "Connect with 10 friends", included: true },
    { text: "Browse curated lists", included: true },
    { text: "3 photos per visit", included: true },
    { text: "Fog-of-war map", included: true },
    { text: "Advanced filters", included: false },
    { text: "Priority in new cities", included: false },
    { text: "PRO badge", included: false },
];

const PRO_FEATURES_LIST = [
    { text: "Discover & swipe places", gold: false },
    { text: "Unlimited saves", gold: true },
    { text: "Unlimited friends", gold: true },
    { text: "Create & publish lists", gold: true },
    { text: "10 photos per visit", gold: true },
    { text: "Fog-of-war map", gold: false },
    { text: "Advanced filters", gold: true },
    { text: "Priority in new cities", gold: true },
    { text: "PRO badge on profile", gold: true },
    { text: "Early access to features", gold: true },
];

const FEATURE_CARDS = [
    { Icon: Infinity, title: "Unlimited Saves", desc: "Keep every spot you love" },
    { Icon: Users, title: "Unlimited Friends", desc: "No caps on connections" },
    { Icon: ListPlus, title: "Create Lists", desc: "Share with the community" },
    { Icon: Camera, title: "More Photos", desc: "10 uploads per visit" },
    { Icon: Sparkles, title: "Advanced Filters", desc: "Filter by vibe & more" },
    { Icon: Crown, title: "PRO Badge", desc: "Gold badge on your profile" },
];

const FAQS = [
    { q: "When is Savrd Pro launching?", a: "We're putting the finishing touches on Pro right now. Join the waitlist to be the first to know when it's available!" },
    { q: "Can I cancel anytime?", a: "Absolutely. Cancel your subscription at any time with no fees or penalties." },
    { q: "Will I lose my saved places if I downgrade?", a: "No — your saves are always yours. If you exceed Free tier limits, your oldest saves will be archived but never deleted." },
    { q: "Is there a free trial?", a: "We're planning a 7-day free trial for Pro. Stay tuned!" },
    { q: "What payment methods do you accept?", a: "We'll support all major credit cards and Apple Pay through Stripe." },
];

/* ── Animation variants ───────────────────────────────────────── */

const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0, 0, 0.2, 1] as const } },
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] as const } },
};

/* ── CSS for animations (injected via style tag) ──────────────── */

const PRO_STYLES = `
@keyframes pro-glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(202,138,4,0.15), 0 0 40px rgba(202,138,4,0.05); }
  50% { box-shadow: 0 0 30px rgba(202,138,4,0.25), 0 0 60px rgba(202,138,4,0.1); }
}
@keyframes pro-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.pro-card-glow {
  animation: pro-glow-pulse 3s ease-in-out infinite;
}
.pro-popular-badge {
  overflow: hidden;
  position: relative;
}
.pro-popular-badge::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  animation: pro-shimmer 3s ease-in-out infinite;
}
.pro-feature-card {
  transition: background 200ms ease;
}
.pro-feature-card:hover {
  background: linear-gradient(180deg, rgba(232,93,42,0.05) 0%, transparent 100%),
              var(--card-bg);
}
`;

/* ── Page ──────────────────────────────────────────────────────── */

function ProPageContent() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get("success") === "true") {
            showToast("Welcome to Savrd Pro! \u{1F389}", "success");
        } else if (searchParams.get("canceled") === "true") {
            showToast("Checkout canceled");
        }
    }, [searchParams, showToast]);

    const handleCta = async () => {
        if (!session?.user) {
            router.push("/auth");
            return;
        }

        setLoading(true);
        try {
            const plan = billing === "monthly" ? "pro_monthly" : "pro_yearly";
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                showToast(data.error || "Something went wrong", "error");
                setLoading(false);
            }
        } catch {
            showToast("Something went wrong", "error");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh bg-white dark:bg-[#0E1116] overflow-x-hidden">
            <style dangerouslySetInnerHTML={{ __html: PRO_STYLES }} />

            {/* ═══ TOP NAV ═══ */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between bg-white/80 dark:bg-[#0E1116]/80 backdrop-blur-md border-b border-[#D0D7DE] dark:border-[#30363D]">
                <Link href="/" className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold tracking-tight text-[#E85D2A]">
                    Savrd
                </Link>
                <Link href="/" className="text-sm text-[#656D76] dark:text-[#8B949E] hover:text-[#0E1116] dark:hover:text-white transition-colors duration-200">
                    Back to app
                </Link>
            </nav>

            {/* ═══ SECTION 1: HEADER ═══ */}
            <section className="relative overflow-hidden pt-24">
                {/* Dramatic gradient orbs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#E85D2A]/15 blur-[120px]" />
                    <div className="absolute top-20 left-1/2 translate-x-[10%] w-[400px] h-[400px] rounded-full bg-[#CA8A04]/10 blur-[100px]" />
                </div>
                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-100 dark:opacity-100"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 60px),
                                          repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 60px)`,
                    }}
                />

                <motion.div
                    className="relative z-10 text-center px-6"
                    initial="hidden"
                    animate="visible"
                    variants={sectionVariants}
                >
                    {/* PRO badge */}
                    <div className="inline-flex items-center gap-1.5 bg-[#CA8A04] text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_16px_rgba(202,138,4,0.3)]">
                        <Crown className="w-4 h-4" />
                        PRO
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0E1116] dark:text-white mt-6 leading-tight tracking-tight max-w-3xl mx-auto">
                        Unlock the Full Savrd Experience
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-[#656D76] dark:text-[#8B949E] mt-4 max-w-xl mx-auto">
                        Starting from only $5.99 CAD/month — Cancel anytime.
                    </p>

                    {/* Billing toggle */}
                    <div className="mt-8">
                        <div className="inline-flex items-center gap-1 bg-[#F6F8FA] dark:bg-[#161B22] rounded-full p-1 border border-[#D0D7DE] dark:border-[#30363D]">
                            <button
                                onClick={() => setBilling("monthly")}
                                className={`px-6 py-2.5 rounded-full text-base font-semibold transition-all duration-200 cursor-pointer ${billing === "monthly"
                                    ? "bg-[#E85D2A] text-white shadow-md"
                                    : "text-[#656D76] dark:text-[#8B949E] hover:text-[#0E1116] dark:hover:text-white"
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBilling("yearly")}
                                className={`px-6 py-2.5 rounded-full text-base font-semibold transition-all duration-200 cursor-pointer ${billing === "yearly"
                                    ? "bg-[#E85D2A] text-white shadow-md"
                                    : "text-[#656D76] dark:text-[#8B949E] hover:text-[#0E1116] dark:hover:text-white"
                                    }`}
                            >
                                Yearly
                            </button>
                        </div>
                        {billing === "monthly" && (
                            <p className="text-sm text-[#CA8A04] font-medium mt-2.5">Save 30% with yearly</p>
                        )}
                    </div>
                </motion.div>
            </section>

            {/* ═══ SECTION 2: PRICING CARDS ═══ */}
            <motion.section
                className="relative mt-12 px-4 md:px-6"
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
            >
                {/* Floating decorative shape */}
                <div className="absolute -top-10 right-[5%] w-[80px] h-[80px] rounded-full bg-[#E85D2A]/8 blur-[40px] pointer-events-none hidden md:block" />

                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Pro card — first on mobile via order */}
                    <div className="relative rounded-2xl p-8 md:p-10 bg-white dark:bg-[#161B22] border-2 border-[#CA8A04] pro-card-glow order-first md:order-last overflow-hidden">
                        {/* Inner radial glow */}
                        <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: "radial-gradient(circle at center, rgba(202,138,4,0.05) 0%, transparent 70%)" }} />

                        {/* Popular badge with shimmer */}
                        <span className="pro-popular-badge absolute -top-3.5 right-5 bg-[#CA8A04] text-white text-sm font-bold px-3 py-1 rounded-full">
                            Popular
                        </span>

                        {/* Header */}
                        <div className="relative">
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-2xl font-bold text-[#0E1116] dark:text-white">Pro</h3>
                                <span className="inline-flex items-center gap-1 bg-[#CA8A04] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <Crown className="w-2.5 h-2.5" />
                                    PRO
                                </span>
                            </div>
                            <p className="text-base text-[#656D76] dark:text-[#8B949E] mt-1">For serious foodies</p>
                        </div>

                        {/* Price */}
                        <div className="relative flex items-baseline gap-2 mt-5">
                            <span className="text-5xl md:text-6xl font-bold text-[#0E1116] dark:text-white tracking-tight">
                                {billing === "monthly" ? "$5.99" : "$49.99"}
                            </span>
                            <span className="text-base text-[#656D76] dark:text-[#8B949E]">
                                CAD/{billing === "monthly" ? "month" : "year"}
                            </span>
                            {billing === "yearly" && (
                                <span className="text-base text-[#8B949E] line-through ml-1">$71.88</span>
                            )}
                        </div>

                        {/* CTA */}
                        <button
                            onClick={handleCta}
                            disabled={loading}
                            className="relative w-full bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold py-4 rounded-xl text-lg transition-all duration-200 mt-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Redirecting...
                                </span>
                            ) : "Upgrade to Pro"}
                        </button>

                        {/* Divider */}
                        <div className="relative border-t border-[#D0D7DE] dark:border-[#30363D] my-6" />

                        {/* Feature list */}
                        <div className="relative space-y-4">
                            {PRO_FEATURES_LIST.map((f) => (
                                <div key={f.text} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-[#E85D2A] shrink-0" />
                                    <span className={`text-base ${f.gold ? "text-[#CA8A04] font-medium" : "text-[#0E1116] dark:text-white"}`}>
                                        {f.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Free card */}
                    <div className="relative rounded-2xl p-8 md:p-10 bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] order-last md:order-first overflow-hidden">
                        {/* Subtle diagonal stripe pattern */}
                        <div
                            className="absolute inset-0 pointer-events-none rounded-2xl"
                            style={{
                                backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.015) 10px, rgba(255,255,255,0.015) 11px)",
                            }}
                        />

                        {/* Header */}
                        <div className="relative">
                            <h3 className="text-2xl font-bold text-[#0E1116] dark:text-white">Free</h3>
                            <p className="text-base text-[#656D76] dark:text-[#8B949E] mt-1">For casual explorers</p>
                        </div>

                        {/* Price */}
                        <div className="relative flex items-baseline gap-2 mt-5">
                            <span className="text-5xl md:text-6xl font-bold text-[#0E1116] dark:text-white tracking-tight">$0</span>
                            <span className="text-base text-[#656D76] dark:text-[#8B949E]">/month</span>
                        </div>

                        {/* Spacer to align with Pro card CTA */}
                        <div className="h-[68px] mt-6" />

                        {/* Divider */}
                        <div className="relative border-t border-[#D0D7DE] dark:border-[#30363D] my-6" />

                        {/* Feature list */}
                        <div className="relative space-y-4">
                            {FREE_FEATURES.map((f) => (
                                <div key={f.text} className="flex items-center gap-3">
                                    {f.included ? (
                                        <Check className="w-5 h-5 text-[#E85D2A] shrink-0" />
                                    ) : (
                                        <X className="w-5 h-5 text-[#8B949E] shrink-0" />
                                    )}
                                    <span className={`text-base ${f.included
                                        ? "text-[#0E1116] dark:text-white"
                                        : "text-[#8B949E] line-through"
                                        }`}>
                                        {f.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* See all features link */}
                <p className="text-center mt-6">
                    <span className="text-sm text-[#CA8A04] hover:underline cursor-pointer">
                        See all plans & features
                    </span>
                </p>
            </motion.section>

            {/* ═══ SECTION 3: FEATURE HIGHLIGHTS ═══ */}
            <motion.section
                className="relative mt-20 md:mt-24 px-4 md:px-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={sectionVariants}
            >
                {/* Floating decorative shape */}
                <div className="absolute top-10 left-[3%] w-[60px] h-[60px] rounded-full bg-[#CA8A04]/8 blur-[30px] pointer-events-none hidden md:block" />

                <h2 className="text-3xl font-bold text-[#0E1116] dark:text-white text-center mb-10">
                    Everything in Pro
                </h2>

                <motion.div
                    className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                >
                    {FEATURE_CARDS.map(({ Icon, title, desc }) => (
                        <motion.div
                            key={title}
                            variants={cardVariants}
                            className="pro-feature-card relative flex items-start gap-4 rounded-xl p-6 bg-[#F6F8FA] dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] overflow-hidden"
                            style={{ "--card-bg": "var(--tw-bg-opacity, 1)" } as React.CSSProperties}
                        >
                            {/* Accent line */}
                            <div className="absolute top-4 left-0 w-[2px] h-10 bg-[#E85D2A]/20 rounded-r-full" />
                            {/* Icon with circle bg */}
                            <div className="w-12 h-12 rounded-full bg-[#E85D2A]/10 flex items-center justify-center shrink-0">
                                <Icon className="w-6 h-6 text-[#E85D2A]" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-[#0E1116] dark:text-white">{title}</h3>
                                <p className="text-sm text-[#656D76] dark:text-[#8B949E] mt-0.5">{desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.section>

            {/* ═══ SECTION 4: FAQ ACCORDION ═══ */}
            <motion.section
                className="relative mt-20 md:mt-24 px-4 md:px-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={sectionVariants}
            >
                {/* Floating decorative shape */}
                <div className="absolute top-20 right-[5%] w-[100px] h-[100px] rounded-full bg-[#E85D2A]/5 blur-[50px] pointer-events-none hidden md:block" />

                <h2 className="text-3xl font-bold text-[#0E1116] dark:text-white text-center mb-8">
                    Frequently Asked Questions
                </h2>

                <div className="max-w-3xl mx-auto space-y-3">
                    {FAQS.map((faq, i) => (
                        <div
                            key={i}
                            className="rounded-xl bg-[#F6F8FA] dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer"
                            >
                                <span className="text-base font-medium text-[#0E1116] dark:text-white pr-4">
                                    {faq.q}
                                </span>
                                <motion.div
                                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="w-5 h-5 text-[#656D76] dark:text-[#8B949E] shrink-0" />
                                </motion.div>
                            </button>
                            <AnimatePresence initial={false}>
                                {openFaq === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-base text-[#656D76] dark:text-[#8B949E] px-6 pt-0 pb-4">
                                            {faq.a}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* ═══ SECTION 5: BOTTOM CTA ═══ */}
            <motion.section
                className="mt-20 md:mt-24 mb-16 text-center px-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={sectionVariants}
            >
                <h2 className="text-3xl font-bold text-[#0E1116] dark:text-white">
                    Ready to upgrade?
                </h2>
                <button
                    onClick={handleCta}
                    disabled={loading}
                    className="w-full max-w-md mx-auto bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold py-4 rounded-xl text-lg transition-all duration-200 mt-6 cursor-pointer block disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Redirecting...
                        </span>
                    ) : "Upgrade to Pro"}
                </button>
                <p className="text-sm text-[#656D76] dark:text-[#8B949E] mt-3">
                    Cancel anytime. No commitment.
                </p>
            </motion.section>
        </div>
    );
}

export default function ProPage() {
    return (
        <Suspense>
            <ProPageContent />
        </Suspense>
    );
}
