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
): Promise<{ success: boolean; error?: string; complaint_id?: string }> {
  const supabase = createAdminClient();

  const { data: inserted, error } = await supabase
    .from("complaints")
    .insert({
      ...data,
      room_number: data.room_number || null,
      guest_name:  data.guest_name  || null,
      assigned_to: data.assigned_to || null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  const complaintId = inserted.id as string;

  // Send notifications for critical, high, and medium severity
  if (data.severity === "critical" || data.severity === "high" || data.severity === "medium") {
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", data.property_id)
      .single();

    const propertyName = property?.name ?? "Unknown Property";
    console.log(`[complaint] Firing notifications for ${data.severity} complaint at ${propertyName}`);

    const [pushResult, emailResult] = await Promise.allSettled([
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
    if (pushResult.status  === "rejected") console.error("[complaint] Push failed:",  pushResult.reason);
    if (emailResult.status === "rejected") console.error("[complaint] Email failed:", emailResult.reason);
  }

  // Fire triage in background — does not block the form response
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  fetch(`${appUrl}/api/triage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ complaint_id: complaintId }),
  }).catch((err) => console.error("[triage] background call failed:", err));

  return { success: true, complaint_id: complaintId };
}
