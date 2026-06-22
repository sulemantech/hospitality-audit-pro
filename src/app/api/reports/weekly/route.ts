export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { buildWeeklyReport, buildWeeklyReportHtml, BEE_BRAND } from "@/lib/reports/weekly";
import { getResendClient } from "@/lib/notifications/email";

const ALERT_EMAIL = process.env.ALERT_EMAIL ?? "metafront.net@gmail.com";

export async function GET() {
  try {
    const data = await buildWeeklyReport();
    const html = buildWeeklyReportHtml(data, BEE_BRAND);

    const resend = getResendClient();
    const result = await resend.emails.send({
      from: `${BEE_BRAND.name} <onboarding@resend.dev>`,
      to: ALERT_EMAIL,
      subject: `Weekly Report — ${data.period} · ${data.status}`,
      html,
    });

    if (result.error) {
      console.error("[weekly-report] Resend error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    console.log(`[weekly-report] Sent to ${ALERT_EMAIL} (id: ${result.data?.id})`);
    return NextResponse.json({
      success: true,
      period: data.period,
      status: data.status,
      sent_to: ALERT_EMAIL,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Report error";
    console.error("[weekly-report]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
