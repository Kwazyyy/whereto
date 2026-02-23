export default function RecsPage() {
    return (
        <div className="min-h-dvh bg-white dark:bg-[#0E1116] flex flex-col items-center justify-center p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0E1116] dark:text-[#e8edf4] mb-2">Recs for You</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                Personalized recommendations based on your saved places.
            </p>

            <a
                href="/profile"
                className="px-6 py-3 rounded-full bg-gray-100 dark:bg-[#161B22] text-[#0E1116] dark:text-[#e8edf4] font-medium hover:bg-gray-200 dark:hover:bg-[#1C2128] transition-colors"
            >
                Back to Profile
            </a>
        </div>
    );
}
