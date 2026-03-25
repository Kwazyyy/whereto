"use client";

import { useRouter } from "next/navigation";

export default function ProPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0E1116] flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#E85D2A]/10 border border-[#E85D2A]/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#E85D2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Savrd Pro</h1>
        <p className="text-[#E85D2A] font-semibold text-sm uppercase tracking-wider mb-4">Coming Soon</p>
        <p className="text-gray-400 text-base leading-relaxed">
          We&apos;re working on something special. Stay tuned.
        </p>

        <button
          onClick={() => router.back()}
          className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
