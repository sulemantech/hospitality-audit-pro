export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPush } from "@/lib/notifications/push";

const TriageSchema = z.object({
  corrected_severity: z.enum(["critical", "high", "medium", "low"]),
  confidence: z.number().min(0).max(1),
  action_note: z.string().max(200),
  reasoning: z.string(),
});

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return NextResponse.json({ skipped: true, reason: "GOOGLE_GENERATIVE_AI_API_KEY not configured" });
  }

  let body: { complaint_id?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { complaint_id } = body;
  if (!complaint_id) return NextResponse.json({ error: "complaint_id required" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: complaint, error: fetchErr } = await supabase
    .from("complaints")
    .select("id, severity, category, description, room_number, properties(name)")
    .eq("id", complaint_id)
    .single();

  if (fetchErr || !complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  const propName = (complaint.properties as unknown as { name: string } | null)?.name ?? "Unknown";

  const prompt = `
You are a hospitality operations expert with 20 years of experience across hotels and hostels in the Mediterranean.

A complaint has just been logged at ${propName}${complaint.room_number ? ` in Room ${complaint.room_number}` : ""}:

Category: ${complaint.category}
Staff-assigned severity: ${complaint.severity}
Description: "${complaint.description}"

Assess the true severity based on the description content, regardless of what the staff selected. Common mistakes:
- Staff mark pest sightings as "medium" or "low" when they should always be "critical"
- Safety issues (fire hazard, water on floor, broken glass, electrical) are always "critical"
- Billing disputes are almost never higher than "medium"
- Noise complaints are "high" only if persistent or affecting multiple rooms
- "AC not cold enough" is usually "medium" unless the guest is medically vulnerable

Respond with:
- corrected_severity: the severity you assess, even if it matches the staff selection
- confidence: how confident you are (0.0–1.0)
- action_note: one specific, actionable instruction for the property manager (max 150 chars)
- reasoning: brief explanation of your assessment
`.trim();

  try {
    const { output: object } = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({ schema: TriageSchema }),
      prompt,
    });

    const severityChanged = object.corrected_severity !== complaint.severity;
    const highConfidence = object.confidence >= 0.80;

    // Only intervene when AI is confident AND the severity actually differs
    if (severityChanged && highConfidence) {
      const [updateErr, insertErr] = await Promise.all([
        supabase
          .from("complaints")
          .update({ severity: object.corrected_severity })
          .eq("id", complaint_id)
          .then(({ error }) => error),

        supabase
          .from("complaint_updates")
          .insert({
            complaint_id,
            author: "AI Triage",
            action: "escalated",
            note: `[AI TRIAGE] Severity adjusted ${complaint.severity.toUpperCase()} → ${object.corrected_severity.toUpperCase()} (${Math.round(object.confidence * 100)}% confidence).\n${object.action_note}\n\nReason: ${object.reasoning}`,
          })
          .then(({ error }) => error),
      ]);

      if (!updateErr && !insertErr) {
        // Notify manager that AI upgraded the severity
        const isUpgrade =
          ["critical", "high", "medium", "low"].indexOf(object.corrected_severity) <
          ["critical", "high", "medium", "low"].indexOf(complaint.severity);

        if (isUpgrade) {
          await sendPush({
            title: `AI Triage: ${complaint.severity} → ${object.corrected_severity.toUpperCase()} — ${propName}`,
            message: `${object.action_note}\n\nAI upgraded a ${complaint.category} complaint originally logged as ${complaint.severity}.`,
            priority: object.corrected_severity === "critical" ? "urgent" : "high",
            tags: ["robot", "warning"],
          });
        }
      }
    }

    return NextResponse.json({
      complaint_id,
      original_severity: complaint.severity,
      corrected_severity: object.corrected_severity,
      confidence: object.confidence,
      action_note: object.action_note,
      changed: severityChanged && highConfidence,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Triage failed";
    console.error("[triage]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
