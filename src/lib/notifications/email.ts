import { Resend } from "resend";

const FROM = "Bee Hospitality <onboarding@resend.dev>";
const ALERT_EMAIL = process.env.ALERT_EMAIL ?? "metafront.net@gmail.com";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[email] RESEND_API_KEY is not set — emails will fail");
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

export async function sendComplaintEmail({
  severity,
  category,
  propertyName,
  roomNumber,
  description,
  reportedBy,
  assignedTo,
}: {
  severity: string;
  category: string;
  propertyName: string;
  roomNumber?: string | null;
  description: string;
  reportedBy: string;
  assignedTo?: string | null;
}) {
  const colour = severity === "critical" ? "#dc2626" : severity === "high" ? "#ea580c" : "#d97706";
  const room = roomNumber ? `Room ${roomNumber} · ` : "";

  const result = await getResend().emails.send({
    from: FROM,
    to: ALERT_EMAIL,
    subject: `[${severity.toUpperCase()}] ${category} complaint — ${propertyName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:${colour};color:#fff;padding:12px 16px;border-radius:8px 8px 0 0">
          <strong>${severity.toUpperCase()} COMPLAINT — ${propertyName}</strong>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#6b7280;width:130px">Location</td><td><strong>${propertyName}</strong>${room ? ` · ${room}` : ""}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Category</td><td style="text-transform:capitalize">${category}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Logged by</td><td>${reportedBy}</td></tr>
            ${assignedTo ? `<tr><td style="padding:6px 0;color:#6b7280">Assigned to</td><td>${assignedTo}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Description</td><td style="line-height:1.6">${description}</td></tr>
          </table>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af">
            Bee Hospitality Audit Pro · ${new Date().toLocaleString("en-GB")}
          </div>
        </div>
      </div>
    `,
  });
  if (result.error) console.error("[email] Resend error sending complaint email:", result.error);
  else console.log(`[email] Complaint alert sent to ${ALERT_EMAIL} (id: ${result.data?.id})`);
}

export async function sendDailyDigest({
  openComplaints,
  criticalCount,
  flaggedReviews,
  activeAlerts,
  properties,
}: {
  openComplaints: number;
  criticalCount: number;
  flaggedReviews: number;
  activeAlerts: number;
  properties: { name: string; openComplaints: number; flaggedReviews: number }[];
}) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const statusColour = criticalCount > 0 ? "#dc2626" : openComplaints > 0 ? "#ea580c" : "#16a34a";
  const statusLabel = criticalCount > 0 ? "Action Required" : openComplaints > 0 ? "Needs Attention" : "All Clear";

  const propertyRows = properties.map((p) => `
    <tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:10px 8px;font-weight:500">${p.name}</td>
      <td style="padding:10px 8px;text-align:center;color:${p.openComplaints > 0 ? "#dc2626" : "#16a34a"}">${p.openComplaints}</td>
      <td style="padding:10px 8px;text-align:center;color:${p.flaggedReviews > 0 ? "#ea580c" : "#16a34a"}">${p.flaggedReviews}</td>
    </tr>
  `).join("");

  await resend.emails.send({
    from: FROM,
    to: ALERT_EMAIL,
    subject: `☀️ Morning Digest — ${today}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
          <div style="background:#1a1a2e;color:#fff;width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;text-align:center;line-height:40px">B</div>
          <div>
            <div style="font-weight:700;font-size:16px">Bee Hospitality Audit Pro</div>
            <div style="font-size:12px;color:#6b7280">Daily Operations Digest · ${today}</div>
          </div>
        </div>

        <div style="background:${statusColour};color:#fff;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-weight:600">
          ${statusLabel}
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
          ${[
            { label: "Open Complaints", value: openComplaints, bad: openComplaints > 0 },
            { label: "Critical Issues", value: criticalCount, bad: criticalCount > 0 },
            { label: "Flagged Reviews", value: flaggedReviews, bad: flaggedReviews > 0 },
            { label: "Active Alerts", value: activeAlerts, bad: activeAlerts > 0 },
          ].map(({ label, value, bad }) => `
            <div style="border:1px solid ${bad ? "#fecaca" : "#e5e7eb"};background:${bad ? "#fef2f2" : "#f9fafb"};border-radius:8px;padding:12px;text-align:center">
              <div style="font-size:24px;font-weight:700;color:${bad ? "#dc2626" : "#111827"}">${value}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:2px">${label}</div>
            </div>
          `).join("")}
        </div>

        <table style="width:100%;font-size:13px;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 8px;text-align:left;color:#6b7280;font-weight:500">Property</th>
              <th style="padding:10px 8px;text-align:center;color:#6b7280;font-weight:500">Open Complaints</th>
              <th style="padding:10px 8px;text-align:center;color:#6b7280;font-weight:500">Flagged Reviews</th>
            </tr>
          </thead>
          <tbody>${propertyRows}</tbody>
        </table>

        <div style="margin-top:20px;font-size:12px;color:#9ca3af;text-align:center">
          Bee Hospitality Group · Cyprus · Internal platform only
        </div>
      </div>
    `,
  });
}
