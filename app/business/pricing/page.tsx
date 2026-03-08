"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
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
      "Claim your business listing",
      "View total saves & visits",
      "See your rating & price level",
      "Basic intent categories",
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
      "Everything in Free",
      "Saves over time trends",
      "Swipe-right rate tracking",
      "Peak discovery hours",
      "Weekly email reports",
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
      "Everything in Starter",
      "Competitive benchmarks",
      "Neighborhood ranking",
      "Customer intent demographics",
      "Missed opportunity alerts",
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
      "Everything in Growth",
      "Anonymous intent data export",
      "Multi-location management",
      "API access & integrations",
      "Priority support",
      "Custom featured placements",
    ],
    cta: "Contact Sales",
    ctaStyle: "bg-transparent border border-white/20 text-gray-300 hover:border-white/40",
    showBeta: true,
    planKey: "business_pro",
  },
];

export default function PricingPage() {
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
      router.push("/business/login");
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
        <div className="mt-4 inline-block bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-sm font-medium">
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
                ? "bg-[#161B22] border-2 border-[#E85D2A]"
                : "bg-[#161B22] border border-white/10"
            }`}
          >
            {/* Most Popular badge */}
            {tier.highlighted && (
              <span className="absolute bg-[#E85D2A] text-white text-xs font-bold px-3 py-1 rounded-full -top-3 left-1/2 -translate-x-1/2">
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
              <p className="text-green-400 text-xs font-medium mt-1">Free during beta</p>
            )}

            {/* Description */}
            <p className="text-gray-400 text-sm mt-2">{tier.description}</p>

            {/* Divider */}
            <div className="border-t border-white/10 my-6" />

            {/* Features */}
            <ul className="space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className={`w-full py-2.5 rounded-lg text-sm mt-6 transition ${tier.ctaStyle} ${loadingPlan === tier.planKey ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={tier.isCurrent || loadingPlan === tier.planKey}
              onClick={() => tier.planKey && handleCheckout(tier.planKey)}
            >
              {loadingPlan === tier.planKey ? "Redirecting..." : tier.cta}
            </button>
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
