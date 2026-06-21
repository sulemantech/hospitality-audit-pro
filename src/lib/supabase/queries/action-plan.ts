import { createAdminClient } from "@/lib/supabase/server";

export type SavedTask = {
  id: string;
  plan_id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string | null;
  category: string | null;
  property_name: string | null;
  assigned_to: string | null;
  due_in_days: number | null;
  due_date: string | null;
  reasoning: string | null;
  status: "open" | "in_progress" | "done";
  completed_at: string | null;
};

export type SavedPlan = {
  id: string;
  property_id: string | null;
  summary: string;
  open_complaints: number;
  active_alerts: number;
  flagged_reviews: number;
  generated_at: string;
  tasks: SavedTask[];
};

export async function getLatestActionPlan(propertyId?: string): Promise<SavedPlan | null> {
  const supabase = createAdminClient();

  let q = supabase
    .from("action_plans")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(1);

  if (propertyId) {
    q = q.eq("property_id", propertyId);
  } else {
    q = q.is("property_id", null);
  }

  const { data: plans } = await q;
  if (!plans?.length) return null;

  const plan = plans[0];

  const { data: tasks } = await supabase
    .from("action_tasks")
    .select("*")
    .eq("plan_id", plan.id)
    .order("created_at");

  return { ...plan, tasks: (tasks ?? []) as SavedTask[] };
}
