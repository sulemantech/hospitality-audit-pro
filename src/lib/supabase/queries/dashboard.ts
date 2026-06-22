import { createAdminClient } from "@/lib/supabase/server";

export async function getDashboardMetrics(propertyId?: string) {
  const supabase = createAdminClient();

  let complaintsQ = supabase.from("complaints").select("status, severity, created_at, resolved_at");
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

  const now             = new Date();
  const thirtyDaysAgo   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo    = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twoHoursAgo     = new Date(now.getTime() -  2 * 60 * 60 * 1000);
  const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Reviews ──────────────────────────────────────────────────
  const recentReviews = reviews.filter((r) => new Date(r.review_date) >= thirtyDaysAgo);
  const avgRating = recentReviews.length
    ? recentReviews.reduce((s, r) => s + Number(r.rating), 0) / recentReviews.length
    : 0;

  // ── Resolution time ──────────────────────────────────────────
  // avg hours from created_at → resolved_at for complaints closed in a given window
  const avgResolutionHrs = (arr: typeof complaints): number | null => {
    const resolved = arr.filter((c) => c.resolved_at);
    if (!resolved.length) return null;
    const total = resolved.reduce((s, c) => {
      const hrs =
        (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) /
        (1000 * 60 * 60);
      return s + Math.max(0, hrs); // guard against negative (data anomaly)
    }, 0);
    return Math.round((total / resolved.length) * 10) / 10;
  };

  const resolvedThisWeek = complaints.filter(
    (c) => c.resolved_at && new Date(c.resolved_at) >= sevenDaysAgo
  );
  const resolvedLastWeek = complaints.filter(
    (c) =>
      c.resolved_at &&
      new Date(c.resolved_at) >= fourteenDaysAgo &&
      new Date(c.resolved_at) < sevenDaysAgo
  );

  const avg_resolution_hrs      = avgResolutionHrs(resolvedThisWeek);
  const avg_resolution_hrs_prev = avgResolutionHrs(resolvedLastWeek);
  // negative delta = faster = good
  const resolution_trend_hrs =
    avg_resolution_hrs !== null && avg_resolution_hrs_prev !== null
      ? Math.round((avg_resolution_hrs - avg_resolution_hrs_prev) * 10) / 10
      : null;

  // ── Unacknowledged (open & untouched > 2 h) ──────────────────
  const unacknowledged_count = complaints.filter(
    (c) => c.status === "open" && new Date(c.created_at) < twoHoursAgo
  ).length;

  return {
    // existing
    complaints_open:       complaints.filter((c) => c.status === "open").length,
    complaints_pending:    complaints.filter((c) => c.status === "pending").length,
    complaints_this_month: complaints.filter((c) => new Date(c.created_at) >= startOfMonth).length,
    critical_active:       complaints.filter(
      (c) => c.severity === "critical" && !["resolved", "closed"].includes(c.status)
    ).length,
    avg_rating_30d:        Math.round(avgRating * 10) / 10,
    reviews_30d:           recentReviews.length,
    negative_reviews_30d:  recentReviews.filter((r) => r.sentiment === "negative").length,
    active_alerts:         alerts.filter((a) => a.status === "active").length,
    critical_alerts:       alerts.filter((a) => a.status === "active" && a.severity === "critical").length,
    overdue_actions:       actions.filter(
      (a) => ["todo", "in_progress"].includes(a.status) && a.due_date && new Date(a.due_date) < now
    ).length,
    // new
    avg_resolution_hrs,
    avg_resolution_hrs_prev,
    resolution_trend_hrs,
    unacknowledged_count,
    resolved_this_week: resolvedThisWeek.length,
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

// Returns processed data for the 3 dashboard charts.
export async function getDashboardChartData(propertyId?: string) {
  const supabase = createAdminClient();
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo   = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);

  let cQ = supabase
    .from("complaints")
    .select("created_at, category")
    .gte("created_at", fourteenDaysAgo.toISOString());
  let rQ = supabase
    .from("reviews")
    .select("review_date, rating")
    .gte("review_date", eightWeeksAgo.toISOString().split("T")[0]);

  if (propertyId) { cQ = cQ.eq("property_id", propertyId); rQ = rQ.eq("property_id", propertyId); }

  const [{ data: complaints }, { data: reviews }] = await Promise.all([cQ, rQ]);

  // ── 14-day trend ─────────────────────────────────────────────
  const trend: Array<{ date: string; count: number }> = [];
  const keyToIdx: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    keyToIdx[key] = trend.length;
    trend.push({ date: d.toLocaleDateString("en", { month: "short", day: "numeric" }), count: 0 });
  }
  (complaints ?? []).forEach((c) => {
    const key = c.created_at.split("T")[0];
    if (keyToIdx[key] !== undefined) trend[keyToIdx[key]].count++;
  });

  // ── Category breakdown ────────────────────────────────────────
  const cats: Record<string, number> = {};
  (complaints ?? []).forEach((c) => {
    const name = c.category.charAt(0).toUpperCase() + c.category.slice(1);
    cats[name] = (cats[name] ?? 0) + 1;
  });
  const categoryBreakdown = Object.entries(cats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // ── Weekly rating trend ───────────────────────────────────────
  const weekMap: Record<string, { total: number; n: number }> = {};
  (reviews ?? []).forEach((r) => {
    const d   = new Date(r.review_date);
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const key = mon.toISOString().split("T")[0];
    if (!weekMap[key]) weekMap[key] = { total: 0, n: 0 };
    weekMap[key].total += Number(r.rating);
    weekMap[key].n++;
  });
  const ratingTrend = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, { total, n }]) => ({
      week: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      avg:  Math.round((total / n) * 10) / 10,
    }));

  return { complaintTrend: trend, categoryBreakdown, ratingTrend };
}

// Returns open complaints that have been sitting untouched for > 2 hours.
// Ordered oldest-first so the most neglected appear at the top.
export async function getUnacknowledgedComplaints(propertyId?: string) {
  const supabase = createAdminClient();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  let q = supabase
    .from("complaints")
    .select("id, category, severity, description, created_at, room_number, properties(name)")
    .eq("status", "open")
    .lt("created_at", twoHoursAgo)
    .order("severity", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(8);

  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
