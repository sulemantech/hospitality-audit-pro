"use server";

import { createAdminClient } from "@/lib/supabase/server";

export interface PropertyUpdate {
  name: string;
  type: "hotel" | "hostel";
  location: string;
  total_rooms: number;
}

export async function updateProperty(
  id: string,
  data: PropertyUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("properties")
    .update({
      name: data.name.trim(),
      type: data.type,
      location: data.location.trim(),
      total_rooms: Number(data.total_rooms),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
