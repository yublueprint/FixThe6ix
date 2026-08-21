"use client"

import * as React from "react"
import { useEffect, useState } from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { createClient } from "@/lib/supabase/client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  CommandIcon,
  DashboardSquare01Icon,
  Archive01Icon,
  Task01Icon,
  Settings05Icon,
  File01Icon,
  UserMultipleIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
    },
    {
      title: "Add Gift Card",
      url: "/cards",
      icon: <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} />,
    },
    {
      title: "System Logs",
      url: "/donations",
      icon: <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />,
    },
  ],
  navSecondary: [
    {
      title: "Export Data",
      url: "#export",
      icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} />,
    },
    {
      title: "Account Settings",
      url: "/settings",
      icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    },
    {
      title: "Log out",
      url: "#logout",
      icon: <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />,
    },
  ],
}

// In-memory module cache for client-side transitions (persists across route changes without causing SSR hydration mismatches)
let cachedRole: string | null = null
let cachedUser: any = null

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<any>(cachedUser)
  const [role, setRole] = useState<string>(cachedRole || "VOLUNTEER")
  const supabase = createClient()

  useEffect(() => {
    // Read from localStorage on mount after initial hydration
    try {
      const storedRole = localStorage.getItem("userRole")
      if (storedRole && storedRole !== role) {
        cachedRole = storedRole
        setRole(storedRole)
      }
      const storedUser = localStorage.getItem("userData")
      if (storedUser && !user) {
        const parsed = JSON.parse(storedUser)
        cachedUser = parsed
        setUser(parsed)
      }
    } catch {
      // Ignore localStorage errors
    }

    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const userData = {
            ...authUser,
            name: authUser.user_metadata?.full_name || "",
            email: authUser.email || "",
            avatar: authUser.user_metadata?.avatar_url || "",
          }
          cachedUser = userData
          setUser(userData)
          try {
            localStorage.setItem("userData", JSON.stringify(userData))
          } catch {}

          // Fetch full role from our DB
          const res = await fetch(`/api/users/${authUser.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data?.user?.role) {
              cachedRole = data.user.role
              setRole(data.user.role)
              try {
                localStorage.setItem("userRole", data.user.role)
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error("Error loading sidebar user:", err)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        cachedRole = null
        cachedUser = null
        setRole("VOLUNTEER")
        setUser(null)
        try {
          localStorage.removeItem("userRole")
          localStorage.removeItem("userData")
        } catch {}
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const adminNav = (role === "ADMIN" || role === "SUPER_ADMIN" || role === "YUBLUEPRINT") ? [{
    title: "User Management",
    url: "/admin/users",
    icon: <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />,
  }] : []

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-5!" />
              <span className="text-base font-semibold">Fix the 6ix</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[...data.navMain, ...adminNav]} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
