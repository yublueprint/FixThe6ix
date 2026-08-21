"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ExportDialog } from "@/components/export-dialog"
import { createClient } from "@/lib/supabase/client"

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

  async function handleLogout() {
    try {
      localStorage.removeItem("userRole")
      localStorage.removeItem("userData")
    } catch {}
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
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
