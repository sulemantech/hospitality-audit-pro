export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendDailyDigest } from "@/lib/notifications/email";
import { sendPush } from "@/lib/notifications/push";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: properties },
      { count: openComplaints },
      { count: criticalCount },
      { count: flaggedReviews },
      { count: activeAlerts },
    ] = await Promise.all([
      supabase.from("properties").select("id, name"),
      supabase.from("complaints").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]),
      supabase.from("complaints").select("id", { count: "exact", head: true }).eq("severity", "critical").in("status", ["open", "pending"]),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("sentiment", "negative").gt("flag_count", 0).gte("review_date", yesterday.split("T")[0]),
      supabase.from("alerts").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    // Per-property breakdown
    const propertyStats = await Promise.all(
      (properties ?? []).map(async (p) => {
        const [{ count: oc }, { count: fr }] = await Promise.all([
          supabase.from("complaints").select("id", { count: "exact", head: true }).eq("property_id", p.id).in("status", ["open", "pending"]),
          supabase.from("reviews").select("id", { count: "exact", head: true }).eq("property_id", p.id).eq("sentiment", "negative").gt("flag_count", 0).gte("review_date", yesterday.split("T")[0]),
        ]);
        return { name: p.name, openComplaints: oc ?? 0, flaggedReviews: fr ?? 0 };
      })
    );

    await sendDailyDigest({
      openComplaints: openComplaints ?? 0,
      criticalCount: criticalCount ?? 0,
      flaggedReviews: flaggedReviews ?? 0,
      activeAlerts: activeAlerts ?? 0,
      properties: propertyStats,
    });

    // Also send a push summary
    await sendPush({
      title: "☀️ Morning Digest Ready",
      message: `${openComplaints ?? 0} open complaints · ${criticalCount ?? 0} critical · ${flaggedReviews ?? 0} flagged reviews · ${activeAlerts ?? 0} active alerts. Check your email for the full report.`,
      priority: (criticalCount ?? 0) > 0 ? "high" : "default",
      tags: ["calendar"],
    });

    return NextResponse.json({ success: true, sent_to: process.env.ALERT_EMAIL });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Digest error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
