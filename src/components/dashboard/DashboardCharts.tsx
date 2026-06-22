"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ── Shared constants ──────────────────────────────────────────────────────────
const TICK  = { fontSize: 10, fill: "hsl(220 9% 52%)" };
const GRID  = "hsl(220 13% 91%)";
const CATS  = ["#DC2626", "#EA580C", "#D97706", "#2563EB", "#7C3AED", "#0891B2"];

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTip({
  active, payload, label, fmt,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  fmt?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-bold text-foreground pl-3">
            {fmt ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ChartData {
  complaintTrend:    Array<{ date: string; count: number }>;
  categoryBreakdown: Array<{ name: string; count: number }>;
  ratingTrend:       Array<{ week: string; avg: number }>;
}

// ── Empty placeholder ─────────────────────────────────────────────────────────
function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function DashboardCharts({ data }: { data: ChartData }) {
  const hasComplaints  = data.complaintTrend.some((d) => d.count > 0);
  const hasCategories  = data.categoryBreakdown.length > 0;
  const hasRatings     = data.ratingTrend.length > 0;

  return (
    <div className="space-y-5">

      {/* ── Complaint Activity — 14-day area chart ─────────────── */}
      <Card>
        <CardHeader className="pb-1">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Complaint Activity</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Daily new complaints · last 14 days
              </p>
            </div>
            {hasComplaints && (
              <span className="text-[11px] font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                {data.complaintTrend.reduce((s, d) => s + d.count, 0)} total
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          {hasComplaints ? (
            <ResponsiveContainer width="100%" height={155}>
              <AreaChart data={data.complaintTrend} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-complaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7C3AED" stopOpacity={0.20} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="count" name="Complaints"
                  stroke="#7C3AED" strokeWidth={2}
                  fill="url(#g-complaints)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#7C3AED", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[155px]">
              <Empty label="No complaints logged in the last 14 days" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom row: category bar + rating trend ────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">

        {/* Category breakdown — horizontal bar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-1">
            <CardTitle>Top Issue Categories</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Last 14 days · by complaint volume</p>
          </CardHeader>
          <CardContent className="pt-3">
            {hasCategories ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={data.categoryBreakdown}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                  <XAxis
                    type="number" tick={TICK} axisLine={false} tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category" dataKey="name" tick={TICK}
                    axisLine={false} tickLine={false} width={80}
                  />
                  <Tooltip
                    content={<ChartTip />}
                    cursor={{ fill: "hsl(40 15% 96%)" }}
                  />
                  <Bar dataKey="count" name="Complaints" radius={[0, 5, 5, 0]} maxBarSize={20}>
                    {data.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={CATS[i] ?? "#7C3AED"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[210px]">
                <Empty label="No category data yet" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review rating trend — line chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle>Review Rating Trend</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Weekly average · out of 10</p>
          </CardHeader>
          <CardContent className="pt-3">
            {hasRatings ? (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={data.ratingTrend} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="week" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={TICK} axisLine={false} tickLine={false} />
                  <ReferenceLine
                    y={7}
                    stroke="#16A34A"
                    strokeDasharray="5 3"
                    strokeWidth={1.5}
                    label={{
                      value: "7.0 target",
                      position: "insideTopRight",
                      fontSize: 9,
                      fill: "#16A34A",
                      dy: -7,
                    }}
                  />
                  <Tooltip
                    content={<ChartTip fmt={(v) => `${v} / 10`} />}
                    cursor={{ stroke: GRID, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone" dataKey="avg" name="Avg Rating"
                    stroke="#C4891A" strokeWidth={2.5}
                    dot={{ fill: "#C4891A", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#C4891A", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[210px]">
                <Empty label="No review rating data yet" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
