"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
    const heroY = useTransform(scrollY, [0, 400], [0, 100]);

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleJoinWaitlist = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        setErrorMessage("");

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setEmail("");
            } else {
                setStatus("error");
                setErrorMessage(data.error || "Something went wrong.");
            }
        } catch (error) {
            setStatus("error");
            setErrorMessage("Failed to join waitlist. Try again.");
        }
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className={`min-h-screen bg-[#0A0A0B] text-white selection:bg-[#E85D2A]/30 ${inter.className}`}>

            {/* Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0A0A0B]">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E85D2A] mix-blend-screen opacity-[0.05] blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 mix-blend-screen opacity-[0.05] blur-[120px]" />
                <div className="absolute top-[40%] left-[80%] w-[20%] h-[20%] rounded-full bg-purple-500 mix-blend-screen opacity-[0.04] blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"
                }`}>
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-extrabold tracking-tight text-[#E85D2A]">
                        WhereTo
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                        <button onClick={() => scrollToSection("problem")} className="hover:text-white transition-colors">Why WhereTo?</button>
                        <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors">How It Works</button>
                        <button onClick={() => scrollToSection("cities")} className="hover:text-white transition-colors">Cities</button>
                        <button onClick={() => scrollToSection("for-cafes")} className="hover:text-white transition-colors">For Cafés</button>
                    </div>
                    <button
                        onClick={() => scrollToSection("waitlist")}
                        className="px-5 py-2.5 rounded-full bg-[#E85D2A] text-white font-bold text-sm hover:bg-[#d04e1f] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#E85D2A]/20"
                    >
                        Join Waitlist
                    </button>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
                    <div className="max-w-6xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center">

                        {/* Left Content */}
                        <motion.div
                            style={{ opacity: heroOpacity, y: heroY }}
                            className="flex flex-col gap-6 z-10"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6 w-fit">
                                    <span className="w-2 h-2 rounded-full bg-[#E85D2A] animate-pulse" />
                                    <span className="text-xs font-semibold tracking-wide text-gray-300 uppercase">Your City, Curated.</span>
                                </div>

                                <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                                    Stop Choosing.<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                        Start Discovering.
                                    </span>
                                </h1>

                                <p className="text-lg sm:text-xl text-gray-400 max-w-lg leading-relaxed mb-8">
                                    Discover cafés and restaurants effortlessly — without endless scrolling, outdated reviews, or annoying group chat debates.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link href="/" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#E85D2A] text-white font-bold text-lg hover:bg-[#d04e1f] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#E85D2A]/25">
                                        Start Swiping
                                    </Link>
                                    <button onClick={() => scrollToSection("how-it-works")} className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/15 bg-white/5 text-white font-bold text-lg hover:bg-white/10 transition-colors">
                                        See How It Works
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 mt-6 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                    No credit card required. Free forever for users.
                                </p>
                            </motion.div>
                        </motion.div>

                        {/* Right: Mockup Phone */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="relative mx-auto lg:mx-0 w-[300px] h-[600px] sm:w-[340px] sm:h-[680px] perspective-[2000px] z-10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black rounded-[3rem] p-3 shadow-2xl border border-white/10 ring-1 ring-white/5 rotate-y-[-10deg] rotate-x-[5deg] transform-style-[preserve-3d]">
                                <div className="absolute inset-0 bg-black rounded-[2.5rem] overflow-hidden m-3 flex flex-col pt-8">
                                    {/* Dynamic Island Notch */}
                                    <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50">
                                        <div className="w-1/3 h-full bg-black rounded-b-xl" />
                                    </div>

                                    {/* Fake UI Header */}
                                    <div className="px-5 pb-4 flex justify-between items-center z-10">
                                        <span className="font-extrabold text-[#E85D2A] text-lg">WhereTo</span>
                                    </div>
                                    {/* Fake Chips */}
                                    <div className="px-5 flex gap-2 overflow-hidden mb-4 z-10">
                                        <div className="px-3 py-1.5 rounded-full bg-[#E85D2A] text-white text-[10px] font-bold">☕ trending</div>
                                        <div className="px-3 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold">👨‍💻 study</div>
                                        <div className="px-3 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold">🍷 date</div>
                                    </div>

                                    {/* Fake Swipe Card */}
                                    <div className="flex-1 relative px-4 pb-8 z-10">
                                        <motion.div
                                            animate={{
                                                rotateZ: [-2, 2, -2],
                                                x: [-10, 10, -10]
                                            }}
                                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                            className="absolute inset-x-4 top-0 bottom-8 rounded-3xl bg-gray-800 overflow-hidden shadow-xl border border-white/5 flex flex-col justify-end p-5"
                                        >
                                            <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop" alt="Cafe" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                            <div className="relative z-10">
                                                <h3 className="text-2xl font-bold text-white mb-1">Founders Coffee</h3>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-300 font-medium">
                                                    <span>800m</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/50" />
                                                    <span>Café</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/50" />
                                                    <span>$$</span>
                                                </div>
                                                <div className="flex gap-2 mt-3 text-[10px]">
                                                    <span className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">Aesthetic</span>
                                                    <span className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">Quiet</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                </div>
                            </div>

                            {/* Highlight Glow from behind phone */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#E85D2A]/20 blur-[100px] -z-10" />
                        </motion.div>
                    </div>
                </section>

                {/* Problem Section */}
                <section id="problem" className="py-24 relative z-10 border-t border-white/5 bg-[#0a0a0b]/50">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Still arguing about where to eat?</h2>
                            <p className="text-gray-400 text-lg">
                                End the "Where should we go?" cycle. No more scrolling through 200 options on Maps. No more reading outdated reviews. No more indecision.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                            {/* Left: Messy Chat */}
                            <div className="bg-[#111113] p-6 rounded-3xl border border-white/10 flex flex-col gap-4 h-[400px]">
                                <div className="text-center text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">The Old Way</div>

                                <div className="flex justify-end">
                                    <div className="bg-blue-600 text-white text-sm px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">So where are we grabbing dinner tonight?</div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-[#222] text-gray-200 text-sm px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%]">idk, i'm down for whatever</div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-[#222] text-gray-200 text-sm px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%]">maybe sushi? or pasta?</div>
                                </div>
                                <div className="flex justify-end">
                                    <div className="bg-blue-600 text-white text-sm px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">Wait didn't we have sushi yesterday? Can you just pick a place?</div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-[#222] text-gray-200 text-sm px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%]">I literally picked last time. Just look on Maps.</div>
                                </div>
                            </div>

                            {/* Right: Clean Solution */}
                            <div className="bg-gradient-to-br from-[#1a1a20] to-[#111113] p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-4 h-[400px] relative overflow-hidden">
                                <div className="absolute top-6 text-center text-xs font-semibold text-[#E85D2A] uppercase tracking-wide">The WhereTo Way</div>

                                <div className="w-[85%] h-64 bg-black rounded-2xl shadow-2xl mt-8 rotate-3 border border-white/10 relative overflow-hidden flex flex-col justify-end p-4">
                                    <img src="https://images.unsplash.com/photo-1549488344-c4b9cdb6ce7a?q=80&w=600&auto=format&fit=crop" alt="Pizza" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="relative z-10 flex justify-between items-end">
                                        <div>
                                            <h4 className="font-bold text-white text-lg">Pizzeria Libretto</h4>
                                            <p className="text-gray-300 text-[10px]">1.2km • $$ • Date Night</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-[#E85D2A] flex items-center justify-center shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-6 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex gap-4 text-sm font-medium">
                                    <span className="flex items-center gap-2 text-white"><span className="w-2 h-2 rounded-full bg-green-500" /> Shared to Board</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-24 relative z-10 bg-[#0A0A0B]">
                    <div className="max-w-6xl mx-auto px-6">
                        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">How WhereTo Works</h2>

                        <div className="grid md:grid-cols-3 gap-10">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center text-3xl mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                    🎯
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center text-gray-400">1</span>
                                    Pick Your Vibe
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Choose from 9 distinct moods — Study, Date, Budget Eats, Trending, and more. We filter the noise.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-20 h-20 bg-[#E85D2A]/10 rounded-3xl flex items-center justify-center text-3xl mb-6 border border-[#E85D2A]/30 group-hover:scale-110 transition-transform duration-300">
                                    👆
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#E85D2A] text-xs flex items-center justify-center text-white">2</span>
                                    Swipe to Discover
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Right to save, left to skip, tap to flip for details, and swipe up to instantly get Maps directions.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center text-3xl mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                    🗂️
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center text-gray-400">3</span>
                                    Build Your Collection
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Your favorites auto-organize into boards by vibe. Share them with friends and plan outings in seconds.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cities Section */}
                <section id="cities" className="py-24 relative z-10 border-t border-white/5 bg-[#0a0a0b]/50">
                    <div className="max-w-6xl mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Coming to a City Near You</h2>
                        <p className="text-gray-400 mb-12 max-w-lg mx-auto">We are starting local and expanding fast. Vote for your city by joining the waitlist.</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-[#E85D2A] to-[#b34015] p-[1px] rounded-3xl">
                                <div className="bg-[#111113] w-full h-full rounded-[23px] p-6 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507992781348-310259076fe0?q=80&w=400&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay" />
                                    <span className="relative z-10 px-3 py-1 bg-[#E85D2A] text-[10px] font-bold uppercase tracking-wide rounded-full mb-3">Now Live</span>
                                    <h3 className="relative z-10 text-2xl font-bold">Toronto</h3>
                                </div>
                            </div>

                            <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-white/20 transition-colors">
                                <span className="text-[10px] font-bold uppercase tracking-wide mb-2 opacity-50">Coming Soon</span>
                                <h3 className="text-xl font-bold text-gray-300">Vancouver</h3>
                            </div>
                            <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-white/20 transition-colors">
                                <span className="text-[10px] font-bold uppercase tracking-wide mb-2 opacity-50">Coming Soon</span>
                                <h3 className="text-xl font-bold text-gray-300">Montreal</h3>
                            </div>
                            <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-white/20 transition-colors">
                                <span className="text-[10px] font-bold uppercase tracking-wide mb-2 opacity-50">Coming Soon</span>
                                <h3 className="text-xl font-bold text-gray-300">New York</h3>
                            </div>
                        </div>
                    </div>
                </section>

                {/* For Cafes Section */}
                <section id="for-cafes" className="py-24 relative z-10 bg-[#0A0A0B]">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/10 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="flex-1 relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6">
                                    <span className="text-xs font-semibold tracking-wide text-gray-300 uppercase">For Business Owners</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-6">Own a Café?<br />Get Discovered.</h2>
                                <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
                                    Join WhereTo to reach customers who are actively looking for places like yours based on vibes, not just vague star ratings. Claim your listing, organize your photos, and see real-time engagement analytics.
                                </p>
                                <button className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors shadow-lg">
                                    Partner With Us
                                </button>
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-4 relative z-10 w-full">
                                <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4">🏆</div>
                                    <h4 className="font-bold text-sm mb-1">Claim Listing</h4>
                                    <p className="text-xs text-gray-500">Take control of your venue's profile.</p>
                                </div>
                                <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4">📷</div>
                                    <h4 className="font-bold text-sm mb-1">Add Photos</h4>
                                    <p className="text-xs text-gray-500">Showcase your best dishes & lighting.</p>
                                </div>
                                <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4">📈</div>
                                    <h4 className="font-bold text-sm mb-1">See Analytics</h4>
                                    <p className="text-xs text-gray-500">Know how many people swiped right.</p>
                                </div>
                                <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-[#E85D2A]/20 flex items-center justify-center mb-4 text-[#E85D2A]">✨</div>
                                    <h4 className="font-bold text-sm mb-1">Get Featured</h4>
                                    <p className="text-xs text-gray-500">Boost visibility for specific 'vibes'.</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* CTA / Waitlist Section */}
                <section id="waitlist" className="py-32 relative z-10 border-t border-white/5 bg-[#0a0a0b]/80 flex flex-col items-center justify-center px-6 text-center">
                    <div className="absolute inset-0 bg-[#E85D2A]/5 mix-blend-screen pointer-events-none" />

                    <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Be the First to Know.</h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-md">We are currently in private beta. Join the waitlist to get early access when we expand.</p>

                    <div className="w-full max-w-md relative z-20">
                        <AnimatePresence mode="wait">
                            {status === "success" ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-green-500/10 border border-green-500/30 text-green-400 p-6 rounded-2xl"
                                >
                                    <div className="text-3xl mb-3">🎉</div>
                                    <h3 className="font-bold text-lg mb-1">You're on the list!</h3>
                                    <p className="text-sm opacity-80">Keep an eye on your inbox.</p>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onSubmit={handleJoinWaitlist}
                                    className="flex flex-col sm:flex-row gap-3"
                                >
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={status === "loading"}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D2A]/50 disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={status === "loading" || !email}
                                        className="px-8 py-4 rounded-full bg-[#E85D2A] text-white font-bold hover:bg-[#d04e1f] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-w-[140px]"
                                    >
                                        {status === "loading" ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            "Join Waitlist"
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {status === "error" && (
                            <p className="text-red-400 text-sm mt-3">{errorMessage}</p>
                        )}

                        <p className="text-xs text-gray-500 mt-6 flex items-center justify-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            No spam. Just launch updates.
                        </p>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-[#0A0A0B] py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <span className="text-2xl font-extrabold tracking-tight text-[#E85D2A]">WhereTo</span>
                        <span className="text-xs text-gray-500">© {new Date().getFullYear()} WhereTo. All rights reserved.</span>
                    </div>

                    <div className="flex gap-6 text-sm font-medium text-gray-400">
                        <button onClick={() => scrollToSection("problem")} className="hover:text-white transition-colors">About</button>
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="mailto:hello@whereto.app" className="hover:text-white transition-colors">Contact</Link>
                    </div>

                    <div className="flex gap-4">
                        {/* Social SVGs */}
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                        </a>
                    </div>
                </div>
                <div className="mt-8 text-center text-xs text-gray-600 font-medium">
                    Made with ❤️ in Toronto
                </div>
            </footer>
        </div>
    );
}
