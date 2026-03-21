"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isCapacitor, getAuthBaseUrl } from "@/lib/capacitor";
import { App } from "@capacitor/app";

export function SignInModal({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const { status } = useSession();

    // Safety net: if the session updates (e.g. via useSession polling after
    // OAuth completes), close the modal and navigate — even if browserFinished
    // didn't fire or the handler didn't navigate.
    useEffect(() => {
        if (status === "authenticated") {
            console.log("[Savrd] SignInModal: session authenticated, closing modal");
            onClose();
            router.replace("/");
        }
    }, [status, onClose, router]);

    async function handleGoogleSignIn() {
        if (!isCapacitor()) {
            signIn("google");
            return;
        }

        const { Browser } = await import("@capacitor/browser");
        const base = getAuthBaseUrl();

        const handleOAuthComplete = async () => {
            try {
                // Retrieve the one-time token and have the server set the session cookie
                const tokenRes = await fetch("/api/mobile-token");
                console.log("[Savrd] mobile-token status:", tokenRes.status);
            } catch (err) {
                console.log("[Savrd] token fetch error:", err);
            }
            // Verify session then navigate
            try {
                const sessionRes = await fetch("/api/auth/session");
                const sessionData = await sessionRes.json() as { user?: unknown };
                console.log("[Savrd] session after sign-in:", sessionData.user ? "authenticated" : "none");
                if (sessionData.user) {
                    console.log("[Savrd] SignInModal: navigating to /");
                    onClose();
                    window.location.href = "/";
                    return;
                }
            } catch (err) {
                console.log("[Savrd] session check error:", err);
            }
            console.log("[Savrd] SignInModal: reloading as fallback");
            window.location.reload();
        };

        let handled = false;

        const browserListener = await Browser.addListener("browserFinished", async () => {
            browserListener.remove();
            if (handled) return;
            handled = true;
            console.log("[Savrd] SignInModal: browserFinished fired");
            await handleOAuthComplete();
        });

        const appListener = await App.addListener("appUrlOpen", async (data) => {
            if (data.url.includes("auth-done")) {
                appListener.remove();
                if (handled) return;
                handled = true;
                console.log("[Savrd] SignInModal: appUrlOpen fired, auto-closing browser");
                await Browser.close();
                await handleOAuthComplete();
            }
        });

        await Browser.open({
            url: `${base}/auth/google-redirect`,
        });
    }

    async function handleAppleSignIn() {
        if (!isCapacitor()) {
            signIn("apple");
            return;
        }

        const { Browser } = await import("@capacitor/browser");
        const base = getAuthBaseUrl();

        const handleOAuthComplete = async () => {
            try {
                const tokenRes = await fetch("/api/mobile-token");
                console.log("[Savrd] Apple mobile-token status:", tokenRes.status);
            } catch (err) {
                console.log("[Savrd] Apple token fetch error:", err);
            }
            try {
                const sessionRes = await fetch("/api/auth/session");
                const sessionData = await sessionRes.json() as { user?: unknown };
                if (sessionData.user) {
                    console.log("[Savrd] SignInModal: navigating to /");
                    onClose();
                    window.location.href = "/";
                    return;
                }
            } catch (err) {
                console.log("[Savrd] session check error:", err);
            }
            console.log("[Savrd] SignInModal: reloading as fallback");
            window.location.reload();
        };

        let handled = false;

        const browserListener = await Browser.addListener("browserFinished", async () => {
            browserListener.remove();
            if (handled) return;
            handled = true;
            console.log("[Savrd] SignInModal Apple: browserFinished fired");
            await handleOAuthComplete();
        });

        const appListener = await App.addListener("appUrlOpen", async (data) => {
            if (data.url.includes("auth-done")) {
                appListener.remove();
                if (handled) return;
                handled = true;
                console.log("[Savrd] SignInModal Apple: appUrlOpen fired, auto-closing browser");
                await Browser.close();
                await handleOAuthComplete();
            }
        });

        await Browser.open({
            url: `${base}/auth/apple-redirect`,
        });
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-lg bg-white/[0.65] dark:bg-white/[0.05] rounded-t-2xl px-6 pt-4 pb-12 shadow-2xl border border-black/[0.08] dark:border-white/[0.15]"
                style={{
                    backdropFilter: "blur(64px) saturate(180%)",
                    WebkitBackdropFilter: "blur(64px) saturate(180%)",
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 20, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-6" />
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-[#E85D2A]/15 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="#E85D2A" stroke="#E85D2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#0E1116] dark:text-[#e8edf4]">
                            Sign in to save your favorite places
                        </h2>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs mx-auto">
                            Create boards, track your spots, and share vibes with friends.
                        </p>
                    </div>
                    <button
                        onClick={handleGoogleSignIn}
                        className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-white dark:bg-[#1C2128] border-2 border-gray-200 dark:border-white/10 font-semibold text-sm text-[#0E1116] dark:text-[#e8edf4] hover:bg-gray-50 dark:hover:bg-[#2d2d44] transition-colors cursor-pointer shadow-sm"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </button>

                    <button
                        onClick={handleAppleSignIn}
                        className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 rounded-2xl bg-black dark:bg-black border-2 border-black dark:border-white/10 font-semibold text-sm text-white hover:bg-black/90 dark:hover:bg-black/80 transition-colors cursor-pointer shadow-sm"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.947 1.156-1.674 1.633-3.267 1.643-3.35-.022-.01-3.13-1.21-3.151-4.787-.018-2.986 2.45-4.437 2.569-4.509-1.39-2.036-3.553-2.316-4.331-2.355-2.031-.194-4.223 1.06-5.12 1.06H12.152zm-1.874-5.344c.834-1.012 2.112-1.748 3.32-1.896.166 1.365-.465 2.768-1.332 3.821-.77.941-2.19 1.672-3.328 1.492-.186-1.284.44-2.44 1.34-3.417z"/>
                        </svg>
                        Sign in with Apple
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
