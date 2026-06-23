export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Lightweight keep-alive endpoint — point UptimeRobot here, NOT at /api/digest.
// Queries Supabase to prevent the free-tier DB from pausing; returns no emails or side-effects.
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({ ok: true, properties: count ?? 0, ts: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ping failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
