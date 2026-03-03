"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

const PRO_FEATURES = [
    { emoji: "🎛️", title: "Advanced filters", desc: "Noise level, outlets, cuisine type — find exactly what you need." },
    { emoji: "📋", title: "Unlimited boards", desc: "Organize by neighborhood, mood, season, or whatever you want." },
    { emoji: "✨", title: "Ad-free deck", desc: "No promoted places. Just pure, uninterrupted swiping." },
    { emoji: "📤", title: "Export saved places", desc: "Download your spots as CSV. Your data, your way." },
    { emoji: "📝", title: "Unlimited curated lists", desc: "Create and publish as many lists as you like." },
    { emoji: "🚀", title: "Early access", desc: "Be the first to try new features before anyone else." },
];

const FREE_FEATURES = [
    "5 boards",
    "Basic intent filters",
    "Friend recommendations",
    "Exploration badges",
    "Verified visits",
    "3 curated lists",
];

const FAQS = [
    { q: "Can I cancel anytime?", a: "Yes. Cancel whenever you want — you'll keep Pro until the end of your billing period." },
    { q: "Will I lose my data if I downgrade?", a: "Nope. Your saved places, boards, and lists stay safe. You just lose access to Pro features." },
    { q: "Is there a free trial?", a: "Every Pro subscription starts with a 7-day free trial. You won't be charged until it ends." },
];

export default function ProPage() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const { showToast } = useToast();

    const handleCta = () => {
        showToast("Coming soon! We'll let you know when Pro launches.");
    };

    return (
        <div className="min-h-dvh bg-[#0E1116] pb-28">

            {/* Hero — compact */}
            <section className="pt-16 pb-8 px-5">
                <div className="max-w-xl mx-auto text-center">
                    <span className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                        Pro
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-white mt-5 leading-tight tracking-tight">
                        WhereTo, but better
                    </h1>
                    <p className="text-base text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
                        Unlock advanced filters, unlimited boards, ad-free swiping, and more.
                    </p>
                </div>
            </section>

            {/* Feature cards */}
            <section className="max-w-2xl mx-auto px-5 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRO_FEATURES.map((f) => (
                        <div key={f.title} className="bg-[#161B22] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                            <span className="text-2xl">{f.emoji}</span>
                            <h3 className="text-sm font-bold text-white mt-2">{f.title}</h3>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Already free */}
            <section className="max-w-2xl mx-auto px-5 mt-12">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Already included for free</h2>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {FREE_FEATURES.map((f) => (
                        <span key={f} className="px-3 py-1.5 bg-white/5 rounded-full text-xs text-gray-400 border border-white/5">
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {/* Pricing card */}
            <section className="max-w-md mx-auto px-5 mt-14">
                <div className="bg-[#161B22] rounded-2xl border border-white/5 p-6">

                    {/* Billing toggle */}
                    <div className="flex items-center justify-center gap-1 bg-white/5 rounded-lg p-1 w-fit mx-auto">
                        <button
                            onClick={() => setBilling("monthly")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${billing === "monthly" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBilling("yearly")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${billing === "yearly" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300"}`}
                        >
                            Yearly
                        </button>
                    </div>

                    {/* Price */}
                    <div className="mt-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-black text-white tracking-tight">
                                {billing === "monthly" ? "$5.99" : "$49.99"}
                            </span>
                            <span className="text-sm text-gray-400">
                                CAD / {billing === "monthly" ? "month" : "year"}
                            </span>
                        </div>
                        {billing === "yearly" && (
                            <span className="inline-block mt-2 bg-green-500/10 text-green-400 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                Save 30%
                            </span>
                        )}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handleCta}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-6 py-3.5 rounded-xl hover:opacity-90 transition mt-6 cursor-pointer"
                    >
                        Start 7-day free trial
                    </button>
                    <p className="text-gray-500 text-xs text-center mt-3">Cancel anytime. No commitment.</p>
                </div>
            </section>

            {/* FAQ */}
            <section className="max-w-lg mx-auto px-5 mt-14">
                <h2 className="text-lg font-bold text-white text-center">Questions</h2>

                <div className="mt-6">
                    {FAQS.map((faq, i) => (
                        <div key={i} className="border-b border-white/10">
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                            >
                                <span className="text-white text-sm font-medium pr-4">{faq.q}</span>
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`text-gray-500 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>
                            {openFaq === i && (
                                <p className="text-gray-400 text-sm pb-4 -mt-1">{faq.a}</p>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
