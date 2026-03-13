import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/layout/AppShell";
import Providers from "@/components/Providers";
import { ToastProvider } from "@/components/Toast";
import ThemeProvider from "@/components/ThemeProvider";
import { BadgeProvider } from "@/components/providers/BadgeProvider";
import { NeighborhoodRevealProvider } from "@/components/providers/NeighborhoodRevealProvider";
import { VibeVotingProvider } from "@/components/providers/VibeVotingProvider";
import WelcomeBackNudge from "@/components/nudges/WelcomeBackNudge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Savrd - Discover Cafés & Restaurants",
  description: "Swipe-based café and restaurant discovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('savrd_prefs')||'{}');var t=p.theme||'system';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ThemeProvider>
            <ToastProvider>
              <NeighborhoodRevealProvider>
                <BadgeProvider>
                  <VibeVotingProvider>
                    <AppShell>
                      {children}
                    </AppShell>
                    <BottomNav />
                    <WelcomeBackNudge />
                  </VibeVotingProvider>
                </BadgeProvider>
              </NeighborhoodRevealProvider>
            </ToastProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
