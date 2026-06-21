import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/server";
import { getProperties } from "@/lib/supabase/queries/complaints";
import { cn, formatDate } from "@/lib/utils";
import { Printer, Download, AlertTriangle, Star, MessageSquareWarning, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

async function getReportData(propertyId?: string) {
  const supabase = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  let complaintsQ = supabase.from("complaints").select("severity, status, category, created_at, properties(name)");
  let reviewsQ    = supabase.from("reviews").select("rating, sentiment, flagged_keywords, flag_count, review_date, properties(name)").gte("review_date", thirtyDaysAgo);
  let alertsQ     = supabase.from("alerts").select("title, severity, status, source_keyword, mention_count, properties(name)").eq("status", "active");

  if (propertyId) {
    complaintsQ = complaintsQ.eq("property_id", propertyId);
    reviewsQ    = reviewsQ.eq("property_id", propertyId);
    alertsQ     = alertsQ.eq("property_id", propertyId);
  }

  const [{ data: complaints }, { data: reviews }, { data: alerts }] = await Promise.all([
    complaintsQ, reviewsQ, alertsQ,
  ]);

  const c = complaints ?? [];
  const r = reviews ?? [];
  const a = alerts ?? [];

  const avgRating = r.length ? Math.round((r.reduce((s, x) => s + Number(x.rating), 0) / r.length) * 10) / 10 : 0;
  const flagged   = r.filter((x) => x.flag_count > 0);
  const negative  = r.filter((x) => x.sentiment === "negative");
  const openComplaints = c.filter((x) => ["open", "pending"].includes(x.status));
  const critical  = c.filter((x) => x.severity === "critical");

  // Top keywords across flagged reviews
  const kwCount: Record<string, number> = {};
  flagged.forEach((rv) => (rv.flagged_keywords ?? []).forEach((kw: string) => { kwCount[kw] = (kwCount[kw] ?? 0) + 1; }));
  const topKeywords = Object.entries(kwCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return { complaints: c, reviews: r, alerts: a, avgRating, flagged, negative, openComplaints, critical, topKeywords };
}

export default async function ReportsPage({ searchParams }: { searchParams: { property?: string } }) {
  const propertyId = searchParams.property;
  const [data, properties] = await Promise.all([getReportData(propertyId), getProperties()]);
  const selectedProperty = properties.find((p) => p.id === propertyId);
  const reportDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const { complaints, reviews, alerts, avgRating, flagged, negative, openComplaints, critical, topKeywords } = data;

  return (
    <>
      <Header title="Reports" subtitle="Operational audit summary — printable and exportable" />
      <div className="p-6 space-y-5 animate-fade-in">

        {/* Toolbar */}
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {}} asChild>
            <button onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Print Report
            </button>
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedProperty ? `${selectedProperty.name} · ` : "All properties · "}{reportDate}
          </span>
        </div>

        {/* Report header (shows in print) */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">B</div>
                  <span className="text-sm font-semibold text-foreground">Bee Hospitality Audit Pro</span>
                </div>
                <h1 className="text-xl font-bold text-foreground mt-2">
                  {selectedProperty ? selectedProperty.name : "Portfolio"} — Operational Audit Report
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  30-day window · Generated {reportDate}
                </p>
              </div>
              <Badge variant={critical.length > 0 ? "critical" : negative.length > 0 ? "negative" : "positive"} className="text-xs">
                {critical.length > 0 ? "Action Required" : negative.length > 0 ? "Needs Attention" : "All Clear"}
              </Badge>
            </div>

            {/* KPI summary */}
            <div className="grid grid-cols-2 gap-4 mt-6 sm:grid-cols-4">
              {[
                { label: "Open Complaints",  value: openComplaints.length, icon: MessageSquareWarning, bad: openComplaints.length > 0 },
                { label: "Critical Issues",  value: critical.length,       icon: AlertTriangle,        bad: critical.length > 0 },
                { label: "Avg Review Rating",value: avgRating > 0 ? `${avgRating}/10` : "—", icon: Star, bad: avgRating > 0 && avgRating < 7 },
                { label: "Active Alerts",    value: alerts.length,         icon: TrendingDown,         bad: alerts.length > 0 },
              ].map(({ label, value, icon: Icon, bad }) => (
                <div key={label} className={cn("rounded-lg border p-3", bad ? "border-red-200 bg-red-50/40" : "border-border bg-muted/30")}>
                  <Icon className={cn("h-4 w-4 mb-1.5", bad ? "text-red-500" : "text-muted-foreground")} />
                  <p className={cn("text-2xl font-bold", bad ? "text-red-600" : "text-foreground")}>{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Complaint breakdown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquareWarning className="h-4 w-4" /> Complaints Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(["critical", "high", "medium", "low"] as const).map((sev) => {
                const count = complaints.filter((c) => c.severity === sev).length;
                const openCount = complaints.filter((c) => c.severity === sev && ["open", "pending"].includes(c.status)).length;
                if (count === 0) return null;
                return (
                  <div key={sev} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={sev} className="text-[10px] capitalize">{sev}</Badge>
                      <span className="text-foreground font-medium">{count} complaint{count !== 1 ? "s" : ""}</span>
                    </div>
                    {openCount > 0 && <span className="text-xs text-red-600 font-medium">{openCount} still open</span>}
                    {openCount === 0 && <span className="text-xs text-green-600">all resolved</span>}
                  </div>
                );
              })}
              {complaints.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No complaints in this period</p>}
              {/* Category breakdown */}
              {complaints.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">By category</p>
                  {Object.entries(
                    complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] ?? 0) + 1; return acc; }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-xs py-1">
                      <span className="text-muted-foreground capitalize">{cat.replace(/_/g, " ")}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review intelligence */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4" /> Review Intelligence — 30 Days</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Total",    value: reviews.length,  color: "text-foreground" },
                  { label: "Flagged",  value: flagged.length,  color: "text-orange-600" },
                  { label: "Negative", value: negative.length, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-2">
                    <p className={cn("text-xl font-bold", color)}>{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              {topKeywords.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Top flagged keywords</p>
                  <div className="space-y-1.5">
                    {topKeywords.map(([kw, count]) => (
                      <div key={kw} className="flex items-center justify-between text-xs">
                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-orange-700 font-medium">{kw}</span>
                        <span className="text-muted-foreground">{count} mention{count !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active alerts */}
          {alerts.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Active Alerts</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{alert.title}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {(alert.properties as unknown as { name: string } | null)?.name} · keyword: {alert.source_keyword} · {alert.mention_count} mentions
                        </p>
                      </div>
                      <Badge variant={alert.severity as "critical" | "high" | "medium"} className="text-[10px] shrink-0">{alert.severity}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground print:block">
          Bee Hospitality Audit Pro · {reportDate} · Confidential
        </p>
      </div>
    </>
  );
}
