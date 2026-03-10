"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const { status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  function validateEmailOnBlur() {
    if (email.trim() && !emailRegex.test(email.trim())) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!emailRegex.test(email.trim())) {
      setFieldErrors({ email: "Please enter a valid email address" });
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
    if (!emailRegex.test(email.trim())) errors.email = "Please enter a valid email address";
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
    "w-full px-4 py-3 rounded-xl bg-[#161B22] border border-[#30363D] text-white placeholder-[#8B949E] text-sm focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/30 focus:outline-none transition-all duration-200";

  return (
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#E85D2A]/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#CA8A04]/8 rounded-full blur-[120px]" />

      {/* Centered form */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
        {/* Logo */}
        <h1 className="text-4xl font-bold text-[#E85D2A] text-center mb-2">Savrd</h1>
        <p className="text-sm text-[#8B949E] text-center mb-10">
          Discover your city, one swipe at a time.
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

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white text-center mb-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-[#8B949E] text-center mb-8">
          {mode === "signin"
            ? "Sign in to continue swiping"
            : "Start discovering Toronto"}
        </p>

        {/* Google OAuth */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
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
      </div>
    </div>
  );
}
