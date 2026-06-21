const NTFY_TOPIC = process.env.NTFY_TOPIC ?? "bee-audit-alerts-2026";
const NTFY_URL = `https://ntfy.sh/${NTFY_TOPIC}`;

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
    await fetch(NTFY_URL, {
      method: "POST",
      headers: {
        "Title": title,
        "Priority": priority,
        "Tags": tags.join(","),
        "Content-Type": "text/plain",
      },
      body: message,
    });
  } catch {
    // Never block the main flow if push fails
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
