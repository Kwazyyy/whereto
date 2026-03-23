"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { isCapacitor, getAuthBaseUrl } from "@/lib/capacitor";
import { App } from "@capacitor/app";
import { motion } from "framer-motion";
import { Coffee, Croissant, Utensils, Wine, CakeSlice, IceCreamCone, Pizza, Soup, Sandwich, CupSoda } from "lucide-react";

export default function AuthPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  if (status === "authenticated") return null;

  async function handleGoogleSignIn() {
    if (!isCapacitor()) {
      signIn("google", { callbackUrl: "/" });
      return;
    }

    const { Browser } = await import("@capacitor/browser");
    const base = getAuthBaseUrl();

    const handleOAuthComplete = async () => {
      try {
        // Retrieve the one-time token and have the server set the session cookie
        const tokenRes = await fetch("/api/mobile-token");
        console.log("[Savrd] mobile-token status:", tokenRes.status);
      } catch (err) {
        console.log("[Savrd] token fetch error:", err);
      }
      
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json() as { user?: unknown };
        console.log("[Savrd] session after sign-in:", sessionData.user ? "authenticated" : "none");
        if (sessionData.user) {
          console.log("[Savrd] navigating to /");
          window.location.href = "/";
          return;
        }
      } catch (err) {
        console.log("[Savrd] session check error:", err);
      }
      console.log("[Savrd] no session — staying on /auth");
    };

    let handled = false;
    
    const browserListener = await Browser.addListener("browserFinished", async () => {
      browserListener.remove();
      if (handled) return;
      handled = true;
      console.log("[Savrd] browserFinished fired");
      await handleOAuthComplete();
    });

    const appListener = await App.addListener("appUrlOpen", async (data) => {
      if (data.url.includes("auth-done")) {
        appListener.remove();
        if (handled) return;
        handled = true;
        console.log("[Savrd] appUrlOpen fired, auto-closing browser");
        await Browser.close();
        await handleOAuthComplete();
      }
    });

    await Browser.open({
      url: `${base}/auth/google-redirect`,
    });
  }

  async function handleAppleSignIn() {
    if (!isCapacitor()) {
      signIn("apple", { callbackUrl: "/" });
      return;
    }

    const { Browser } = await import("@capacitor/browser");
    const base = getAuthBaseUrl();

    const handleOAuthComplete = async () => {
      try {
        const tokenRes = await fetch("/api/mobile-token");
        console.log("[Savrd] Apple mobile-token status:", tokenRes.status);
      } catch (err) {
        console.log("[Savrd] Apple token fetch error:", err);
      }
      
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json() as { user?: unknown };
        console.log("[Savrd] Apple session after sign-in:", sessionData.user ? "authenticated" : "none");
        if (sessionData.user) {
          console.log("[Savrd] navigating to /");
          window.location.href = "/";
          return;
        }
      } catch (err) {
        console.log("[Savrd] Apple session check error:", err);
      }
      console.log("[Savrd] no session — staying on /auth");
    };

    let handled = false;
    
    const browserListener = await Browser.addListener("browserFinished", async () => {
      browserListener.remove();
      if (handled) return;
      handled = true;
      console.log("[Savrd] Apple browserFinished fired");
      await handleOAuthComplete();
    });

    const appListener = await App.addListener("appUrlOpen", async (data) => {
      if (data.url.includes("auth-done")) {
        appListener.remove();
        if (handled) return;
        handled = true;
        console.log("[Savrd] Apple appUrlOpen fired, auto-closing browser");
        await Browser.close();
        await handleOAuthComplete();
      }
    });

    await Browser.open({
      url: `${base}/auth/apple-redirect`,
    });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const ALLOWED_DOMAINS = [
    "gmail.com", "yahoo.com", "yahoo.ca", "hotmail.com", "hotmail.ca",
    "outlook.com", "outlook.ca", "live.com", "live.ca", "icloud.com",
    "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
    "mail.com", "zoho.com", "ymail.com", "msn.com", "bell.net",
    "rogers.com", "shaw.ca", "telus.net", "sympatico.ca",
    "cogeco.ca", "videotron.ca", "sasktel.net",
    "utoronto.ca", "ryerson.ca", "torontomu.ca", "yorku.ca", "mcgill.ca",
    "ubc.ca", "uwaterloo.ca", "queensu.ca", "uottawa.ca", "ualberta.ca",
    "umontreal.ca", "dal.ca", "usask.ca", "ucalgary.ca",
    "mail.utoronto.ca", "student.ubc.ca",
    "savrd.ca", "savrd.app",
  ];

  function validateEmailDomain(emailValue: string): string | null {
    if (!emailRegex.test(emailValue.trim())) return "Please enter a valid email address";
    const domain = emailValue.trim().split("@")[1]?.toLowerCase();
    if (domain && !ALLOWED_DOMAINS.includes(domain)) return "Please use a valid email provider (Gmail, Outlook, iCloud, etc.)";
    return null;
  }

  function validateEmailOnBlur() {
    if (email.trim()) {
      const err = validateEmailDomain(email);
      if (err) setFieldErrors(prev => ({ ...prev, email: err }));
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const emailErr = validateEmailDomain(email);
    if (emailErr) {
      setFieldErrors({ email: emailErr });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
      setLoading(false);
    } else {
      router.replace("/");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errors: typeof fieldErrors = {};
    if (!name.trim() || name.trim().length < 2) errors.name = "Please enter your name";
    const emailErr = validateEmailDomain(email);
    if (emailErr) errors.email = emailErr;
    if (password.length < 8) errors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created. Please sign in.");
        setMode("signin");
        setLoading(false);
      } else {
        router.replace("/onboarding");
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-[#0E1116] border border-[#30363D] text-white placeholder-[#8B949E] text-sm focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200";

  return (
    <div className="min-h-screen bg-[#0E1116] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#E85D2A]/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#E85D2A]/8 rounded-full blur-[120px]" />

      {/* Floating food icons layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* 1. Coffee — top-left */}
        <motion.div
          className="absolute top-[6%] left-[5%] opacity-30 pointer-events-none"
          style={{ rotate: 12 }}
          animate={{ y: [0, -15, 0], rotate: [12, 17, 12] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-60 h-60 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Coffee color="#E85D2A" size={120} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 2. Croissant — top-right */}
        <motion.div
          className="absolute top-[6%] right-[6%] opacity-30 pointer-events-none"
          style={{ rotate: -15 }}
          animate={{ y: [0, -15, 0], rotate: [-15, -10, -15] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-56 h-56 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Croissant color="#E85D2A" size={110} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 5. Utensils — mid-left, hidden on mobile */}
        <motion.div
          className="absolute top-[50%] left-[2%] opacity-30 pointer-events-none hidden md:block"
          style={{ rotate: 20 }}
          animate={{ y: [0, -15, 0], rotate: [20, 25, 20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-48 h-48 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Utensils color="#E85D2A" size={100} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 6. Wine — mid-right, hidden on mobile */}
        <motion.div
          className="absolute top-[45%] right-[3%] opacity-30 pointer-events-none hidden md:block"
          style={{ rotate: -8 }}
          animate={{ y: [0, -15, 0], rotate: [-8, -3, -8] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-56 h-56 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Wine color="#E85D2A" size={110} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 8. CakeSlice — lower-left, visible on all screens */}
        <motion.div
          className="absolute bottom-[5%] left-[5%] md:bottom-[18%] md:left-[8%] opacity-30 pointer-events-none"
          style={{ rotate: 6 }}
          animate={{ y: [0, -15, 0], rotate: [6, 11, 6] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-40 h-40 md:w-56 md:h-56 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <CakeSlice color="#E85D2A" size={80} strokeWidth={1.5} className="relative md:hidden" />
          <CakeSlice color="#E85D2A" size={115} strokeWidth={1.5} className="relative hidden md:block" />
        </motion.div>

        {/* 10. IceCreamCone — bottom-right, visible on all screens */}
        <motion.div
          className="absolute bottom-[5%] right-[5%] md:bottom-[8%] md:right-[5%] opacity-30 pointer-events-none"
          style={{ rotate: -25 }}
          animate={{ y: [0, -15, 0], rotate: [-25, -20, -25] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-36 h-36 md:w-52 md:h-52 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <IceCreamCone color="#E85D2A" size={75} strokeWidth={1.5} className="relative md:hidden" />
          <IceCreamCone color="#E85D2A" size={105} strokeWidth={1.5} className="relative hidden md:block" />
        </motion.div>

        {/* 3. Pizza — top-center-left, hidden on mobile */}
        <motion.div
          className="absolute top-[3%] left-[28%] opacity-30 pointer-events-none hidden md:block"
          style={{ rotate: -10 }}
          animate={{ y: [0, -15, 0], rotate: [-10, -5, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-44 h-44 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Pizza color="#E85D2A" size={90} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 9. Soup — bottom-center, visible on all screens */}
        <motion.div
          className="absolute bottom-[3%] left-[40%] md:bottom-[5%] md:left-[42%] opacity-30 pointer-events-none"
          style={{ rotate: 8 }}
          animate={{ y: [0, -15, 0], rotate: [8, 13, 8] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-36 h-36 md:w-48 md:h-48 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Soup color="#E85D2A" size={70} strokeWidth={1.5} className="relative md:hidden" />
          <Soup color="#E85D2A" size={95} strokeWidth={1.5} className="relative hidden md:block" />
        </motion.div>

        {/* 4. Sandwich — top-center-right, large desktop only */}
        <motion.div
          className="absolute top-[15%] right-[20%] opacity-30 pointer-events-none hidden lg:block"
          style={{ rotate: 15 }}
          animate={{ y: [0, -15, 0], rotate: [15, 20, 15] }}
          transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-6 w-36 h-36 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Sandwich color="#E85D2A" size={75} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 7. CupSoda — lower-right, large desktop only */}
        <motion.div
          className="absolute bottom-[25%] right-[12%] opacity-30 pointer-events-none hidden lg:block"
          style={{ rotate: -18 }}
          animate={{ y: [0, -15, 0], rotate: [-18, -13, -18] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-6 w-40 h-40 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <CupSoda color="#E85D2A" size={85} strokeWidth={1.5} className="relative" />
        </motion.div>
      </div>

      {/* Ambient glow orbs behind card */}
      <div className="absolute top-[30%] left-[35%] w-80 h-80 rounded-full pointer-events-none z-[5]" style={{ background: 'radial-gradient(circle, rgba(232, 93, 42, 0.25) 0%, transparent 70%)' }} />
      <div className="absolute top-[30%] right-[33%] w-72 h-72 rounded-full pointer-events-none z-[5]" style={{ background: 'radial-gradient(circle, rgba(232, 93, 42, 0.2) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[20%] left-[38%] w-96 h-64 rounded-full pointer-events-none z-[5]" style={{ background: 'radial-gradient(ellipse, rgba(232, 93, 42, 0.15) 0%, transparent 70%)' }} />

      {/* Logo + tagline above card */}
      <div className="relative z-10 w-full max-w-md mx-auto text-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#E85D2A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Savrd</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Discover your city, one swipe at a time.
        </p>
      </div>

      {/* Centered form */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12" style={{ background: 'rgba(22, 27, 34, 0.4)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.22)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)', borderRadius: '24px' }}>
        {/* Heading */}
        <h2 className="text-2xl font-bold text-white text-center mb-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-[#8B949E] text-center mb-6">
          {mode === "signin"
            ? "Sign in to continue swiping"
            : "Start discovering Toronto"}
        </p>

        {/* Toggle */}
        <div className="flex bg-[#161B22] rounded-full p-1 mb-8 w-full">
          <button
            onClick={() => { setMode("signin"); setError(""); setFieldErrors({}); }}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold text-center transition-all duration-200 cursor-pointer ${
              mode === "signin"
                ? "bg-[#E85D2A] text-white"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); setFieldErrors({}); }}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold text-center transition-all duration-200 cursor-pointer ${
              mode === "signup"
                ? "bg-[#E85D2A] text-white"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-[#0E1116] font-semibold text-sm hover:bg-white/90 transition-all duration-200 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Apple OAuth */}
        <button
          onClick={handleAppleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 mt-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-black/90 transition-all duration-200 cursor-pointer border border-[#30363D]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.947 1.156-1.674 1.633-3.267 1.643-3.35-.022-.01-3.13-1.21-3.151-4.787-.018-2.986 2.45-4.437 2.569-4.509-1.39-2.036-3.553-2.316-4.331-2.355-2.031-.194-4.223 1.06-5.12 1.06H12.152zm-1.874-5.344c.834-1.012 2.112-1.748 3.32-1.896.166 1.365-.465 2.768-1.332 3.821-.77.941-2.19 1.672-3.328 1.492-.186-1.284.44-2.44 1.34-3.417z"/>
          </svg>
          Continue with Apple
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-[#30363D]" />
          <span className="text-xs text-[#8B949E]">or</span>
          <hr className="flex-1 border-[#30363D]" />
        </div>

        {/* Form */}
        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
          {mode === "signup" && (
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: undefined })); }}
                className={`${inputClass} ${fieldErrors.name ? "border-[#F85149]" : ""}`}
                required
              />
              {fieldErrors.name && <p className="text-xs text-[#F85149] mt-1">{fieldErrors.name}</p>}
            </div>
          )}

          <div className={mode === "signup" ? "mt-3" : ""}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })); }}
              onBlur={validateEmailOnBlur}
              className={`${inputClass} ${fieldErrors.email ? "border-[#F85149]" : ""}`}
              required
            />
            {fieldErrors.email && <p className="text-xs text-[#F85149] mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="mt-3">
            <input
              type="password"
              placeholder={mode === "signup" ? "Password (min 8 characters)" : "Password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })); }}
              className={`${inputClass} ${fieldErrors.password ? "border-[#F85149]" : ""}`}
              required
            />
            {fieldErrors.password && <p className="text-xs text-[#F85149] mt-1">{fieldErrors.password}</p>}
          </div>

          {mode === "signup" && (
            <div className="mt-3">
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                className={`${inputClass} ${fieldErrors.confirmPassword ? "border-[#F85149]" : ""}`}
                required
              />
              {fieldErrors.confirmPassword && <p className="text-xs text-[#F85149] mt-1">{fieldErrors.confirmPassword}</p>}
            </div>
          )}

          {error && (
            <p className="text-sm text-[#F85149] mt-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-xl bg-[#E85D2A] hover:bg-[#D14E1F] text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Loading..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {/* Legal */}
        <p className="text-xs text-[#8B949E]/50 text-center mt-8">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-[#8B949E] hover:text-white underline transition-colors duration-200">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="text-[#8B949E] hover:text-white underline transition-colors duration-200">Privacy Policy</a>
        </p>

        {/* Business login link */}
        <p className="text-sm text-center mt-4">
          <span className="text-[#8B949E]">Own a business? </span>
          <a href="/business/login" className="text-[#E85D2A] hover:text-[#E85D2A]/80 transition-colors duration-200">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
