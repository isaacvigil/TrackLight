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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased font-sans min-h-screen flex flex-col`}
        style={{ 
          background: 'linear-gradient(135deg, rgba(10, 10, 10, 1) 0%, rgba(0, 24, 41, 1) 100%)',
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemedClerkProvider>
            <Header variant="transparent">
              <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Logo />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" asChild>
                    <a href="/pricing">Pricing</a>
                  </Button>
                  <Button variant="ghost" asChild>
                    <a href="mailto:contact@tracklight.app">Contact</a>
                  </Button>
                  <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl="/track">
                      <Button variant="ghost">Sign In</Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </div>
              </div>
            </Header>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
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
