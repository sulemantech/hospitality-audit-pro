import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ActionPlanClient } from "@/components/action-plan/ActionPlanClient";
import { createAdminClient } from "@/lib/supabase/server";
import { getProperties } from "@/lib/supabase/queries/complaints";
import { getLatestActionPlan } from "@/lib/supabase/queries/action-plan";

export const dynamic = "force-dynamic";

async function getActionPlanContext(propertyId?: string) {
  const supabase = createAdminClient();

  let complaintsQ = supabase
    .from("complaints")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "pending"]);
  if (propertyId) complaintsQ = complaintsQ.eq("property_id", propertyId);

  let alertsQ = supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  if (propertyId) alertsQ = alertsQ.eq("property_id", propertyId);

  let reviewsQ = supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("sentiment", "negative")
    .gt("flag_count", 0)
    .gte("review_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  if (propertyId) reviewsQ = reviewsQ.eq("property_id", propertyId);

  const [{ count: complaints }, { count: alerts }, { count: reviews }] = await Promise.all([
    complaintsQ, alertsQ, reviewsQ,
  ]);

  return {
    openComplaints: complaints ?? 0,
    activeAlerts: alerts ?? 0,
    flaggedReviews: reviews ?? 0,
  };
}

export default async function ActionPlanPage({
  searchParams,
}: {
  searchParams: { property?: string };
}) {
  const propertyId = searchParams.property;

  const [context, properties, initialPlan] = await Promise.all([
    getActionPlanContext(propertyId),
    getProperties(),
    getLatestActionPlan(propertyId),
  ]);

  const selectedProperty = propertyId
    ? properties.find((p) => p.id === propertyId)
    : undefined;

  return (
    <>
      <Header
        title="Action Plan"
        subtitle="AI-generated prioritised tasks from complaints, alerts, and review patterns"
      />
      <div className="p-6 max-w-3xl animate-fade-in">
        <Suspense fallback={<div className="h-40 rounded-lg bg-muted animate-pulse" />}>
          <ActionPlanClient
            propertyId={propertyId}
            propertyName={selectedProperty?.name}
            openComplaints={context.openComplaints}
            activeAlerts={context.activeAlerts}
            flaggedReviews={context.flaggedReviews}
            initialPlan={initialPlan}
          />
        </Suspense>
      </div>
    </>
  );
}
