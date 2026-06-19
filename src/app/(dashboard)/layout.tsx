"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AppUser } from "@/types";

// Mock user until auth is wired up
const MOCK_USER: AppUser = {
  id: "u1",
  email: "christos@beegroup.cy",
  full_name: "Christos Papadopoulos",
  role: "admin",
  created_at: new Date().toISOString(),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={MOCK_USER}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
