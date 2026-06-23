"use client";

import { createContext, useContext } from "react";
import type { AppNotification } from "@/lib/supabase/queries/notifications";

const Ctx = createContext<AppNotification[]>([]);

export function NotificationsProvider({
  children,
  notifications,
}: {
  children: React.ReactNode;
  notifications: AppNotification[];
}) {
  return <Ctx.Provider value={notifications}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  return useContext(Ctx);
}
