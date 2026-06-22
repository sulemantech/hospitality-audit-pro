"use client";

import { createContext, useContext } from "react";
import type { Property } from "@/types";

export const ALL_PROPERTY: Property = {
  id: "all",
  name: "All Properties",
  type: "hotel",
  location: "",
  total_rooms: 0,
  created_at: "",
};

const Ctx = createContext<Property[]>([]);

export function PropertyProvider({
  children,
  properties,
}: {
  children: React.ReactNode;
  properties: Property[];
}) {
  return <Ctx.Provider value={properties}>{children}</Ctx.Provider>;
}

export function useProperties() {
  return useContext(Ctx);
}
