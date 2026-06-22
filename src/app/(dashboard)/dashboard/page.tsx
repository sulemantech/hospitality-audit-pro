import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { formatRelativeDate, cn } from "@/lib/utils";
import {
  getDashboardMetrics, getPropertyHealth,
  getActiveAlerts, getRecentComplaints, getTopActionItems,
  getUnacknowledgedComplaints, getDashboardChartData,
} from "@/lib/supabase/queries/dashboard";
import {
  MessageSquareWarning, Star, ClipboardList, ArrowRight,
  AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown,
  Bell, Building2, Timer, Eye,
} from "lucide-react";

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

// ── KPI card ─────────────────────────────────────────────────────────────────
function MetricCard({
  title, value, sub, icon: Icon, iconBg, iconColor, urgent,
  delta, deltaLabel, deltaGoodWhenNegative, href,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  urgent?: boolean;
  delta?: number | null;
  deltaLabel?: string;
  deltaGoodWhenNegative?: boolean;
  href?: string;
}) {
  const isGood =
    delta !== null && delta !== undefined
      ? deltaGoodWhenNegative ? delta <= 0 : delta >= 0
      : undefined;

  const inner = (
    <div className={cn(
      "metric-card h-full",
      urgent && "border-red-300 bg-red-50/30",
    )}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
          {title}
        </p>
        <div className={cn("icon-badge shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>

      <p className={cn(
        "mt-3 text-3xl font-bold tabular-nums",
        urgent ? "text-red-600" : "text-foreground",
      )}>
        {value}
      </p>

      {sub && <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{sub}</p>}

      {delta !== null && delta !== undefined && (
        <div className={cn(
          "mt-3 flex items-center gap-1 text-[11px] font-semibold",
          isGood ? "text-green-600" : "text-red-500",
        )}>
          {delta > 0
            ? <TrendingUp className="h-3.5 w-3.5" />
            : <TrendingDown className="h-3.5 w-3.5" />}
          {delta > 0 ? "+" : ""}{delta} {deltaLabel}
        </div>
      )}
    </div>
  );

  return href
    ? <Link href={href} className="block h-full rounded-xl">{inner}</Link>
    : inner;
}

// ── Resolution time formatter ─────────────────────────────────────────────────
function fmtHrs(h: number | null): string {
  if (h === null) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export const dynamic = "force-dynamic";

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { property?: string };
}) {
  const pid = searchParams.property;

  const [metrics, propertyHealth, alerts, recentComplaints, actionItems, unacknowledged, chartData] =
    await Promise.all([
      getDashboardMetrics(pid),
      getPropertyHealth(pid),
      getActiveAlerts(6, pid),
      getRecentComplaints(5, pid),
      getTopActionItems(4, pid),
      getUnacknowledgedComplaints(pid),
      getDashboardChartData(pid),
    ]);

  const today = new Date().toLocaleDateString("en-CY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const sortedAlerts = [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

  const resTrend  = metrics.resolution_trend_hrs;
  const resFaster = resTrend !== null && resTrend <= 0;

  return (
    <>
      <Header title="Dashboard" subtitle={today} />
      <div className="p-6 space-y-5 animate-fade-in">

        {/* ── KPI Row 1 — urgency ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <MetricCard
            title="Unacknowledged › 2h"
            value={metrics.unacknowledged_count}
            sub={metrics.unacknowledged_count > 0
              ? "Open complaints no-one has touched"
              : "All open complaints have been seen"}
            icon={Eye}
            iconBg={metrics.unacknowledged_count > 0 ? "bg-red-100"    : "bg-slate-100"}
            iconColor={metrics.unacknowledged_count > 0 ? "text-red-600" : "text-slate-500"}
            urgent={metrics.unacknowledged_count > 0}
            href="/complaints"
          />
          <MetricCard
            title="Open Complaints"
            value={metrics.complaints_open + metrics.complaints_pending}
            sub={`${metrics.critical_active} critical · ${metrics.complaints_this_month} this month`}
            icon={MessageSquareWarning}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            href="/complaints"
          />
          <MetricCard
            title="Active Alerts"
            value={metrics.active_alerts}
            sub={`${metrics.critical_alerts} critical require immediate action`}
            icon={Bell}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        {/* ── KPI Row 2 — performance ──────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {/* Avg resolution time — custom render for trend line */}
          <div className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Avg Resolution Time
              </p>
              <div className="icon-badge shrink-0 bg-blue-100">
                <Timer className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
              {fmtHrs(metrics.avg_resolution_hrs)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {metrics.resolved_this_week} resolved this week
              {metrics.avg_resolution_hrs_prev !== null && (
                <> · prev {fmtHrs(metrics.avg_resolution_hrs_prev)}</>
              )}
            </p>
            {resTrend !== null && (
              <div className={cn(
                "mt-3 flex items-center gap-1 text-[11px] font-semibold",
                resFaster ? "text-green-600" : "text-red-500",
              )}>
                {resFaster
                  ? <TrendingDown className="h-3.5 w-3.5" />
                  : <TrendingUp className="h-3.5 w-3.5" />}
                {resFaster ? "" : "+"}{resTrend}h vs last week
                <span className="font-normal text-muted-foreground ml-0.5">
                  {resFaster ? "(faster ✓)" : "(slower)"}
                </span>
              </div>
            )}
            {metrics.avg_resolution_hrs === null && (
              <p className="mt-3 text-[11px] text-muted-foreground/50">
                No resolved complaints this week
              </p>
            )}
          </div>

          <MetricCard
            title="Avg Review Rating"
            value={metrics.avg_rating_30d > 0 ? `${metrics.avg_rating_30d}/10` : "—"}
            sub={`${metrics.reviews_30d} reviews · ${metrics.negative_reviews_30d} negative (30d)`}
            icon={Star}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            href="/reviews"
          />
          <MetricCard
            title="Overdue Actions"
            value={metrics.overdue_actions}
            sub="Tasks past their due date"
            icon={ClipboardList}
            iconBg={metrics.overdue_actions > 0 ? "bg-red-100"    : "bg-slate-100"}
            iconColor={metrics.overdue_actions > 0 ? "text-red-600" : "text-slate-500"}
            href="/action-plan"
          />
        </div>

        {/* ── Unacknowledged detail panel (conditional) ─────────── */}
        {unacknowledged.length > 0 && (
          <Card className="border-red-200 bg-red-50/20">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <CardTitle className="text-red-700">
                  {unacknowledged.length} Complaint{unacknowledged.length !== 1 ? "s" : ""} Need Attention
                </CardTitle>
              </div>
              <span className="text-[11px] font-medium text-red-500">Open › 2 hours · no status update</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {unacknowledged.map((c) => {
                const ageHrs  = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);
                const ageLabel = ageHrs < 1 ? `${Math.round(ageHrs * 60)}m ago` : `${ageHrs.toFixed(1)}h ago`;
                return (
                  <Link key={c.id} href={`/complaints/${c.id}`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-red-200 hover:border-red-400 hover:shadow-sm transition-all cursor-pointer">
                      <AlertTriangle className={cn("h-4 w-4 shrink-0 mt-0.5",
                        c.severity === "critical" ? "text-red-500" : "text-orange-500")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {(c.properties as unknown as { name: string } | null)?.name}
                          </span>
                          {c.room_number && <span className="text-xs text-muted-foreground">· Rm {c.room_number}</span>}
                          <Badge variant={c.severity as "critical" | "high" | "medium" | "low"} className="text-[10px] py-0">
                            {c.severity}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] py-0 capitalize">
                            {c.category}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-red-600 shrink-0">{ageLabel}</span>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* ── Charts ────────────────────────────────────────────── */}
        <DashboardCharts data={chartData} />

        {/* ── Property Health + Recent Complaints ───────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Property Health</CardTitle>
              <span className="text-[10px] text-muted-foreground">30-day window</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {propertyHealth.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
              ) : (
                propertyHealth.map((p) => {
                  const score = Math.max(0, 100
                    - Number(p.critical_alerts)    * 15
                    - Number(p.open_complaints)    * 8
                    - Number(p.negative_reviews_30d) * 5
                  );
                  const bar  = score >= 80 ? "bg-green-500"  : score >= 60 ? "bg-amber-500"  : "bg-red-500";
                  const txt  = score >= 80 ? "text-green-700": score >= 60 ? "text-amber-700": "text-red-700";
                  const lbl  = score >= 80 ? "Good"          : score >= 60 ? "Fair"           : "Poor";
                  return (
                    <div key={p.property_id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">{p.property_name}</span>
                          <Badge variant={p.property_type as "hostel" | "hotel"} className="text-[9px] py-0 px-1.5 shrink-0">
                            {p.property_type}
                          </Badge>
                        </div>
                        {p.avg_rating_30d && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {p.avg_rating_30d}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(score, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-semibold w-8 text-right ${txt}`}>{lbl}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{p.open_complaints} open</span>
                        {Number(p.critical_alerts) > 0 && (
                          <span className="text-red-600 font-medium">{p.critical_alerts} critical alert{Number(p.critical_alerts) !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Recent Open Complaints</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2" asChild>
                <Link href="/complaints">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentComplaints.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-foreground">No open complaints</p>
                  <p className="text-xs text-muted-foreground">All properties are clear right now</p>
                </div>
              ) : (
                recentComplaints.map((c) => (
                  <Link key={c.id} href={`/complaints/${c.id}`}>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                      <div className="shrink-0 mt-0.5">
                        {c.severity === "critical"
                          ? <AlertTriangle className="h-4 w-4 text-red-500" />
                          : c.severity === "high"
                          ? <AlertTriangle className="h-4 w-4 text-orange-500" />
                          : <Clock className="h-4 w-4 text-amber-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {(c.properties as unknown as { name: string } | null)?.name}
                          </span>
                          {c.room_number && <span className="text-xs text-muted-foreground">· Rm {c.room_number}</span>}
                          <Badge variant={c.severity as "critical" | "high" | "medium" | "low"} className="text-[10px] py-0">{c.severity}</Badge>
                          <Badge variant="outline" className="text-[10px] py-0 capitalize">{c.category}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatRelativeDate(c.created_at)}</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Active Alerts + Action Items ──────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Active Alerts</CardTitle>
              {metrics.critical_alerts > 0 && (
                <Badge variant="critical">{metrics.critical_alerts} critical</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedAlerts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="h-7 w-7 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No active alerts — all clear</p>
                </div>
              ) : (
                sortedAlerts.map((alert) => {
                  const border = alert.severity === "critical" ? "border-red-200 bg-red-50"
                    : alert.severity === "high" ? "border-orange-200 bg-orange-50"
                    : "border-amber-200 bg-amber-50";
                  const dot = alert.severity === "critical" ? "bg-red-500"
                    : alert.severity === "high" ? "bg-orange-500" : "bg-amber-500";
                  return (
                    <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${border}`}>
                      <span className={`status-dot mt-1.5 shrink-0 ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{alert.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 capitalize">{alert.severity}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Priority Action Items</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2" asChild>
                <Link href="/action-plan">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No pending action items</p>
              ) : (
                actionItems.map((item) => {
                  const isOverdue = item.due_date && new Date(item.due_date) < new Date();
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background">
                      <div className="shrink-0 mt-0.5">
                        {item.status === "in_progress"
                          ? <Clock className="h-4 w-4 text-blue-500" />
                          : item.priority === "critical" || item.priority === "high"
                          ? <AlertTriangle className={`h-4 w-4 ${item.priority === "critical" ? "text-red-500" : "text-orange-500"}`} />
                          : <ClipboardList className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-1">{item.title}</p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          {(item.properties as { name: string } | null)?.name && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {(item.properties as { name: string }).name}
                            </span>
                          )}
                          <Badge variant={item.priority as "critical" | "high" | "medium" | "low"} className="text-[10px] py-0">
                            {item.priority}
                          </Badge>
                          {isOverdue && <Badge variant="critical" className="text-[10px] py-0">Overdue</Badge>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </>
  );
}
