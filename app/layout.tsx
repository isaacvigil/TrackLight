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
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrackLight",
  description: "Task tracking made simple",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemedClerkProvider>
            <Header variant="glass">
              <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Logo />
                <div className="flex items-center gap-4">
                  <Button variant="ghost" asChild>
                    <a href="#pricing">Pricing</a>
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
            {children}
            <footer className="border-t py-6 mt-auto">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                TrackLight © {new Date().getFullYear()}
              </div>
            </footer>
          </ThemedClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
