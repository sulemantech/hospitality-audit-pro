import { createAdminClient } from "@/lib/supabase/server";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: "critical" | "high" | "medium" | "info";
  time: string;
  read: boolean;
}

function relativeTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export async function getRecentNotifications(): Promise<AppNotification[]> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: alerts }, { data: complaints }] = await Promise.all([
    supabase
      .from("alerts")
      .select("id, title, message, severity, created_at")
      .eq("status", "active")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("complaints")
      .select("id, category, severity, description, created_at, properties(name)")
      .in("status", ["open", "pending"])
      .in("severity", ["critical", "high"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const notifs: AppNotification[] = [];

  for (const a of alerts ?? []) {
    notifs.push({
      id: `alert-${a.id}`,
      title: a.title,
      description: (a as { message?: string | null }).message ?? "Review keyword alert triggered",
      type: (a.severity as "critical" | "high" | "medium") ?? "medium",
      time: relativeTime(a.created_at),
      read: false,
    });
  }

  for (const c of complaints ?? []) {
    const propName = (c.properties as unknown as { name: string } | null)?.name ?? "Unknown";
    const label = c.severity === "critical" ? "Critical" : "High";
    notifs.push({
      id: `complaint-${c.id}`,
      title: `${label} complaint — ${String(c.category).replace(/_/g, " ")}`,
      description: `${propName} · ${String(c.description).slice(0, 80)}${c.description.length > 80 ? "…" : ""}`,
      type: c.severity as "critical" | "high",
      time: relativeTime(c.created_at),
      read: false,
    });
  }

  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, info: 3 };
  return notifs
    .sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3))
    .slice(0, 6);
}
