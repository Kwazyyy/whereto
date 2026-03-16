"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface PlaceResult {
  googlePlaceId: string;
  name: string;
  address: string;
  rating: number | null;
  priceLevel: string | null;
  photoUrl: string | null;
  types: string[];
  googleMapsUrl: string | null;
}

function priceLevelToDollars(level: string | null): string {
  switch (level) {
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
      return "$$$";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$$";
    default:
      return "";
  }
}

function SkeletonCard() {
  return (
    <div className="bg-[#161B22] rounded-xl p-4 animate-pulse flex items-center gap-4">
      <div className="w-16 h-16 rounded-lg bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-white/10 rounded" />
        <div className="h-3 w-64 bg-white/10 rounded" />
      </div>
    </div>
  );
}

function PlacePhoto({ place, size = "w-16 h-16" }: { place: PlaceResult; size?: string }) {
  if (place.photoUrl) {
    return (
      <img
        src={place.photoUrl}
        alt={place.name}
        className={`${size} rounded-lg object-cover shrink-0`}
      />
    );
  }
  return (
    <div className={`${size} rounded-lg bg-white/10 flex items-center justify-center shrink-0`}>
      <span className="text-gray-400 text-xl font-bold">
        {place.name?.[0]?.toUpperCase() || "?"}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const stepAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function ClaimPage() {
  const [step, setStep] = useState<"search" | "form" | "confirmation">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [ownerRole, setOwnerRole] = useState("Owner");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setHasSearched(false);
      setSearchError("");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearchError("");
      setHasSearched(true);

      try {
        const res = await fetch(
          `/api/business/search-places?query=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
          throw new Error("Search failed");
        }

        const data = (await res.json()) as { places: PlaceResult[] };
        setResults(data.places);
      } catch {
        setSearchError("Something went wrong. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  function handleSelectPlace(place: PlaceResult) {
    setSelectedPlace(place);
    setStep("form");
  }

  function handleChangePlace() {
    setSelectedPlace(null);
    setStep("search");
  }

  function handleClaimAnother() {
    setSelectedPlace(null);
    setOwnerRole("Owner");
    setBusinessEmail("");
    setBusinessPhone("");
    setFormError("");
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setStep("search");
  }

  async function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlace || !businessEmail) return;

    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/business/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googlePlaceId: selectedPlace.googlePlaceId,
          businessName: selectedPlace.name,
          businessEmail,
          businessPhone: businessPhone || null,
          ownerRole,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setFormError(data.error || "Failed to submit claim");
        return;
      }

      setStep("confirmation");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Confirmation step ---
  if (step === "confirmation") {
    return (
      <motion.div className="max-w-2xl mx-auto mt-12" {...stepAnimation} key="confirmation">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mt-6 text-center">Claim Submitted!</h2>
        <p className="text-gray-400 text-center mt-3 max-w-md mx-auto">
          We&apos;ll review your claim and notify you at{" "}
          <span className="text-white">{businessEmail}</span> within 24-48 hours.
          Once approved, you&apos;ll get full access to your business dashboard.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/business/dashboard"
            className="bg-[#E85D2A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#d4522a] transition"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={handleClaimAnother}
            className="bg-transparent border border-white/20 text-gray-300 px-6 py-3 rounded-lg font-medium hover:border-white/40 transition"
          >
            Claim Another Business
          </button>
        </div>
      </motion.div>
    );
  }

  // --- Form step ---
  if (step === "form" && selectedPlace) {
    return (
      <motion.div className="max-w-2xl mx-auto" {...stepAnimation} key="form">
        <h1 className="text-3xl font-bold text-white">Claim Your Business</h1>
        <p className="text-gray-400 mt-2 mb-8">
          Fill in your details to claim this business
        </p>

        {/* Selected place card */}
        <div className="bg-[#161B22] rounded-xl p-4 flex items-center gap-4 border border-white/10">
          <PlacePhoto place={selectedPlace} />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{selectedPlace.name}</p>
            <p className="text-gray-400 text-sm truncate">{selectedPlace.address}</p>
          </div>
          <button
            onClick={handleChangePlace}
            className="text-[#E85D2A] text-sm hover:underline cursor-pointer shrink-0"
          >
            Change
          </button>
        </div>

        {/* Claim form */}
        <form onSubmit={handleSubmitClaim} className="mt-6 space-y-5">
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-4">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="ownerRole" className="block text-sm text-gray-300 font-medium mb-1">
              Your Role
            </label>
            <div className="relative">
              <select
                id="ownerRole"
                value={ownerRole}
                onChange={(e) => setOwnerRole(e.target.value)}
                className="bg-[#0E1116] border border-white/10 rounded-lg px-4 py-3 text-white w-full focus:outline-none focus:border-[#E85D2A] transition appearance-none cursor-pointer"
              >
                <option value="Owner">Owner</option>
                <option value="Manager">Manager</option>
                <option value="Marketing Manager">Marketing Manager</option>
                <option value="Other">Other</option>
              </select>
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div>
            <label htmlFor="businessEmail" className="block text-sm text-gray-300 font-medium mb-1">
              Business Email
            </label>
            <input
              id="businessEmail"
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              required
              placeholder="you@yourbusiness.com"
              className="bg-[#0E1116] border border-[#30363D] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B949E] w-full focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="businessPhone" className="block text-sm text-gray-300 font-medium mb-1">
              Business Phone <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              id="businessPhone"
              type="tel"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              placeholder="+1 (416) 000-0000"
              className="bg-[#0E1116] border border-[#30363D] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B949E] w-full focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !businessEmail}
            className="bg-[#E85D2A] text-white font-semibold w-full py-3 rounded-lg hover:bg-[#d4522a] transition mt-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? <Spinner /> : "Submit Claim"}
          </button>
        </form>
      </motion.div>
    );
  }

  // --- Search step ---
  return (
    <motion.div className="max-w-2xl mx-auto" {...stepAnimation} key="search">
      <h1 className="text-3xl font-bold text-white">Claim Your Business</h1>
      <p className="text-gray-400 mt-2 mb-8">
        Search for your café or restaurant to get started
      </p>

      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by business name..."
          className="bg-[#0E1116] border border-[#30363D] rounded-lg px-4 py-3 pl-12 text-white text-sm placeholder-[#8B949E] w-full focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
        />
      </div>

      <div className="mt-4 space-y-3">
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && searchError && (
          <p className="text-red-400 text-center mt-8">{searchError}</p>
        )}

        {!loading && !searchError && hasSearched && results.length === 0 && (
          <p className="text-gray-500 text-center mt-8">
            No businesses found. Try a different search term.
          </p>
        )}

        {!loading &&
          !searchError &&
          results.map((place) => {
            const dollars = priceLevelToDollars(place.priceLevel);

            return (
              <div
                key={place.googlePlaceId}
                className="bg-[#161B22] rounded-xl p-4 flex items-center gap-4 border border-white/10 hover:border-[#E85D2A]/50 transition cursor-pointer"
                onClick={() => handleSelectPlace(place)}
              >
                <PlacePhoto place={place} />

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base truncate">
                    {place.name}
                  </p>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">
                    {place.address}
                  </p>
                  {(place.rating || dollars) && (
                    <p className="text-sm mt-1">
                      {place.rating && (
                        <span className="text-yellow-400">★ {place.rating}</span>
                      )}
                      {place.rating && dollars && (
                        <span className="text-gray-500"> · </span>
                      )}
                      {dollars && (
                        <span className="text-gray-400">{dollars}</span>
                      )}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlace(place);
                  }}
                  className="bg-[#E85D2A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#d4522a] transition shrink-0"
                >
                  Claim
                </button>
              </div>
            );
          })}
      </div>
    </motion.div>
  );
}
