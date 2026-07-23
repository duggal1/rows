"use client"

import { useTheme } from "@/lib/theme-context"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme}
      onThemeChange={(t) => setTheme(t)}
      className="fixed right-5 top-5 z-50 flex items-center justify-center"
    />
  )
}
