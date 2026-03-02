import Link from "next/link";

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="text-[#E85D2A]">WhereTo</span> for Business
        </h1>
        <p className="text-gray-400 mt-4 mb-8">Coming soon</p>
        <Link
          href="/business/login"
          className="inline-block px-6 py-2.5 bg-[#E85D2A] text-white rounded-lg text-sm font-medium hover:bg-[#d04e1f] transition-colors"
        >
          Business Sign In
        </Link>
      </div>
    </div>
  );
}
