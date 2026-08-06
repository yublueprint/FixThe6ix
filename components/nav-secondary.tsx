"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ExportDialog } from "@/components/export-dialog"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Moon02Icon, Sun01Icon, LaptopProgrammingIcon } from "@hugeicons/core-free-icons"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  const router = useRouter()
  const [exportOpen, setExportOpen] = React.useState(false)
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <SidebarMenuButton
                className="flex items-center justify-between gap-2 w-full"
                render={<div />}
              >
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                     <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className="size-4" />
                  ) : theme === "light" ? (
                     <HugeiconsIcon icon={Sun01Icon} strokeWidth={2} className="size-4" />
                  ) : (
                     <HugeiconsIcon icon={LaptopProgrammingIcon} strokeWidth={2} className="size-4" />
                  )}
                  <span>Theme</span>
                </div>
                <div className="flex bg-muted rounded-full p-0.5">
                   <button onClick={(e) => { e.preventDefault(); setTheme("light") }} className={`rounded-full p-1 ${theme === "light" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                     <HugeiconsIcon icon={Sun01Icon} strokeWidth={2} className="size-3" />
                   </button>
                   <button onClick={(e) => { e.preventDefault(); setTheme("dark") }} className={`rounded-full p-1 ${theme === "dark" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                     <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className="size-3" />
                   </button>
                   <button onClick={(e) => { e.preventDefault(); setTheme("system") }} className={`rounded-full p-1 ${theme === "system" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                     <HugeiconsIcon icon={LaptopProgrammingIcon} strokeWidth={2} className="size-3" />
                   </button>
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton 
                className="flex items-center justify-between gap-2 w-full opacity-50"
                render={<div />}
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={LaptopProgrammingIcon} strokeWidth={2} className="size-4" />
                  <span>Theme</span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
          
          {items.map((item) => {
            const isActive = pathname === item.url
            if (item.url === "#export") {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setExportOpen(true)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }
            if (item.url === "#logout") {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 hover:text-red-600 hover:bg-red-50"
                  >
                    <span className="text-red-600 dark:text-red-400 [&>svg]:text-red-600 dark:[&>svg]:text-red-400">{item.icon}</span>
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={isActive}
                  render={<Link href={item.url} />}
                  className="flex items-center gap-2"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
    <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </>
  )
}
