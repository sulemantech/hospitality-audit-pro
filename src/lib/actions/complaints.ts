"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { pushComplaintAlert } from "@/lib/notifications/push";
import { sendComplaintEmail } from "@/lib/notifications/email";

export interface ComplaintInput {
  property_id: string;
  room_number?: string | null;
  guest_name?: string | null;
  category: string;
  severity: string;
  source: string;
  description: string;
  reported_by: string;
  assigned_to?: string | null;
}

export async function logComplaint(
  data: ComplaintInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("complaints").insert({
    ...data,
    room_number: data.room_number || null,
    guest_name: data.guest_name || null,
    assigned_to: data.assigned_to || null,
  });

  if (error) return { success: false, error: error.message };

  // Send notifications for critical and high severity only
  if (data.severity === "critical" || data.severity === "high") {
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", data.property_id)
      .single();

    const propertyName = property?.name ?? "Unknown Property";

    // Fire both in parallel, never block on failure
    await Promise.allSettled([
      pushComplaintAlert({
        severity: data.severity,
        category: data.category,
        propertyName,
        roomNumber: data.room_number,
        description: data.description,
        reportedBy: data.reported_by,
      }),
      sendComplaintEmail({
        severity: data.severity,
        category: data.category,
        propertyName,
        roomNumber: data.room_number,
        description: data.description,
        reportedBy: data.reported_by,
        assignedTo: data.assigned_to,
      }),
    ]);
  }

  return { success: true };
}
