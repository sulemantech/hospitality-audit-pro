"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { type SavedPlan } from "@/lib/supabase/queries/action-plan";

const ActionItemSchema = z.object({
  priority: z.enum(["critical", "high", "medium", "low"]),
  title: z.string(),
  description: z.string(),
  property_name: z.string(),
  category: z.enum(["pest", "facilities", "cleanliness", "staff", "maintenance", "review_response", "process", "financial"]),
  due_in_days: z.number(),
  assigned_to: z.string(),
  reasoning: z.string(),
});

const ActionPlanSchema = z.object({
  summary: z.string(),
  tasks: z.array(ActionItemSchema),
});

export type GeneratedTask = z.infer<typeof ActionItemSchema>;
export type GeneratedPlan = z.infer<typeof ActionPlanSchema>;

export async function generateActionPlan(
  propertyId?: string,
  context?: { openComplaints: number; activeAlerts: number; flaggedReviews: number }
): Promise<{ success: true; plan: SavedPlan } | { success: false; error: string }> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return { success: false, error: "GOOGLE_GENERATIVE_AI_API_KEY not configured. Get a free key at https://aistudio.google.com/apikey and add it to .env.local" };
  }

  const supabase = createAdminClient();

  // Fetch context data
  let complaintsQ = supabase
    .from("complaints")
    .select("id, category, severity, status, description, room_number, created_at, properties(name)")
    .in("status", ["open", "pending"])
    .order("severity");
  if (propertyId) complaintsQ = complaintsQ.eq("property_id", propertyId);

  let alertsQ = supabase
    .from("alerts")
    .select("title, message, severity, source_keyword, mention_count, properties(name)")
    .eq("status", "active")
    .order("severity");
  if (propertyId) alertsQ = alertsQ.eq("property_id", propertyId);

  let reviewsQ = supabase
    .from("reviews")
    .select("sentiment, flag_count, flagged_keywords, rating, review_date, properties(name)")
    .eq("sentiment", "negative")
    .gt("flag_count", 0)
    .gte("review_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("flag_count", { ascending: false })
    .limit(20);
  if (propertyId) reviewsQ = reviewsQ.eq("property_id", propertyId);

  const [{ data: complaints }, { data: alerts }, { data: reviews }] = await Promise.all([
    complaintsQ, alertsQ, reviewsQ,
  ]);

  if (!complaints?.length && !alerts?.length && !reviews?.length) {
    return { success: false, error: "No open complaints, alerts, or flagged reviews found. The system looks healthy!" };
  }

  const prompt = `
You are an operational intelligence assistant for Bee Hospitality Group, a Cyprus-based hotel and hostel group managing 5 properties.

## Open Complaints (${complaints?.length ?? 0})
${(complaints ?? []).map((c) => {
  const prop = (c.properties as unknown as { name: string } | null)?.name ?? "Unknown";
  return `- [${c.severity?.toUpperCase()}] ${prop} | ${c.category} | Rm ${c.room_number ?? "N/A"} | "${c.description}" | Open ${Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)}d`;
}).join("\n") || "None"}

## Active Keyword Alerts (${alerts?.length ?? 0})
${(alerts ?? []).map((a) => {
  const prop = (a.properties as unknown as { name: string } | null)?.name ?? "Unknown";
  return `- [${a.severity?.toUpperCase()}] ${prop} | "${a.title}" | Keyword: ${a.source_keyword} | ${a.mention_count} mentions`;
}).join("\n") || "None"}

## Flagged Negative Reviews — Last 30 Days (${reviews?.length ?? 0})
${(reviews ?? []).map((r) => {
  const prop = (r.properties as unknown as { name: string } | null)?.name ?? "Unknown";
  return `- ${prop} | Rating: ${r.rating}/10 | Flags: ${r.flagged_keywords?.join(", ")}`;
}).join("\n") || "None"}

Generate a prioritised action plan. Rules:
- critical tasks: same-day response (due_in_days: 0 or 1)
- high tasks: this week (due_in_days: 2-5)
- medium tasks: this month (due_in_days: 7-21)
- low tasks: next month (due_in_days: 22-30)
- Assign to: "Property Manager", "Maintenance Team", "Front Desk", "Owner", or "Housekeeping"
- Be specific: name the property, keyword, or complaint in the title
- Max 12 tasks total. Don't duplicate obvious tasks.
- Summary should be 1-2 sentences: overall health + top priority.
`.trim();

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ActionPlanSchema,
      prompt,
    });

    // Save plan to DB
    const today = new Date();
    const { data: savedPlan, error: planError } = await supabase
      .from("action_plans")
      .insert({
        property_id: propertyId ?? null,
        summary: object.summary,
        open_complaints: context?.openComplaints ?? complaints?.length ?? 0,
        active_alerts: context?.activeAlerts ?? alerts?.length ?? 0,
        flagged_reviews: context?.flaggedReviews ?? reviews?.length ?? 0,
      })
      .select()
      .single();

    if (planError || !savedPlan) {
      return { success: false, error: `Failed to save plan: ${planError?.message}` };
    }

    // Save tasks
    const taskRows = object.tasks.map((t) => {
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + t.due_in_days);
      return {
        plan_id: savedPlan.id,
        priority: t.priority,
        title: t.title,
        description: t.description,
        category: t.category,
        property_name: t.property_name,
        assigned_to: t.assigned_to,
        due_in_days: t.due_in_days,
        due_date: dueDate.toISOString().split("T")[0],
        reasoning: t.reasoning,
        status: "open" as const,
      };
    });

    const { data: savedTasks } = await supabase
      .from("action_tasks")
      .insert(taskRows)
      .select();

    return {
      success: true,
      plan: { ...savedPlan, tasks: savedTasks ?? [] },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    return { success: false, error: msg };
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: "open" | "in_progress" | "done"
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("action_tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
