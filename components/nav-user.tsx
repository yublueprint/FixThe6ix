"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"


export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {


  const initials = user.name
    ? user.name.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
            <Avatar className="size-8 grayscale">
              <AvatarImage src={user.avatar} alt={user.name || user.email} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name || user.email}</span>
              {user.name && (
                <span className="text-foreground/70 truncate text-xs">
                  {user.email}
                </span>
              )}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
