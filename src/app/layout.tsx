import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RouteAnnouncer } from "@/components/RouteAnnouncer";
import { ToastProvider } from "@/components/ToastProvider";
import { ApiAuthGuard } from "@/components/ApiAuthGuard";
import { AppShellExtras } from "@/components/AppShellExtras";
import { ConnectionBanner } from "@/components/ConnectionBanner";

export const metadata: Metadata = {
  title: {
    default: "StableRoute",
    template: "%s — StableRoute",
  },
  description: "Stablecoin liquidity routing on Stellar",
  applicationName: "StableRoute",
  openGraph: {
    title: "StableRoute",
    description: "Liquidity routing for stablecoin and fiat-backed tokens on Stellar.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "StableRoute",
    description: "Liquidity routing for stablecoin and fiat-backed tokens on Stellar.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-full focus-visible:bg-black focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)]"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <RouteAnnouncer />
          <ApiAuthGuard />
          <AppShellExtras />
          <ConnectionBanner />
          <Header />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
