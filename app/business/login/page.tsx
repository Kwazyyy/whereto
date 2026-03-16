"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BusinessFloatingIcons from "@/components/BusinessFloatingIcons";

export default function BusinessLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin"
          ? "Invalid email or password"
          : res.error
        );
      } else {
        router.push("/business/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E1116] flex flex-col items-center justify-center relative overflow-hidden p-6">
      <BusinessFloatingIcons />

      {/* Ambient glow orbs behind card */}
      <div className="absolute top-[30%] left-[35%] w-80 h-80 rounded-full pointer-events-none z-[5]" style={{ background: 'radial-gradient(circle, rgba(232, 93, 42, 0.25) 0%, transparent 70%)' }} />
      <div className="absolute top-[30%] right-[33%] w-72 h-72 rounded-full pointer-events-none z-[5]" style={{ background: 'radial-gradient(circle, rgba(232, 93, 42, 0.2) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[20%] left-[38%] w-96 h-64 rounded-full pointer-events-none z-[5]" style={{ background: 'radial-gradient(ellipse, rgba(232, 93, 42, 0.15) 0%, transparent 70%)' }} />

      {/* Wordmark above card */}
      <div className="relative z-10 w-full max-w-sm text-center mb-6">
        <Link href="/for-business" className="inline-block">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#E85D2A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Savrd</h1>
        </Link>
        <p className="text-sm text-[#8B949E] mt-1">For Business</p>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm">
            Sign in to manage your business
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" style={{ background: 'rgba(22, 27, 34, 0.4)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.22)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)', borderRadius: '24px' }}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0E1116] border border-[#30363D] rounded-lg text-white text-sm placeholder-[#8B949E] focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
              placeholder="you@business.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-[#0E1116] border border-[#30363D] rounded-lg text-white text-sm placeholder-[#8B949E] focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A]/20 focus:outline-none transition-colors duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#E85D2A] text-white rounded-lg text-sm font-medium hover:bg-[#d04e1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="relative z-10 text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/business/register" className="text-[#E85D2A] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
