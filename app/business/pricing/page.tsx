"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-[#E85D2A] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; gold: boolean }[];
  cta: string;
  ctaStyle: string;
  highlighted?: boolean;
  isCurrent?: boolean;
  showBeta?: boolean;
  planKey?: "business_starter" | "business_growth" | "business_pro";
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with basic insights",
    features: [
      { text: "Claim your business listing", gold: false },
      { text: "View total saves & visits", gold: false },
      { text: "See your rating & price level", gold: false },
      { text: "Basic intent categories", gold: false },
    ],
    cta: "Current Plan",
    ctaStyle: "bg-white/10 text-gray-400 cursor-default",
    isCurrent: true,
  },
  {
    name: "Starter",
    price: "$29 CAD",
    period: "/month",
    description: "Essential analytics for growing cafés",
    features: [
      { text: "Everything in Free", gold: false },
      { text: "Saves over time trends", gold: true },
      { text: "Swipe-right rate tracking", gold: true },
      { text: "Peak discovery hours", gold: true },
      { text: "Weekly email reports", gold: true },
    ],
    cta: "Start Free Trial",
    ctaStyle: "bg-[#E85D2A] text-white hover:bg-[#d4522a] font-medium",
    showBeta: true,
    planKey: "business_starter",
  },
  {
    name: "Growth",
    price: "$79 CAD",
    period: "/month",
    description: "Advanced insights to outperform competitors",
    features: [
      { text: "Everything in Starter", gold: false },
      { text: "Competitive benchmarks", gold: true },
      { text: "Neighborhood ranking", gold: true },
      { text: "Customer intent demographics", gold: true },
      { text: "Missed opportunity alerts", gold: true },
    ],
    cta: "Start Free Trial",
    ctaStyle: "bg-[#E85D2A] text-white hover:bg-[#d4522a] font-medium",
    highlighted: true,
    showBeta: true,
    planKey: "business_growth",
  },
  {
    name: "Pro",
    price: "$199 CAD",
    period: "/month",
    description: "Full platform for multi-location businesses",
    features: [
      { text: "Everything in Growth", gold: false },
      { text: "Anonymous intent data export", gold: true },
      { text: "Multi-location management", gold: true },
      { text: "API access & integrations", gold: true },
      { text: "Priority support", gold: true },
      { text: "Custom featured placements", gold: true },
    ],
    cta: "Contact Sales",
    ctaStyle: "bg-transparent border border-white/20 text-gray-300 hover:border-white/40",
    showBeta: true,
    planKey: "business_pro",
  },
];

function PricingPageContent() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { data: session } = useSession();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      showToast("Welcome! Your subscription is active \u{1F389}");
    } else if (searchParams.get("canceled") === "true") {
      showToast("Checkout canceled");
    }
  }, [searchParams, showToast]);

  const handleCheckout = async (planKey: string) => {
    if (!session?.user) {
      router.push("/business/register");
      return;
    }

    setLoadingPlan(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Something went wrong");
        setLoadingPlan(null);
      }
    } catch {
      showToast("Something went wrong");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Simple, transparent pricing</h1>
        <p className="text-gray-400 mt-2">Choose the plan that fits your business</p>
        <div className="mt-4 inline-block bg-[#E85D2A]/10 border border-[#E85D2A]/20 rounded-full px-4 py-1.5 text-[#E85D2A] text-sm font-medium">
          All plans free during beta
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl p-6 relative ${
              tier.highlighted
                ? "bg-[#161B22] border-2 border-[#CA8A04]"
                : "bg-[#161B22] border border-white/10"
            }`}
          >
            {/* Most Popular badge */}
            {tier.highlighted && (
              <span className="absolute bg-[#CA8A04] text-white text-xs font-bold px-3 py-1 rounded-full -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </span>
            )}

            {/* Tier name */}
            <h3 className="text-xl font-bold text-white">{tier.name}</h3>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-1">
              {tier.showBeta ? (
                <>
                  <span className="text-4xl font-bold text-white line-through decoration-gray-500">{tier.price}</span>
                  <span className="text-gray-400 text-sm">{tier.period}</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  <span className="text-gray-400 text-sm">{tier.period}</span>
                </>
              )}
            </div>
            {tier.showBeta && (
              <p className="text-[#E85D2A] text-xs font-medium mt-1">Free during beta</p>
            )}

            {/* Description */}
            <p className="text-gray-400 text-sm mt-2">{tier.description}</p>

            {/* Divider */}
            <div className="border-t border-white/10 my-6" />

            {/* Features */}
            <ul className="space-y-3">
              {tier.features.map((feature) => (
                <li key={feature.text} className={`flex items-start gap-2 text-sm ${feature.gold ? "text-[#CA8A04]" : "text-gray-300"}`}>
                  <CheckIcon />
                  {feature.text}
                </li>
              ))}
            </ul>

            {/* CTA */}
            {tier.planKey === "business_pro" ? (
              <a
                href="mailto:partners@savrd.app?subject=Savrd%20Business%20Pro%20Inquiry"
                className={`block text-center w-full py-2.5 rounded-lg text-sm mt-6 transition ${tier.ctaStyle}`}
              >
                {tier.cta}
              </a>
            ) : (
              <button
                className={`w-full py-2.5 rounded-lg text-sm mt-6 transition cursor-pointer ${tier.ctaStyle} ${loadingPlan === tier.planKey ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={tier.isCurrent || loadingPlan === tier.planKey}
                onClick={() => tier.planKey ? handleCheckout(tier.planKey) : undefined}
              >
                {loadingPlan === tier.planKey ? "Redirecting..." : tier.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom contact */}
      <div className="mt-12 text-center">
        <p className="text-gray-400">Have questions?</p>
        <p className="text-[#E85D2A] mt-1">Contact us at partners@savrd.app</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingPageContent />
    </Suspense>
  );
}
