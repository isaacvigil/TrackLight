import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedClerkProvider } from "@/components/themed-clerk-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Logo } from "@/components/logo";
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
            <header className="border-b">
              <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Logo />
                <div className="flex items-center gap-4">
                  <ThemeSwitcher />
                  <SignedOut>
                    <SignInButton mode="modal" />
                    <SignUpButton mode="modal" />
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </div>
              </div>
            </header>
            {children}
          </ThemedClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
