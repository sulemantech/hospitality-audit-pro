export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPush } from "@/lib/notifications/push";

// How many hours before a complaint is considered overdue
const SLA_HOURS: Record<string, number> = {
  critical: 1,
  high:     4,
  medium:   24,
  low:      72,
};

export async function GET() {
  const supabase = createAdminClient();
  const now = new Date();

  // Fetch all open/pending complaints — we'll filter by SLA in JS
  const { data: complaints, error } = await supabase
    .from("complaints")
    .select("id, severity, category, description, room_number, created_at, properties(name)")
    .in("status", ["open", "pending"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[escalation] DB error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const overdue = (complaints ?? []).filter((c) => {
    const slaHours = SLA_HOURS[c.severity] ?? 72;
    const ageHours = (now.getTime() - new Date(c.created_at).getTime()) / 3_600_000;
    return ageHours >= slaHours;
  });

  if (overdue.length === 0) {
    return NextResponse.json({ escalated: 0, message: "All complaints within SLA" });
  }

  // Fetch existing auto-escalation notes to prevent duplicate notifications
  const overdueIds = overdue.map((c) => c.id);
  const { data: existingNotes } = await supabase
    .from("complaint_updates")
    .select("complaint_id")
    .in("complaint_id", overdueIds)
    .ilike("note", "[AUTO-ESCALATION]%");

  const alreadyEscalated = new Set((existingNotes ?? []).map((n) => n.complaint_id));

  let escalatedCount = 0;

  for (const complaint of overdue) {
    if (alreadyEscalated.has(complaint.id)) continue;

    const propName = (complaint.properties as unknown as { name: string } | null)?.name ?? "Unknown";
    const slaHours = SLA_HOURS[complaint.severity] ?? 72;
    const ageHours = Math.round(
      (now.getTime() - new Date(complaint.created_at).getTime()) / 3_600_000
    );

    const note = `[AUTO-ESCALATION] ${complaint.severity.toUpperCase()} complaint overdue by ${ageHours - slaHours}h (SLA: ${slaHours}h). No resolution recorded. Immediate attention required.`;

    const [insertResult, pushResult] = await Promise.allSettled([
      supabase.from("complaint_updates").insert({
        complaint_id: complaint.id,
        author: "Escalation Agent",
        action: "escalated",
        note,
      }),
      sendPush({
        title: `SLA Breach — ${complaint.severity.toUpperCase()} at ${propName}`,
        message: `${complaint.category}${complaint.room_number ? ` · Room ${complaint.room_number}` : ""} — ${ageHours}h old, SLA is ${slaHours}h.\n"${complaint.description.slice(0, 80)}${complaint.description.length > 80 ? "…" : ""}"`,
        priority: complaint.severity === "critical" ? "urgent" : "high",
        tags: ["rotating_light", "clock3"],
      }),
    ]);

    if (insertResult.status === "rejected") {
      console.error(`[escalation] Failed to log note for ${complaint.id}:`, insertResult.reason);
    }
    if (pushResult.status === "rejected") {
      console.error(`[escalation] Failed to push for ${complaint.id}:`, pushResult.reason);
    }

    if (insertResult.status === "fulfilled") escalatedCount++;
  }

  console.log(`[escalation] Checked ${overdue.length} overdue complaints, escalated ${escalatedCount} new.`);
  return NextResponse.json({
    escalated:   escalatedCount,
    total_overdue: overdue.length,
    already_notified: overdue.length - escalatedCount,
    checked_at: now.toISOString(),
  });
}
