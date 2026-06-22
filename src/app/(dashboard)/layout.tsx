import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PropertyProvider } from "@/components/layout/PropertyContext";
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
    <PropertyProvider properties={properties}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Suspense fallback={<div className="w-[72px] shrink-0" style={{ background: "#7C3AED" }} />}>
          <Sidebar user={MOCK_USER} />
        </Suspense>
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </PropertyProvider>
  );
}
