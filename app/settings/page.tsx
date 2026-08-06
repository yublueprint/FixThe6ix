"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import UserGeneral from '@/components/shadcn-studio/blocks/account-settings-01/account-settings-01';
import { createClient } from "@/lib/supabase/client";



export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState("VOLUNTEER");
  const [roleRequest, setRoleRequest] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetch(`/api/users/${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data?.user) {
              setRole(data.user.role);
              setRoleRequest(data.user.roleRequest);
            }
          })
          .catch(console.error);
      }
    }
    loadUser();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold">Account Settings</h1>
        </header>

        <main className="flex-1 bg-background">
          <div className='w-full py-8'>
            <div className='mx-auto min-h-screen max-w-7xl px-4 sm:px-6 lg:px-8'>
                <div className='mt-4'>
                  <UserGeneral user={user} role={role} roleRequest={roleRequest} onRefresh={() => window.location.reload()} />
                </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
