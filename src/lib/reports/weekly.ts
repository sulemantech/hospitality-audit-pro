import { createAdminClient } from "@/lib/supabase/server";

// ─── Brand config ────────────────────────────────────────────────────────────
// White-label ready: pass any BrandConfig to buildWeeklyReportHtml().
// Later: pull from a `report_configs` DB table keyed by client_id.

export interface BrandConfig {
  name: string;
  color: string;       // primary hex colour for headers / buttons
  logoInitial: string; // single letter shown in the logo box
  footerNote?: string;
}

export const BEE_BRAND: BrandConfig = {
  name: "Bee Hospitality Group",
  color: "#1a1a2e",
  logoInitial: "B",
  footerNote: "Cyprus · Internal platform only",
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

interface WeekRange {
  from: string;   // ISO timestamp
  to: string;
  fromDate: string; // YYYY-MM-DD (for review_date comparisons)
  label: string;  // "16 Jun – 22 Jun"
}

function weekRange(weeksAgo: number = 0): WeekRange {
  const now = new Date();
  const daysToMon = (now.getDay() + 6) % 7; // Monday = 0
  const mon = new Date(now);
  mon.setDate(now.getDate() - daysToMon - weeksAgo * 7);
  mon.setHours(0, 0, 0, 0);

  const nextMon = new Date(mon);
  nextMon.setDate(mon.getDate() + 7);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return {
    from: mon.toISOString(),
    to: nextMon.toISOString(),
    fromDate: mon.toISOString().split("T")[0],
    label: `${fmt(mon)} – ${fmt(new Date(nextMon.getTime() - 1))}`,
  };
}

function wowArrow(pct: number, lowerIsBetter = true): string {
  if (pct === 0) return `<span style="color:#6b7280">→ no change</span>`;
  const up = pct > 0;
  const bad = lowerIsBetter ? up : !up;
  const colour = bad ? "#dc2626" : "#16a34a";
  const arrow = up ? "▲" : "▼";
  return `<span style="color:${colour}">${arrow} ${Math.abs(pct)}% vs last week</span>`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Data query ───────────────────────────────────────────────────────────────

export async function buildWeeklyReport() {
  const supabase = createAdminClient();
  const tw = weekRange(0);
  const lw = weekRange(1);

  const [
    { data: properties },
    { count: newTW },
    { count: newLW },
    { count: resolvedTW },
    { count: openTotal },
    { count: criticalOpen },
    { count: flaggedTW },
    { count: flaggedLW },
    { data: byCat },
    { count: tasksDone },
    { count: tasksOpen },
  ] = await Promise.all([
    supabase.from("properties").select("id, name"),

    // Complaints created this week / last week
    supabase.from("complaints").select("id", { count: "exact", head: true })
      .gte("created_at", tw.from).lt("created_at", tw.to),
    supabase.from("complaints").select("id", { count: "exact", head: true })
      .gte("created_at", lw.from).lt("created_at", lw.to),

    // Resolved this week
    supabase.from("complaints").select("id", { count: "exact", head: true })
      .in("status", ["resolved", "closed"])
      .gte("updated_at", tw.from).lt("updated_at", tw.to),

    // All open
    supabase.from("complaints").select("id", { count: "exact", head: true })
      .in("status", ["open", "pending"]),
    supabase.from("complaints").select("id", { count: "exact", head: true })
      .eq("severity", "critical").in("status", ["open", "pending"]),

    // Flagged reviews
    supabase.from("reviews").select("id", { count: "exact", head: true })
      .eq("sentiment", "negative").gt("flag_count", 0)
      .gte("review_date", tw.fromDate),
    supabase.from("reviews").select("id", { count: "exact", head: true })
      .eq("sentiment", "negative").gt("flag_count", 0)
      .gte("review_date", lw.fromDate).lt("review_date", tw.fromDate),

    // Category breakdown this week
    supabase.from("complaints").select("category")
      .gte("created_at", tw.from).lt("created_at", tw.to),

    // AI task progress
    supabase.from("action_tasks").select("id", { count: "exact", head: true })
      .eq("status", "done")
      .gte("completed_at", tw.from).lt("completed_at", tw.to),
    supabase.from("action_tasks").select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
  ]);

  // Top categories
  const catMap: Record<string, number> = {};
  for (const row of byCat ?? []) {
    catMap[row.category] = (catMap[row.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));

  // Per-property breakdown
  const propertyRows = await Promise.all(
    (properties ?? []).map(async (p) => {
      const [
        { count: pNew },
        { count: pResolved },
        { count: pCritical },
        { count: pFlagged },
      ] = await Promise.all([
        supabase.from("complaints").select("id", { count: "exact", head: true })
          .eq("property_id", p.id).gte("created_at", tw.from).lt("created_at", tw.to),
        supabase.from("complaints").select("id", { count: "exact", head: true })
          .eq("property_id", p.id).in("status", ["resolved", "closed"])
          .gte("updated_at", tw.from).lt("updated_at", tw.to),
        supabase.from("complaints").select("id", { count: "exact", head: true })
          .eq("property_id", p.id).eq("severity", "critical").in("status", ["open", "pending"]),
        supabase.from("reviews").select("id", { count: "exact", head: true })
          .eq("property_id", p.id).eq("sentiment", "negative").gt("flag_count", 0)
          .gte("review_date", tw.fromDate),
      ]);
      return {
        name: p.name,
        new: pNew ?? 0,
        resolved: pResolved ?? 0,
        criticalOpen: pCritical ?? 0,
        flaggedReviews: pFlagged ?? 0,
      };
    })
  );

  // Week-over-week % change
  const wowComplaints = newLW
    ? Math.round(((newTW ?? 0) - newLW) / newLW * 100)
    : 0;
  const wowReviews = flaggedLW
    ? Math.round(((flaggedTW ?? 0) - flaggedLW) / flaggedLW * 100)
    : 0;

  const status =
    (criticalOpen ?? 0) > 0 ? "Action Required" :
    (openTotal ?? 0) > 5    ? "Needs Attention" :
    "Good Week";

  return {
    period: tw.label,
    status,
    totals: {
      newComplaints: newTW ?? 0,
      newLastWeek: newLW ?? 0,
      resolved: resolvedTW ?? 0,
      openTotal: openTotal ?? 0,
      criticalOpen: criticalOpen ?? 0,
      flaggedReviews: flaggedTW ?? 0,
      flaggedLastWeek: flaggedLW ?? 0,
      tasksDone: tasksDone ?? 0,
      tasksOpen: tasksOpen ?? 0,
    },
    wow: { complaints: wowComplaints, reviews: wowReviews },
    topCategories,
    properties: propertyRows,
  };
}

export type WeeklyReportData = Awaited<ReturnType<typeof buildWeeklyReport>>;

// ─── HTML template ────────────────────────────────────────────────────────────
// Table-based layout for Outlook compatibility. Inline styles throughout.

export function buildWeeklyReportHtml(
  d: WeeklyReportData,
  brand: BrandConfig
): string {
  const statusColour =
    d.status === "Action Required" ? "#dc2626" :
    d.status === "Needs Attention" ? "#ea580c" : "#16a34a";

  const kpis = [
    { label: "New Complaints",   value: d.totals.newComplaints,  bad: d.totals.newComplaints > 0 },
    { label: "Resolved",         value: d.totals.resolved,       bad: false },
    { label: "Critical Open",    value: d.totals.criticalOpen,   bad: d.totals.criticalOpen > 0 },
    { label: "Flagged Reviews",  value: d.totals.flaggedReviews, bad: d.totals.flaggedReviews > 0 },
  ];

  const kpiCells = kpis.map(({ label, value, bad }) => `
    <td width="25%" style="padding:6px">
      <div style="border:1px solid ${bad ? "#fecaca" : "#e5e7eb"};background:${bad ? "#fef2f2" : "#f9fafb"};border-radius:8px;padding:14px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:${bad ? "#dc2626" : "#111827"}">${value}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px">${label}</div>
      </div>
    </td>
  `).join("");

  const topIssueRows = d.topCategories.length
    ? d.topCategories.map((c, i) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">
            <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${brand.color};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px">${i + 1}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:500;text-transform:capitalize">${capitalize(c.category)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#dc2626">${c.count}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#6b7280;font-size:13px">No complaints this week</td></tr>`;

  const propertyTableRows = d.properties.map((p) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:500">${p.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:${p.new > 0 ? "#ea580c" : "#6b7280"}">${p.new}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:${p.resolved > 0 ? "#16a34a" : "#6b7280"}">${p.resolved}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:${p.criticalOpen > 0 ? "#dc2626" : "#6b7280"}">${p.criticalOpen}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:${p.flaggedReviews > 0 ? "#ea580c" : "#6b7280"}">${p.flaggedReviews}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- Header -->
  <tr>
    <td style="background:${brand.color};border-radius:12px 12px 0 0;padding:24px 28px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="44">
            <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.15);color:#fff;font-size:20px;font-weight:700;text-align:center;line-height:40px">${brand.logoInitial}</div>
          </td>
          <td style="padding-left:12px">
            <div style="color:#fff;font-weight:700;font-size:16px">${brand.name}</div>
            <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px">Weekly Operations Report · ${d.period}</div>
          </td>
          <td align="right">
            <div style="background:${statusColour};color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap">${d.status}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background:#fff;border-radius:0 0 12px 12px;padding:28px">

      <!-- KPI row -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>${kpiCells}</tr>
      </table>

      <!-- WoW trend -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:28px;font-size:13px">
        <div style="font-weight:600;color:#111827;margin-bottom:8px">Week-over-week</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding:4px 0">Complaints &nbsp;${wowArrow(d.wow.complaints)}</td>
            <td width="50%" style="padding:4px 0">Flagged reviews &nbsp;${wowArrow(d.wow.reviews)}</td>
          </tr>
        </table>
      </div>

      <!-- Top issues -->
      <div style="margin-bottom:28px">
        <div style="font-weight:600;color:#111827;font-size:14px;margin-bottom:12px">Top Issues This Week</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:500">#</th>
              <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:500">Category</th>
              <th style="padding:10px 12px;text-align:right;color:#6b7280;font-weight:500">Count</th>
            </tr>
          </thead>
          <tbody>${topIssueRows}</tbody>
        </table>
      </div>

      <!-- Per-property table -->
      <div style="margin-bottom:28px">
        <div style="font-weight:600;color:#111827;font-size:14px;margin-bottom:12px">Property Breakdown</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:500">Property</th>
              <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:500">New</th>
              <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:500">Resolved</th>
              <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:500">Critical Open</th>
              <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:500">Flagged Reviews</th>
            </tr>
          </thead>
          <tbody>${propertyTableRows}</tbody>
        </table>
      </div>

      <!-- AI Tasks -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:28px">
        <div style="font-weight:600;color:#15803d;margin-bottom:6px;font-size:13px">AI Action Plan Progress</div>
        <div style="font-size:13px;color:#166534">
          <strong>${d.totals.tasksDone}</strong> tasks completed this week &nbsp;·&nbsp;
          <strong>${d.totals.tasksOpen}</strong> tasks still open
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #f3f4f6;padding-top:16px;font-size:11px;color:#9ca3af;text-align:center">
        ${brand.name}${brand.footerNote ? ` · ${brand.footerNote}` : ""} · Bee Hospitality Audit Pro
      </div>

    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
