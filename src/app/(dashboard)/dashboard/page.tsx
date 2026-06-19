import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelativeDate, cn } from "@/lib/utils";
import {
  getDashboardMetrics, getPropertyHealth,
  getActiveAlerts, getRecentComplaints, getTopActionItems,
} from "@/lib/supabase/queries/dashboard";
import {
  MessageSquareWarning, Star, ClipboardList, ArrowRight,
  AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown,
  Bell, Building2,
} from "lucide-react";

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function MetricCard({
  title, value, sub, delta, deltaLabel, icon: Icon, trend, href,
}: {
  title: string; value: string | number; sub?: string;
  delta?: number; deltaLabel?: string; icon: React.ElementType;
  trend?: "up-good" | "up-bad"; href?: string;
}) {
  const isGood = delta !== undefined
    ? (trend === "up-good" ? delta >= 0 : delta <= 0)
    : undefined;

  const inner = (
    <div className="metric-card h-full">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="rounded-lg bg-primary/8 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {delta !== undefined && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium",
          isGood ? "text-green-600" : "text-red-600")}>
          {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {delta >= 0 ? "+" : ""}{delta} {deltaLabel}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

function HealthBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 80 ? "bg-green-500" : s >= 60 ? "bg-amber-500" : "bg-red-500";
  const text = s >= 80 ? "text-green-700" : s >= 60 ? "text-amber-700" : "text-red-700";
  const label = s >= 80 ? "Good" : s >= 60 ? "Fair" : "Poor";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(s, 100)}%` }} />
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${text}`}>{label}</span>
    </div>
  );
}

export default async function DashboardPage() {
  const [metrics, propertyHealth, alerts, recentComplaints, actionItems] = await Promise.all([
    getDashboardMetrics(),
    getPropertyHealth(),
    getActiveAlerts(6),
    getRecentComplaints(5),
    getTopActionItems(4),
  ]);

  const today = new Date().toLocaleDateString("en-CY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const sortedAlerts = [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

  return (
    <>
      <Header title="Dashboard" subtitle={today} />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            title="Open Complaints"
            value={metrics.complaints_open + metrics.complaints_pending}
            sub={`${metrics.critical_active} critical · ${metrics.complaints_this_month} this month`}
            icon={MessageSquareWarning}
            href="/complaints"
          />
          <MetricCard
            title="Avg Review Rating"
            value={metrics.avg_rating_30d > 0 ? `${metrics.avg_rating_30d}/10` : "—"}
            sub={`${metrics.reviews_30d} reviews · ${metrics.negative_reviews_30d} negative (30d)`}
            icon={Star}
            href="/reviews"
          />
          <MetricCard
            title="Active Alerts"
            value={metrics.active_alerts}
            sub={`${metrics.critical_alerts} critical require immediate action`}
            icon={Bell}
          />
          <MetricCard
            title="Overdue Actions"
            value={metrics.overdue_actions}
            sub="Past their due date"
            icon={ClipboardList}
            href="/action-plan"
          />
        </div>

        {/* Row 2: Property Health + Recent Complaints */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Property Health */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Property Health</CardTitle>
              <span className="text-[10px] text-muted-foreground">30-day window</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {propertyHealth.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
              ) : (
                propertyHealth.map((p) => (
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
                    <HealthBar score={
                      // Simple health score: start 100, -15 per critical alert, -8 per open complaint, -5 per negative review
                      Math.max(0, 100
                        - (Number(p.critical_alerts) * 15)
                        - (Number(p.open_complaints) * 8)
                        - (Number(p.negative_reviews_30d) * 5)
                      )
                    } />
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{p.open_complaints} open complaint{Number(p.open_complaints) !== 1 ? "s" : ""}</span>
                      {Number(p.critical_alerts) > 0 && (
                        <span className="text-red-600 font-medium">{p.critical_alerts} critical alert{Number(p.critical_alerts) !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Complaints */}
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
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/40 hover:shadow-card transition-all cursor-pointer">
                      <div className="shrink-0 mt-0.5">
                        {c.severity === "critical" ? <AlertTriangle className="h-4 w-4 text-red-500" />
                          : c.severity === "high" ? <AlertTriangle className="h-4 w-4 text-orange-500" />
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

        {/* Row 3: Alerts + Action Items */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Active Alerts */}
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
                    <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${border}`}>
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

          {/* Action Items */}
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
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
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
                          <Badge variant={item.priority as "critical" | "high" | "medium" | "low"} className="text-[10px] py-0">{item.priority}</Badge>
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
