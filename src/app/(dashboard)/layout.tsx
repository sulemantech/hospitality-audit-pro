import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PropertyProvider } from "@/components/layout/PropertyContext";
import { NotificationsProvider } from "@/components/layout/NotificationsContext";
import { getProperties } from "@/lib/supabase/queries/complaints";
import { getRecentNotifications } from "@/lib/supabase/queries/notifications";
import { createClient } from "@/lib/supabase/server";
import type { AppUser, UserRole } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const [properties, { data: { user } }, notifications] = await Promise.all([
    getProperties(),
    supabase.auth.getUser(),
    getRecentNotifications(),
  ]);

  // Map the raw Supabase auth user to our AppUser shape.
  // user_metadata fields are set when creating the user in Supabase Auth dashboard
  // or via the admin API (full_name, role, avatar_url).
  const currentUser: AppUser | null = user
    ? {
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
        role: (user.user_metadata?.role as UserRole) ?? "viewer",
        avatar_url: user.user_metadata?.avatar_url ?? null,
        created_at: user.created_at,
      }
    : null;

  return (
    <PropertyProvider properties={properties}>
      <NotificationsProvider notifications={notifications}>
        <div className="flex h-screen overflow-hidden bg-background">
          <Suspense fallback={<div className="w-[72px] shrink-0" style={{ background: "#7C3AED" }} />}>
            <Sidebar user={currentUser} />
          </Suspense>
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </NotificationsProvider>
    </PropertyProvider>
  );
}
