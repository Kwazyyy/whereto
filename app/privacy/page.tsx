import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Savrd",
    description: "Savrd Privacy Policy — how we collect, use, and protect your data.",
};

function ArrowLeftIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <div
            className="min-h-screen bg-[#0E1116] text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
                {/* Back link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-12"
                >
                    <ArrowLeftIcon />
                    Back to Savrd
                </Link>

                {/* Header */}
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
                    Privacy Policy
                </h1>
                <p className="text-zinc-500 text-sm mb-12">Last updated: March 2026</p>

                {/* Content */}
                <div className="space-y-10 text-[15px] leading-relaxed text-zinc-300">
                    {/* 1 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
                        <p className="mb-3">We collect the following types of information when you use Savrd:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong className="text-white">Account Information:</strong> Your name
                                and email address, provided through Google OAuth sign-in or email
                                registration.
                            </li>
                            <li>
                                <strong className="text-white">Location Data:</strong> GPS coordinates
                                used for nearby place discovery and visit verification. Location is only
                                accessed when you explicitly grant browser permission.
                            </li>
                            <li>
                                <strong className="text-white">Usage Data:</strong> Saved places, visits,
                                swipe interactions, vibe votes, friend connections, curated lists, and
                                activity on the platform.
                            </li>
                            <li>
                                <strong className="text-white">Photos:</strong> Community photos you
                                upload, which are stored via our cloud hosting provider.
                            </li>
                            <li>
                                <strong className="text-white">Device Information:</strong> Browser type,
                                screen size, and operating system — collected automatically for
                                performance and compatibility.
                            </li>
                        </ul>
                    </section>

                    {/* 2 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Providing personalized place recommendations based on your preferences and location.</li>
                            <li>Powering social features including friend matching, taste compatibility scores, recommendations, and the activity feed.</li>
                            <li>Visit verification for gamification features such as badges, streaks, and neighborhood exploration tracking.</li>
                            <li>Improving our recommendation algorithms and overall user experience.</li>
                            <li>Displaying community-submitted photos on place detail pages.</li>
                        </ul>
                    </section>

                    {/* 3 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Third-Party Services</h2>
                        <p className="mb-3">Savrd relies on the following third-party services to operate:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong className="text-white">Google Places API &amp; Google Maps API</strong> —
                                Place data, photos, and map rendering.{" "}
                                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                                    Google Privacy Policy
                                </a>
                            </li>
                            <li>
                                <strong className="text-white">Google OAuth</strong> — Authentication
                                and sign-in.{" "}
                                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                                    Google Privacy Policy
                                </a>
                            </li>
                            <li>
                                <strong className="text-white">Cloudinary</strong> — Community photo
                                storage and delivery.{" "}
                                <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                                    Cloudinary Privacy Policy
                                </a>
                            </li>
                            <li>
                                <strong className="text-white">Vercel</strong> — Application hosting and
                                deployment.{" "}
                                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                                    Vercel Privacy Policy
                                </a>
                            </li>
                            <li>
                                <strong className="text-white">Neon (PostgreSQL)</strong> — Database
                                hosting.{" "}
                                <a href="https://neon.tech/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                                    Neon Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </section>

                    {/* 4 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Data Sharing</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>We do not sell your personal data to third parties.</li>
                            <li>Friend features share limited information (name, avatar, and saved places) only with users you have accepted as friends.</li>
                            <li>Community photos are visible to all Savrd users once approved by our moderation team.</li>
                            <li>Business analytics features use only anonymized, aggregated data — individual user activity is never shared with business accounts.</li>
                        </ul>
                    </section>

                    {/* 5 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Data Retention &amp; Deletion</h2>
                        <p>
                            We retain your data for as long as your account is active. You can request
                            deletion of your account and all associated data — including saves, visits,
                            photos, and personal information — by contacting us at{" "}
                            <a href="mailto:support@savrd.ca" className="text-orange-500 hover:underline">
                                support@savrd.ca
                            </a>
                            . Account deletion is permanent and cannot be undone.
                        </p>
                    </section>

                    {/* 6 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">6. Location Data</h2>
                        <p>
                            Savrd only accesses your location when you explicitly grant permission
                            through your browser. Location data is used for two purposes: discovering
                            nearby places and verifying visits (within a 200-metre proximity threshold).
                            Your precise location is not stored persistently on our servers and is never
                            shared with other users.
                        </p>
                    </section>

                    {/* 7 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">7. Children&apos;s Privacy</h2>
                        <p>
                            Savrd is not intended for users under the age of 13. We do not knowingly
                            collect personal information from children under 13. If we become aware that
                            we have collected data from a child under 13, we will take steps to delete
                            that information promptly.
                        </p>
                    </section>

                    {/* 8 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">8. Your Rights</h2>
                        <p className="mb-3">You have the right to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Access the personal data we hold about you.</li>
                            <li>Request correction of inaccurate data.</li>
                            <li>Request deletion of your account and personal data.</li>
                            <li>Opt out of location tracking at any time by revoking location permissions in your browser settings.</li>
                        </ul>
                        <p className="mt-3">
                            To exercise any of these rights, contact us at{" "}
                            <a href="mailto:privacy@savrd.ca" className="text-orange-500 hover:underline">
                                privacy@savrd.ca
                            </a>
                            .
                        </p>
                    </section>

                    {/* 9 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">9. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. When we make significant
                            changes, we will notify users through the app or via email. Continued use of
                            Savrd after changes constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    {/* 10 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">10. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at{" "}
                            <a href="mailto:privacy@savrd.ca" className="text-orange-500 hover:underline">
                                privacy@savrd.ca
                            </a>
                            .
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 mt-16 pt-8">
                    <p className="text-sm text-zinc-600">
                        &copy; {new Date().getFullYear()} Savrd. Made with love in Toronto.
                    </p>
                </div>
            </div>
        </div>
    );
}
