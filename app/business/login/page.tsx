"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/for-business" className="inline-block">
            <span className="text-2xl font-bold text-[#E85D2A]">WhereTo</span>
            <span className="text-lg text-gray-400 font-medium ml-2">for Business</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            Sign in to manage your business
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#161B22] border border-white/10 rounded-xl p-6 space-y-4">
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
              className="w-full px-3 py-2.5 bg-[#0E1116] border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A] transition-colors"
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
              className="w-full px-3 py-2.5 bg-[#0E1116] border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#E85D2A] focus:ring-1 focus:ring-[#E85D2A] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#E85D2A] text-white rounded-lg text-sm font-medium hover:bg-[#d04e1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/business/register" className="text-[#E85D2A] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
