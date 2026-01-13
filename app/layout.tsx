import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedClerkProvider } from "@/components/themed-clerk-provider";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { PostHogIdentify } from "@/components/posthog-identify";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrackLight",
  description: "Effortless job application tracking",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "TrackLight",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body
        className={`${inter.variable} antialiased font-sans min-h-screen flex flex-col overflow-x-hidden`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-background focus:p-4 focus:border focus:border-ring"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemedClerkProvider>
            <PostHogIdentify />
            <Header variant="transparent">
              <div className="w-full max-w-full">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                  <Logo />
                  <nav aria-label="Main navigation">
                    <ul className="flex items-center gap-2 list-none m-0 p-0">
                      <li className="flex items-center">
                        <Button variant="ghost" asChild>
                          <a href="/pricing">Pricing</a>
                        </Button>
                      </li>
                      <li className="flex items-center">
                        <Button variant="ghost" asChild>
                          <a href="mailto:contact@tracklight.app">Contact</a>
                        </Button>
                      </li>
                      <li className="flex items-center h-10">
                        <SignedOut>
                          <SignInButton mode="modal" forceRedirectUrl="/track">
                            <Button variant="ghost">Sign In</Button>
                          </SignInButton>
                        </SignedOut>
                        <SignedIn>
                          <UserButton />
                        </SignedIn>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </Header>
            <main id="main-content" className="flex-1 flex flex-col">
              {children}
            </main>
            <footer className="py-6">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                TrackLight © {new Date().getFullYear()}
              </div>
            </footer>
            <Toaster position="top-right" />
          </ThemedClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
