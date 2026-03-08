"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const isValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign in after successful registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        // Account created but sign-in failed — send them to login
        router.push("/business/login");
      } else {
        router.push("/business/claim");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/for-business" className="inline-block">
            <span className="text-2xl font-bold text-[#E85D2A]">Savrd</span>
            <span className="text-lg text-gray-400 font-medium ml-2">for Business</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">
            Create your business account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#161B22] border border-white/10 rounded-2xl p-8"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm text-gray-300 mb-1 font-medium">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                className="bg-[#0E1116] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 w-full focus:outline-none focus:border-[#E85D2A] transition"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm text-gray-300 mb-1 font-medium">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@business.com"
                className="bg-[#0E1116] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 w-full focus:outline-none focus:border-[#E85D2A] transition"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm text-gray-300 mb-1 font-medium">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 8 characters"
                className="bg-[#0E1116] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 w-full focus:outline-none focus:border-[#E85D2A] transition"
              />
              {passwordTooShort && (
                <p className="text-red-400 text-xs mt-1">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm text-gray-300 mb-1 font-medium">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                className="bg-[#0E1116] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 w-full focus:outline-none focus:border-[#E85D2A] transition"
              />
              {passwordsMismatch && (
                <p className="text-red-400 text-xs mt-1">
                  Passwords don&apos;t match
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="bg-[#E85D2A] text-white font-semibold w-full py-3 rounded-lg hover:bg-[#d4522a] transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/business/login" className="text-[#E85D2A] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
