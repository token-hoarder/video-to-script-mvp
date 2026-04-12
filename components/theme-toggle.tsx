"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="p-2 text-on-surface-variant hover:text-primary transition-all active:scale-95 flex items-center justify-center rounded-full hover:bg-surface-container"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined text-[20px]">
          dark_mode
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 text-on-surface-variant hover:text-primary transition-all active:scale-95 flex items-center justify-center rounded-full hover:bg-surface-container"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-[20px]">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
