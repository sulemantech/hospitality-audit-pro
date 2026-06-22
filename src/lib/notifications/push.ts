const NTFY_TOPIC = process.env.NTFY_TOPIC ?? "bee-audit-alerts-2026";

// ntfy priority numbers: 5=urgent, 4=high, 3=default, 2=low
const PRIORITY_NUM: Record<string, number> = { urgent: 5, high: 4, default: 3, low: 2 };

type Priority = "urgent" | "high" | "default" | "low";

export async function sendPush({
  title,
  message,
  priority = "default",
  tags = [],
}: {
  title: string;
  message: string;
  priority?: Priority;
  tags?: string[];
}) {
  try {
    // Use JSON body so Unicode/emoji in title/message work (header values are ASCII-only)
    const res = await fetch("https://ntfy.sh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: NTFY_TOPIC,
        title,
        message,
        priority: PRIORITY_NUM[priority] ?? 3,
        tags,
      }),
    });
    if (!res.ok) console.error(`[ntfy] HTTP ${res.status}:`, await res.text());
    else console.log(`[ntfy] Push sent: "${title}"`);
  } catch (err) {
    console.error("[ntfy] fetch failed:", err);
  }
}

export async function pushComplaintAlert({
  severity,
  category,
  propertyName,
  roomNumber,
  description,
  reportedBy,
}: {
  severity: string;
  category: string;
  propertyName: string;
  roomNumber?: string | null;
  description: string;
  reportedBy: string;
}) {
  const isCritical = severity === "critical";
  const priority: Priority = isCritical ? "urgent" : "high";
  const tag = isCritical ? "rotating_light" : "warning";
  const room = roomNumber ? ` · Room ${roomNumber}` : "";

  await sendPush({
    title: `${isCritical ? "🚨" : "⚠️"} ${severity.toUpperCase()} Complaint — ${propertyName}${room}`,
    message: `${category.charAt(0).toUpperCase() + category.slice(1)} complaint logged by ${reportedBy}.\n\n"${description.slice(0, 160)}${description.length > 160 ? "…" : ""}"`,
    priority,
    tags: [tag, category],
  });
}

export async function pushReviewAlert({
  propertyName,
  rating,
  keywords,
  reviewerName,
}: {
  propertyName: string;
  rating: number;
  keywords: string[];
  reviewerName?: string | null;
}) {
  await sendPush({
    title: `📣 Flagged Review — ${propertyName} · ${rating}/10`,
    message: `${reviewerName ? `${reviewerName} left a negative review` : "Negative review"} with flagged keywords: ${keywords.join(", ")}.\n\nRespond within 24 hours.`,
    priority: "high",
    tags: ["star", "warning"],
  });
}
