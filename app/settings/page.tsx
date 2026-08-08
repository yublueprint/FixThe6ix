"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import UserGeneral from '@/components/shadcn-studio/blocks/account-settings-01/account-settings-01';
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";



export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, []);

  const { data, isLoading } = useSWR(user ? `/api/users/${user.id}` : null, fetcher);
  const role = data?.user?.role || "VOLUNTEER";
  const roleRequest = data?.user?.roleRequest || false;
  const loading = !user || isLoading;

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
                  {loading ? (
                    <div className="flex w-full max-w-lg flex-col gap-7 pt-4">
                      <div className="flex flex-col gap-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="flex flex-col gap-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <Skeleton className="h-10 w-32" />
                    </div>
                  ) : (
                    <UserGeneral user={user} role={role} roleRequest={roleRequest} onRefresh={() => window.location.reload()} />
                  )}
                </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
