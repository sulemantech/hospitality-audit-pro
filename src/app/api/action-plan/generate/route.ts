export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generateActionPlan } from "@/lib/actions/action-plan";

// Make.com calls this every morning at 07:00
// Manual test: POST /api/action-plan/generate
// Body (optional): { "property_id": "uuid" }   — omit for all-property plan

export async function POST(req: Request) {
  let body: { property_id?: string } = {};
  try { body = await req.json(); } catch { /* body is optional */ }

  const result = await generateActionPlan(body.property_id ?? undefined);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({
    success: true,
    plan_id: result.plan.id,
    tasks: result.plan.tasks.length,
    summary: result.plan.summary,
    generated_at: result.plan.generated_at,
  });
}
