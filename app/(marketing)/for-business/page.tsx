"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/* ─── Animation presets ──────────────────────────────────────── */
const ease = [0.25, 1, 0.5, 1] as const;
const fadeInView = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, delay, ease },
});

/* ─── Icons ──────────────────────────────────────────────────── */
function ChartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ─── Stats bar data ─────────────────────────────────────────── */
const stats = [
  { value: "5,000+", label: "Places Discovered" },
  { value: "28,000+", label: "Swipes Per Month" },
  { value: "10,000+", label: "Monthly Active Users" },
];

/* ─── Feature cards data ─────────────────────────────────────── */
const features = [
  {
    icon: <ChartIcon />,
    title: "Real-time analytics",
    description:
      "See exactly how many people save, visit, and discover your café. Track trends week over week.",
  },
  {
    icon: <UsersIcon />,
    title: "Understand your customers",
    description:
      "Learn what people are looking for when they find you — date night, study spot, group hangouts, and more.",
  },
  {
    icon: <TargetIcon />,
    title: "Stand out from competitors",
    description:
      "See how you rank in your neighborhood. Get insights to improve your visibility and attract more customers.",
  },
];

/* ─── Dashboard mockup stat data ─────────────────────────────── */
const mockStats = [
  { label: "Saves", value: "847" },
  { label: "Visits", value: "234" },
  { label: "Rating", value: "★ 4.8" },
  { label: "Save Rate", value: "32%" },
];

const mockBars = [
  { week: "Jan 5", height: 35 },
  { week: "Jan 12", height: 48 },
  { week: "Jan 19", height: 42 },
  { week: "Jan 26", height: 65 },
  { week: "Feb 2", height: 58 },
  { week: "Feb 9", height: 72 },
  { week: "Feb 16", height: 60 },
  { week: "Feb 23", height: 85 },
];

/* ─── Pricing preview data ───────────────────────────────────── */
const pricingTiers = [
  {
    name: "Starter",
    price: "$29 CAD",
    description: "Essential analytics for growing cafés",
  },
  {
    name: "Growth",
    price: "$79 CAD",
    description: "Advanced insights to outperform competitors",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$199 CAD",
    description: "Full platform for multi-location businesses",
  },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ForBusinessPage() {
  return (
    <div className="min-h-screen bg-[#0E1116] text-white overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 bg-[#0E1116]/90 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <Link href="/for-business" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#E85D2A]">WhereTo</span>
            <span className="text-sm font-bold text-white">for Business</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/business/pricing"
              className="text-sm text-gray-400 hover:text-white transition hidden sm:block"
            >
              Pricing
            </Link>
            <Link
              href="/business/login"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/business/register"
              className="bg-[#E85D2A] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#d4522a] transition"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E85D2A]/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#E85D2A]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="text-5xl md:text-6xl font-bold text-white text-center max-w-3xl mx-auto leading-tight"
          >
            Know how Toronto discovers your café
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="text-lg text-gray-400 text-center max-w-2xl mx-auto mt-6"
          >
            WhereTo helps thousands of people find their next favorite spot.
            Claim your business to see how you&apos;re performing and reach more
            customers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
          >
            <Link
              href="/business/register"
              className="inline-block bg-[#E85D2A] text-white text-lg px-8 py-4 rounded-xl font-semibold hover:bg-[#d4522a] transition mt-8 shadow-lg shadow-[#E85D2A]/20"
            >
              Claim Your Business — It&apos;s Free
            </Link>
            <p className="text-gray-500 text-sm text-center mt-3">
              No credit card required · Free during beta
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <motion.section
        {...fadeInView()}
        className="bg-[#161B22] py-8 mt-16"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16 px-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-[#E85D2A]">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Why WhereTo ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 mt-20">
        <motion.h2
          {...fadeInView()}
          className="text-3xl font-bold text-white text-center"
        >
          Why café owners love WhereTo
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              {...fadeInView(i * 0.12)}
              className="bg-[#161B22] rounded-2xl p-8 border border-white/5 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-[#E85D2A]/10 flex items-center justify-center mx-auto text-[#E85D2A]">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mt-4">
                {feature.title}
              </h3>
              <p className="text-gray-400 mt-2">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Dashboard preview ───────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 mt-20">
        <motion.h2
          {...fadeInView()}
          className="text-3xl font-bold text-white text-center"
        >
          Your business dashboard
        </motion.h2>
        <motion.p
          {...fadeInView(0.1)}
          className="text-gray-400 text-center mt-2"
        >
          Everything you need to understand and grow your presence
        </motion.p>

        <motion.div
          {...fadeInView(0.2)}
          className="bg-[#161B22] rounded-2xl p-6 md:p-8 border border-white/5 mt-10"
        >
          {/* Mock stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {mockStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-[#0E1116] rounded-xl p-4 border border-white/5"
              >
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Mock bar chart */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-300 mb-4">
              Saves Over Time
            </p>
            <div className="flex items-end gap-2 h-32">
              {mockBars.map((bar) => (
                <div
                  key={bar.week}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <div
                    className="w-full bg-[#E85D2A] rounded-t-md"
                    style={{ height: `${bar.height}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              {mockBars.map((bar) => (
                <div key={bar.week} className="flex-1 text-center">
                  <span className="text-[10px] text-gray-500">{bar.week}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Pricing preview ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 mt-20">
        <motion.h2
          {...fadeInView()}
          className="text-3xl font-bold text-white text-center"
        >
          Start free, upgrade when you&apos;re ready
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {pricingTiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              {...fadeInView(i * 0.1)}
              className={`bg-[#161B22] rounded-2xl p-6 border text-center relative ${
                tier.highlighted
                  ? "border-[#E85D2A] border-2"
                  : "border-white/5"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute bg-[#E85D2A] text-white text-xs font-bold px-3 py-1 rounded-full -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white line-through decoration-gray-500">
                  {tier.price}
                </span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <div className="inline-block bg-[#CA8A04]/10 border border-[#CA8A04]/20 rounded-full px-3 py-1 text-[#CA8A04] text-xs font-medium mt-2">
                Free during beta
              </div>
              <p className="text-gray-400 text-sm mt-3">{tier.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeInView(0.3)} className="text-center mt-6">
          <Link
            href="/business/pricing"
            className="text-[#CA8A04] text-sm hover:text-[#E85D2A] transition"
          >
            See all plans →
          </Link>
        </motion.div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <motion.section
        {...fadeInView()}
        className="max-w-4xl mx-auto px-6 mt-20"
      >
        <div className="bg-gradient-to-r from-[#E85D2A]/20 to-transparent rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to grow your business?
          </h2>
          <p className="text-gray-400 mt-2">
            Join hundreds of Toronto cafés already on WhereTo
          </p>
          <Link
            href="/business/register"
            className="inline-block bg-[#E85D2A] text-white text-lg px-8 py-4 rounded-xl font-semibold hover:bg-[#d4522a] transition mt-6 shadow-lg shadow-[#E85D2A]/20"
          >
            Get Started Free
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Questions? Email partners@whereto.app
          </p>
        </div>
      </motion.section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-white/5 mt-20 px-4 md:px-6">
        <p className="text-gray-500 text-sm text-center">
          © {new Date().getFullYear()} WhereTo. Made with love in Toronto.
        </p>
      </footer>
    </div>
  );
}
