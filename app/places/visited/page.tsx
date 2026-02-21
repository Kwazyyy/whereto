export default function VisitedPage() {
    return (
        <div className="min-h-dvh bg-white dark:bg-[#0f0f1a] flex flex-col items-center justify-center p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="m9 11 3 3L22 4" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-[#e8edf4] mb-2">Places You&apos;ve Been</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                Keep track of all the cafes and restaurants you&apos;ve visited around the city.
            </p>

            <a
                href="/profile"
                className="px-6 py-3 rounded-full bg-gray-100 dark:bg-[#1a1a2e] text-[#1B2A4A] dark:text-[#e8edf4] font-medium hover:bg-gray-200 dark:hover:bg-[#22223b] transition-colors"
            >
                Back to Profile
            </a>
        </div>
    );
}
