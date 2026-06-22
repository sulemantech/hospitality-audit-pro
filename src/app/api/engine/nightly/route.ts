export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { analyzeUnprocessedReviews } from "@/lib/actions/analyze-reviews";
import { sendPush } from "@/lib/notifications/push";

// Make.com calls this every night at 3am
// Manual test: GET /api/engine/nightly

export async function GET() {
  const started = Date.now();
  console.log("[nightly-engine] Starting run");

  try {
    // AI-analyze up to 12 unprocessed reviews (safe within Vercel 60s timeout)
    const result = await analyzeUnprocessedReviews(12);

    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`[nightly-engine] Done in ${elapsed}s — processed: ${result.processed}, failed: ${result.failed}`);

    // Send a push summary only if there was something meaningful to report
    if (result.processed > 0) {
      await sendPush({
        title: "Nightly engine complete",
        message: `${result.processed} review${result.processed !== 1 ? "s" : ""} analyzed by AI${result.failed > 0 ? ` · ${result.failed} failed` : ""}. Insights ready in dashboard.`,
        priority: "low",
        tags: ["robot"],
      });
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      skipped: result.skipped,
      elapsed_seconds: parseFloat(elapsed),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Nightly engine error";
    console.error("[nightly-engine]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
