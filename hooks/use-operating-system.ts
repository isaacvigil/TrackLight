"use client"

import { useEffect, useState } from "react"

export type OperatingSystem = 'windows' | 'mac' | 'linux' | 'unknown'

/**
 * Hook to detect the user's operating system
 * @returns The detected operating system: 'windows', 'mac', 'linux', or 'unknown'
 */
export function useOperatingSystem(): OperatingSystem {
  const [os, setOs] = useState<OperatingSystem>('unknown')

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const platform = window.navigator.platform.toLowerCase()

    if (platform.includes('mac') || userAgent.includes('mac')) {
      setOs('mac')
    } else if (platform.includes('win') || userAgent.includes('win')) {
      setOs('windows')
    } else if (platform.includes('linux') || userAgent.includes('linux')) {
      setOs('linux')
    } else {
      setOs('unknown')
    }
  }, [])

  return os
}

/**
 * Hook to get the modifier key label based on operating system
 * @returns '⌘' for Mac, 'Ctrl' for Windows/Linux/Unknown
 */
export function useModifierKey(): string {
  const os = useOperatingSystem()
  return os === 'mac' ? '⌘' : 'Ctrl'
}

/**
 * Hook to get the Enter key label based on operating system
 * @returns 'Return' for Mac, 'Enter' for Windows/Linux/Unknown
 */
export function useEnterKey(): string {
  const os = useOperatingSystem()
  return os === 'mac' ? 'Return' : 'Enter'
}
