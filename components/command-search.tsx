"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import {
  Search,
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  HeartHandshake,
  Users,
  Settings,
  Globe,
  LogIn,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Input
    ref={ref}
    className={cn(
      "flex h-12 w-full border-none bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground border-b border-border mb-2",
      className
    )}
    {...props}
  />
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[350px] overflow-y-auto overflow-x-hidden pb-2 px-1", className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="flex h-12 items-center justify-center text-sm text-muted-foreground"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&:not(:first-child)]:mt-2",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex h-10 cursor-pointer select-none items-center gap-2.5 rounded-md px-3 text-sm text-foreground outline-none transition-colors data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&+[cmdk-item]]:mt-1",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

interface SearchItem {
  title: string
  url: string
  group: string
  icon?: LucideIcon
}

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter()
  const commandRef = React.useRef<HTMLDivElement>(null)

  const searchItems: SearchItem[] = [
    // Main Pages
    { title: "Dashboard", url: "/dashboard", group: "Pages", icon: LayoutDashboard },
    { title: "Card Inventory", url: "/inventory", group: "Pages", icon: CreditCard },
    { title: "Add Gift Cards", url: "/cards", group: "Pages", icon: PlusCircle },
    { title: "System Logs", url: "/donations", group: "Pages", icon: HeartHandshake },
    { title: "User Management", url: "/admin/users", group: "Pages", icon: Users },
    { title: "Account Settings", url: "/settings", group: "Pages", icon: Settings },

    // Quick Actions
    { title: "Add New Gift Card", url: "/cards", group: "Quick Actions", icon: PlusCircle },
    { title: "Search Gift Cards", url: "/inventory", group: "Quick Actions", icon: Search },
    { title: "View System Logs", url: "/donations", group: "Quick Actions", icon: HeartHandshake },
    { title: "Manage User Roles", url: "/admin/users", group: "Quick Actions", icon: Users },
    { title: "Update Profile & Password", url: "/settings", group: "Quick Actions", icon: Settings },

    // Public / Auth
    { title: "Landing Page", url: "/landing-page", group: "Public", icon: Globe },
    { title: "Sign In", url: "/login", group: "Public", icon: LogIn },
    { title: "Sign Up", url: "/signup", group: "Public", icon: UserPlus },
  ]

  const groupedItems = searchItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = []
    }
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, SearchItem[]>)

  const handleSelect = (url: string) => {
    router.push(url)
    onOpenChange(false)
    if (commandRef.current) {
      commandRef.current.style.transform = 'scale(0.98)'
      setTimeout(() => {
        if (commandRef.current) {
          commandRef.current.style.transform = ''
        }
      }, 100)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border border-border max-w-[560px] top-[30%]">
        <DialogTitle className="sr-only">Quick Search</DialogTitle>
        <Command
          ref={commandRef}
          className="transition-transform duration-100 ease-out"
        >
          <CommandInput placeholder="Search any page, inventory, settings..." autoFocus />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupedItems).map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.url + item.title}
                      value={item.title}
                      onSelect={() => handleSelect(item.url)}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                      <span>{item.title}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1 relative w-full justify-start text-muted-foreground sm:pr-12 md:w-48 lg:w-64 cursor-pointer"
    >
      <Search className="mr-1.5 h-3.5 w-3.5" />
      <span className="hidden lg:inline-flex text-xs">Search...</span>
      <span className="inline-flex lg:hidden text-xs">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
