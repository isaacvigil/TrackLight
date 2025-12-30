"use client"

import * as React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"

export function ThemedClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR or before mounting, use default theme to avoid hydration mismatch
  const appearance = mounted && resolvedTheme === "dark"
    ? {
        baseTheme: dark,
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorBackground: "hsl(var(--background))",
          colorInputBackground: "hsl(var(--input))",
          colorInputText: "hsl(var(--foreground))",
          colorText: "hsl(var(--foreground))",
          fontFamily: "var(--font-inter)",
          borderRadius: "0.5rem",
          fontSize: "16px",
        },
        elements: {
          userButtonPopoverActionButton: {
            fontSize: "16px",
          },
          userButtonPopoverActionButtonIcon: {
            width: "20px",
            height: "20px",
          },
          userPreviewSecondaryIdentifier: {
            fontSize: "16px",
          },
          userPreviewMainIdentifier: {
            fontSize: "16px",
          },
        },
      }
    : {
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorBackground: "hsl(var(--background))",
          colorInputBackground: "hsl(var(--input))",
          colorInputText: "hsl(var(--foreground))",
          colorText: "hsl(var(--foreground))",
          fontFamily: "var(--font-inter)",
          borderRadius: "0.5rem",
          fontSize: "16px",
        },
        elements: {
          userButtonPopoverActionButton: {
            fontSize: "16px",
          },
          userButtonPopoverActionButtonIcon: {
            width: "20px",
            height: "20px",
          },
          userPreviewSecondaryIdentifier: {
            fontSize: "16px",
          },
          userPreviewMainIdentifier: {
            fontSize: "16px",
          },
        },
      }

  return (
    <ClerkProvider appearance={appearance}>
      {children}
    </ClerkProvider>
  )
}

