import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { getProperties } from "@/lib/supabase/queries/complaints";
import type { AppUser } from "@/types";

const MOCK_USER: AppUser = {
  id: "u1",
  email: "christos@beegroup.cy",
  full_name: "Christos Papadopoulos",
  role: "admin",
  created_at: new Date().toISOString(),
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const properties = await getProperties();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Suspense fallback={<div className="w-[220px] border-r border-border bg-card" />}>
        <Sidebar user={MOCK_USER} properties={properties} />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
