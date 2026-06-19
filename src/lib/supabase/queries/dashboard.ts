import { createAdminClient } from "@/lib/supabase/server";

export async function getDashboardMetrics(propertyId?: string) {
  const supabase = createAdminClient();

  let complaintsQ = supabase.from("complaints").select("status, severity, created_at");
  let reviewsQ    = supabase.from("reviews").select("rating, sentiment, review_date");
  let alertsQ     = supabase.from("alerts").select("severity, status");
  let actionsQ    = supabase.from("action_items").select("status, due_date, priority");

  if (propertyId) {
    complaintsQ = complaintsQ.eq("property_id", propertyId);
    reviewsQ    = reviewsQ.eq("property_id", propertyId);
    alertsQ     = alertsQ.eq("property_id", propertyId);
    actionsQ    = actionsQ.eq("property_id", propertyId);
  }

  const [complaintsRes, reviewsRes, alertsRes, actionItemsRes] = await Promise.all([
    complaintsQ, reviewsQ, alertsQ, actionsQ,
  ]);

  const complaints = complaintsRes.data ?? [];
  const reviews    = reviewsRes.data ?? [];
  const alerts     = alertsRes.data ?? [];
  const actions    = actionItemsRes.data ?? [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);

  const recentReviews = reviews.filter((r) => new Date(r.review_date) >= thirtyDaysAgo);
  const avgRating = recentReviews.length
    ? recentReviews.reduce((s, r) => s + Number(r.rating), 0) / recentReviews.length
    : 0;

  return {
    complaints_open:      complaints.filter((c) => c.status === "open").length,
    complaints_pending:   complaints.filter((c) => c.status === "pending").length,
    complaints_this_month: complaints.filter((c) => new Date(c.created_at) >= startOfMonth).length,
    critical_active:      complaints.filter(
      (c) => c.severity === "critical" && !["resolved", "closed"].includes(c.status)
    ).length,
    avg_rating_30d:         Math.round(avgRating * 10) / 10,
    reviews_30d:            recentReviews.length,
    negative_reviews_30d:   recentReviews.filter((r) => r.sentiment === "negative").length,
    active_alerts:          alerts.filter((a) => a.status === "active").length,
    critical_alerts:        alerts.filter((a) => a.status === "active" && a.severity === "critical").length,
    overdue_actions:        actions.filter(
      (a) => ["todo", "in_progress"].includes(a.status) && a.due_date && new Date(a.due_date) < now
    ).length,
  };
}

export async function getPropertyHealth(propertyId?: string) {
  const supabase = createAdminClient();
  let q = supabase.from("property_health").select("*");
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getActiveAlerts(limit = 10, propertyId?: string) {
  const supabase = createAdminClient();
  let q = supabase
    .from("alerts")
    .select("*, properties(name, type)")
    .eq("status", "active")
    .order("severity", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getRecentComplaints(limit = 5, propertyId?: string) {
  const supabase = createAdminClient();
  let q = supabase
    .from("complaints")
    .select("id, category, severity, status, description, created_at, room_number, properties(name)")
    .in("status", ["open", "pending"])
    .order("severity", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getTopActionItems(limit = 5, propertyId?: string) {
  const supabase = createAdminClient();
  let q = supabase
    .from("action_items")
    .select("*, properties(name)")
    .in("status", ["todo", "in_progress"])
    .order("priority", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
