"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface ModeToggleProps {
  variant?: "outline" | "ghost" | "default"
  className?: string
}

export function ModeToggle({ variant = "outline", className }: ModeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size="icon"
        className="size-8 cursor-pointer relative overflow-hidden rounded-md border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
      >
        <Moon className="size-4 rotate-0 scale-100 text-muted-foreground" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDarkMode = resolvedTheme === "dark"

  const handleToggle = () => {
    setTheme(isDarkMode ? "light" : "dark")
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      className="size-8 cursor-pointer relative overflow-hidden rounded-md border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
    >
      {isDarkMode ? (
        <Sun className="size-4 transition-transform duration-300 rotate-0 scale-100 text-foreground" />
      ) : (
        <Moon className="size-4 transition-transform duration-300 rotate-0 scale-100 text-foreground" />
      )}
      <span className="sr-only">
        Switch to {isDarkMode ? "light" : "dark"} mode
      </span>
    </Button>
  )
}
