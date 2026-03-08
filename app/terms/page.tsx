import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | Savrd",
    description: "Savrd Terms of Service — rules and guidelines for using the platform.",
};

function ArrowLeftIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    );
}

export default function TermsOfServicePage() {
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
                    Terms of Service
                </h1>
                <p className="text-zinc-500 text-sm mb-12">Last updated: March 2026</p>

                {/* Content */}
                <div className="space-y-10 text-[15px] leading-relaxed text-zinc-300">
                    {/* 1 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using Savrd, you agree to be bound by these Terms of Service
                            and our{" "}
                            <Link href="/privacy" className="text-orange-500 hover:underline">
                                Privacy Policy
                            </Link>
                            . If you do not agree to these terms, you may not use the service.
                        </p>
                    </section>

                    {/* 2 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Description of Service</h2>
                        <p>
                            Savrd is a location-based discovery platform for cafes and restaurants,
                            currently operating in Toronto, Canada. The service allows users to discover
                            places through a swipe-based interface, save favourites to boards, explore
                            neighbourhoods, connect with friends, and contribute community photos and
                            vibe votes.
                        </p>
                    </section>

                    {/* 3 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. User Accounts</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You must provide accurate information when creating an account.</li>
                            <li>You are responsible for maintaining the security of your account credentials.</li>
                            <li>One account per person. Creating multiple accounts may result in suspension.</li>
                            <li>You must be at least 13 years old to create an account.</li>
                        </ul>
                    </section>

                    {/* 4 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Acceptable Use</h2>
                        <p className="mb-3">When using Savrd, you agree not to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Create fake or misleading accounts or impersonate other users.</li>
                            <li>Harass, bully, or threaten other users through any feature of the platform.</li>
                            <li>Send spam, unsolicited recommendations, or repetitive content.</li>
                            <li>Scrape, crawl, or use automated tools to extract data from the platform.</li>
                            <li>Upload inappropriate, offensive, or illegal content including photos.</li>
                            <li>Attempt to interfere with, compromise, or disrupt the platform or its infrastructure.</li>
                            <li>Use the service for any purpose that violates applicable laws or regulations.</li>
                        </ul>
                    </section>

                    {/* 5 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Community Photos</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>By uploading photos to Savrd, you grant us a non-exclusive, worldwide, royalty-free license to display, distribute, and use those photos within the platform.</li>
                            <li>You retain ownership of your photos. You may request removal at any time.</li>
                            <li>All photos are subject to moderation. Savrd reserves the right to remove any photos that violate our community guidelines without notice.</li>
                            <li>You must only upload photos you have taken yourself or have the right to share.</li>
                        </ul>
                    </section>

                    {/* 6 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">6. Intellectual Property</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>The Savrd platform, including its design, code, branding, and features, is owned by Savrd and protected by intellectual property laws.</li>
                            <li>Place data, photos, and business information displayed on the platform are sourced from the Google Places API and are subject to Google&apos;s terms of service.</li>
                            <li>User-generated content — including curated lists, community photos, and vibe votes — remains the intellectual property of the user, but Savrd retains a license to display and distribute this content within the platform.</li>
                        </ul>
                    </section>

                    {/* 7 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">7. Disclaimers</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Place information displayed on Savrd — including hours, prices, menus, and descriptions — is sourced from third-party providers and may not always be accurate or up to date.</li>
                            <li>Savrd is not responsible for the quality, safety, or legality of any third-party venue discovered through the platform.</li>
                            <li>The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied.</li>
                        </ul>
                    </section>

                    {/* 8 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by applicable law, Savrd and its operators,
                            employees, and affiliates shall not be liable for any indirect, incidental,
                            special, consequential, or punitive damages, including but not limited to
                            loss of profits, data, or goodwill, arising from your use of or inability to
                            use the service. Our total liability for any claim arising from or related to
                            the service shall not exceed the amount you paid to Savrd, if any, in the
                            twelve (12) months preceding the claim.
                        </p>
                    </section>

                    {/* 9 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">9. Termination</h2>
                        <p>
                            Savrd reserves the right to suspend or terminate your account at any time if
                            you violate these Terms of Service, engage in fraudulent activity, or behave
                            in a manner that is harmful to other users or the platform. You may also
                            delete your account at any time by contacting{" "}
                            <a href="mailto:support@savrd.ca" className="text-orange-500 hover:underline">
                                support@savrd.ca
                            </a>
                            .
                        </p>
                    </section>

                    {/* 10 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">10. Governing Law</h2>
                        <p>
                            These Terms of Service are governed by and construed in accordance with the
                            laws of the Province of Ontario, Canada, without regard to its conflict of
                            law provisions. Any disputes arising from these terms shall be subject to the
                            exclusive jurisdiction of the courts of Ontario, Canada.
                        </p>
                    </section>

                    {/* 11 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">11. Changes to These Terms</h2>
                        <p>
                            We may update these Terms of Service from time to time. When we make
                            significant changes, we will notify users through the app or via email. Your
                            continued use of Savrd after changes are posted constitutes acceptance of the
                            updated terms.
                        </p>
                    </section>

                    {/* 12 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">12. Contact Us</h2>
                        <p>
                            If you have questions about these Terms of Service, please contact us at{" "}
                            <a href="mailto:support@savrd.ca" className="text-orange-500 hover:underline">
                                support@savrd.ca
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
