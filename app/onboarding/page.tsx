"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Heart,
  Coffee,
  Laptop,
  Users,
  DollarSign,
  MessageCircle,
  Sun,
  Sofa,
  Flame,
  MapPin,
  Check,
  X,
  Loader2,
} from "lucide-react";

const VIBE_OPTIONS = [
  { id: "study_work", icon: BookOpen, label: "Study / Work" },
  { id: "romantic", icon: Heart, label: "Romantic" },
  { id: "chill", icon: Sofa, label: "Chill Vibes" },
  { id: "trending", icon: Flame, label: "Trending Now" },
  { id: "quiet_cafes", icon: Coffee, label: "Quiet Cafés" },
  { id: "laptop_friendly", icon: Laptop, label: "Laptop-Friendly" },
  { id: "group_hangouts", icon: Users, label: "Group Hangouts" },
  { id: "budget_eats", icon: DollarSign, label: "Budget Eats" },
  { id: "coffee_catch_up", icon: MessageCircle, label: "Coffee & Catch-Up" },
  { id: "outdoor_patio", icon: Sun, label: "Outdoor / Patio" },
];

function suggestUsername(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 30);
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState(false);

  // Step 1: Username
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameError, setUsernameError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Step 2: Vibes
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  // Step 3: Location
  const [locationNote, setLocationNote] = useState("");

  // Saving state
  const [saving, setSaving] = useState(false);

  // Redirect logic
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  // Check if already completed onboarding
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as { hasCompletedOnboarding?: boolean };
      if (user.hasCompletedOnboarding) {
        router.replace("/");
      }
    }
  }, [status, session, router]);

  // Pre-fill username from session name
  useEffect(() => {
    if (!prefilled && session?.user?.name) {
      const suggested = suggestUsername(session.user.name);
      if (suggested.length >= 3) {
        setUsername(suggested);
        setPrefilled(true);
      }
    }
  }, [session, prefilled]);

  const checkUsername = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const cleaned = value.toLowerCase().trim();
    if (!cleaned || cleaned.length < 3) {
      setUsernameStatus(cleaned.length > 0 ? "invalid" : "idle");
      setUsernameError(cleaned.length > 0 ? "Must be at least 3 characters" : "");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleaned)) {
      setUsernameStatus("invalid");
      setUsernameError("Only lowercase letters, numbers, and underscores");
      return;
    }
    if (cleaned.length > 30) {
      setUsernameStatus("invalid");
      setUsernameError("Must be 30 characters or less");
      return;
    }

    setUsernameStatus("checking");
    setUsernameError("");

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  }, []);

  // Auto-check prefilled username
  useEffect(() => {
    if (prefilled && username.length >= 3) {
      checkUsername(username);
    }
  }, [prefilled, username, checkUsername]);

  function handleUsernameChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
    setUsername(cleaned);
    checkUsername(cleaned);
  }

  function goToStep(target: number) {
    if (animating) return;
    setDirection(target > step ? "forward" : "backward");
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
    }, 200);
  }

  function toggleVibe(id: string) {
    setSelectedVibes((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  async function handleLocationEnable() {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      localStorage.setItem(
        "savrd_user_location",
        JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      );
      await finishOnboarding();
    } catch {
      setLocationNote("No worries — you can enable this later in settings");
      setTimeout(() => finishOnboarding(), 1500);
    }
  }

  function handleLocationSkip() {
    // Default to Toronto downtown
    localStorage.setItem(
      "savrd_user_location",
      JSON.stringify({ lat: 43.6532, lng: -79.3832 })
    );
    finishOnboarding();
  }

  async function finishOnboarding() {
    setSaving(true);
    try {
      await fetch("/api/auth/setup-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username || undefined,
          vibePreferences: selectedVibes.length > 0 ? selectedVibes : undefined,
          hasCompletedOnboarding: true,
        }),
      });
    } catch {
      // Still redirect even if save fails — they can update profile later
    }
    // Full page reload to get a fresh JWT with hasCompletedOnboarding: true
    // (client-side router.replace keeps stale session from SessionProvider)
    window.location.href = "/";
  }

  if (status === "loading" || status === "unauthenticated") {
    return <div className="min-h-screen bg-[#0E1116]" />;
  }

  const canContinueStep1 = username.length >= 3 && usernameStatus === "available";

  return (
    <div className="min-h-screen bg-[#0E1116] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#E85D2A]/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#CA8A04]/8 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`rounded-full transition-all duration-300 ${
                s === step
                  ? "w-8 h-2 bg-[#E85D2A]"
                  : s < step
                  ? "w-2 h-2 bg-[#E85D2A]"
                  : "w-2 h-2 bg-[#30363D]"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[#8B949E] text-center mb-8">Step {step} of 3</p>

        {/* Step content with transition */}
        <div
          className={`transition-all duration-200 ease-out ${
            animating
              ? direction === "forward"
                ? "opacity-0 -translate-x-4"
                : "opacity-0 translate-x-4"
              : "opacity-100 translate-x-0"
          }`}
        >
          {step === 1 && (
            <StepUsername
              username={username}
              usernameStatus={usernameStatus}
              usernameError={usernameError}
              onChange={handleUsernameChange}
              onContinue={() => goToStep(2)}
              canContinue={canContinueStep1}
            />
          )}

          {step === 2 && (
            <StepVibes
              selected={selectedVibes}
              onToggle={toggleVibe}
              onContinue={() => {
                if (typeof window !== "undefined" && selectedVibes.length > 0) {
                  localStorage.setItem("savrd-preferred-vibes", JSON.stringify(selectedVibes));
                }
                goToStep(3);
              }}
              onSkip={() => goToStep(3)}
            />
          )}

          {step === 3 && (
            <StepLocation
              onEnable={handleLocationEnable}
              onSkip={handleLocationSkip}
              locationNote={locationNote}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: Username ─── */
function StepUsername({
  username,
  usernameStatus,
  usernameError,
  onChange,
  onContinue,
  canContinue,
}: {
  username: string;
  usernameStatus: string;
  usernameError: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold text-white text-center mb-2">Pick your username</h2>
      <p className="text-sm text-[#8B949E] text-center mb-8">This is how friends will find you</p>

      <div className="flex items-center gap-0 w-full">
        <span className="text-lg text-[#8B949E] bg-[#0E1116] border border-[#30363D] border-r-0 rounded-l-lg px-4 py-3">
          @
        </span>
        <input
          type="text"
          value={username}
          onChange={(e) => onChange(e.target.value)}
          placeholder="username"
          className="flex-1 bg-[#0E1116] border border-[#30363D] border-l-0 rounded-r-lg px-4 py-3 text-white text-lg focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200 placeholder-[#8B949E]"
          maxLength={30}
          autoFocus
        />
      </div>

      {/* Status indicator */}
      <div className="h-6 mt-2">
        {usernameStatus === "checking" && (
          <p className="text-xs text-[#8B949E] flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Checking...
          </p>
        )}
        {usernameStatus === "available" && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <Check size={12} /> Available
          </p>
        )}
        {usernameStatus === "taken" && (
          <p className="text-xs text-[#F85149] flex items-center gap-1.5">
            <X size={12} /> Already taken
          </p>
        )}
        {usernameStatus === "invalid" && usernameError && (
          <p className="text-xs text-[#F85149]">{usernameError}</p>
        )}
      </div>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full py-3 mt-4 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue &rarr;
      </button>
    </>
  );
}

/* ─── Step 2: Vibes ─── */
function StepVibes({
  selected,
  onToggle,
  onContinue,
  onSkip,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold text-white text-center mb-2">What are you looking for?</h2>
      <p className="text-sm text-[#8B949E] text-center mb-8">Pick up to 3 — we&apos;ll personalize your feed</p>

      <div className="grid grid-cols-2 gap-3">
        {VIBE_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          const isDisabled = !isSelected && selected.length >= 3;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => onToggle(option.id)}
              disabled={isDisabled}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? "bg-[#E85D2A]/10 border-[#E85D2A] text-white"
                  : isDisabled
                  ? "bg-[#161B22] border-[#30363D] text-[#8B949E] opacity-50 cursor-not-allowed"
                  : "bg-[#161B22] border-[#30363D] text-[#8B949E] hover:border-[#8B949E]"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[#8B949E] text-center mt-4">
        {selected.length} of 3 selected
      </p>

      <button
        onClick={onContinue}
        className="w-full py-3 mt-4 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold text-sm transition-all duration-200 cursor-pointer"
      >
        Continue &rarr;
      </button>

      <button
        onClick={onSkip}
        className="w-full text-sm text-[#8B949E] hover:text-white text-center mt-3 cursor-pointer transition-colors duration-200"
      >
        Skip
      </button>
    </>
  );
}

/* ─── Step 3: Location ─── */
function StepLocation({
  onEnable,
  onSkip,
  locationNote,
  saving,
}: {
  onEnable: () => void;
  onSkip: () => void;
  locationNote: string;
  saving: boolean;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold text-white text-center mb-2">Find spots near you</h2>
      <p className="text-sm text-[#8B949E] text-center mb-8">We use your location to show nearby places</p>

      <div className="flex justify-center mb-6">
        <MapPin
          size={64}
          className="text-[#E85D2A]"
          style={{ animation: "onboarding-pulse 2s ease-in-out infinite" }}
        />
      </div>

      <style jsx>{`
        @keyframes onboarding-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      {locationNote && (
        <p className="text-xs text-[#8B949E] text-center mb-3">{locationNote}</p>
      )}

      <button
        onClick={onEnable}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Setting up..." : "Enable Location"}
      </button>

      <button
        onClick={onSkip}
        disabled={saving}
        className="w-full text-sm text-[#8B949E] hover:text-white text-center mt-3 cursor-pointer transition-colors duration-200 disabled:opacity-50"
      >
        Maybe later
      </button>
    </>
  );
}
