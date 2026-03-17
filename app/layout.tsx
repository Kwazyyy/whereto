import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
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

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Savrd - Discover Cafés & Restaurants",
  description: "Swipe-based café and restaurant discovery",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('savrd_prefs')||'{}');var t=p.theme;var native=typeof window!=='undefined'&&window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform();if(native)document.documentElement.classList.add('cap-native');if(!t){t=native?'dark':'system';}if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} antialiased`}
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
