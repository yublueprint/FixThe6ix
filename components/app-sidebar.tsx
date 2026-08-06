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
  GiveBloodIcon,
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
      title: "Donations Given",
      url: "/donations",
      icon: <HugeiconsIcon icon={GiveBloodIcon} strokeWidth={2} />,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>("VOLUNTEER")
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        // Fetch full role from our DB
        fetch(`/api/users/${authUser.id}`)
          .then(res => res.json())
          .then(data => {
            if (data?.user) setRole(data.user.role)
          })
          .catch(console.error)
        
        setUser({
          ...authUser,
          name: authUser.user_metadata?.full_name || "",
          email: authUser.email || "",
          avatar: authUser.user_metadata?.avatar_url || "",
        })
      }
    }
    loadUser()
  }, [])

  const adminNav = (role === "ADMIN" || role === "SUPER_ADMIN") ? [{
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
