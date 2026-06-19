import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getComplaintById, getComplaintUpdates } from "@/lib/supabase/queries/complaints";
import { ComplaintTimeline } from "@/components/complaints/ComplaintTimeline";
import { ComplaintActions } from "@/components/complaints/ComplaintActions";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import {
  ArrowLeft, Calendar, User, MapPin, Tag, Clock, AlertTriangle,
} from "lucide-react";

interface PageProps { params: { id: string } }

export default async function ComplaintDetailPage({ params }: PageProps) {
  const [complaint, updates] = await Promise.all([
    getComplaintById(params.id).catch(() => null),
    getComplaintUpdates(params.id),
  ]);

  if (!complaint) notFound();

  const prop = complaint.properties as { name: string; type: string; location: string } | null;

  const isOverSLA = complaint.sla_deadline && new Date(complaint.sla_deadline) < new Date()
    && !["resolved", "closed"].includes(complaint.status);

  const metaItems = [
    { icon: MapPin, label: "Property", value: prop?.name ?? "—" },
    { icon: Tag, label: "Category", value: complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1) },
    { icon: User, label: "Reported by", value: complaint.reported_by },
    { icon: User, label: "Assigned to", value: complaint.assigned_to ?? "Unassigned" },
    { icon: Calendar, label: "Logged", value: formatDate(complaint.created_at) },
    { icon: Clock, label: "SLA deadline", value: complaint.sla_deadline ? formatDate(complaint.sla_deadline) : "—" },
  ];

  return (
    <>
      <Header
        title={`Complaint · ${complaint.room_number ? `Room ${complaint.room_number}` : prop?.name ?? "—"}`}
        subtitle={`Logged ${formatRelativeDate(complaint.created_at)} · ${prop?.name}`}
      />

      <div className="p-6 space-y-5 max-w-4xl animate-fade-in">

        {/* Back */}
        <Button variant="ghost" size="sm" className="text-xs -ml-2" asChild>
          <Link href="/complaints"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to complaints</Link>
        </Button>

        {/* Header card */}
        <Card className={isOverSLA ? "border-red-300" : ""}>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={complaint.severity as "critical" | "high" | "medium" | "low"} className="capitalize">
                  {complaint.severity}
                </Badge>
                <Badge variant={complaint.status as "open" | "pending" | "resolved" | "closed"} className="capitalize">
                  {complaint.status}
                </Badge>
                {isOverSLA && (
                  <Badge variant="critical" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> SLA Overdue
                  </Badge>
                )}
                {complaint.guest_name && (
                  <span className="text-sm text-muted-foreground">Guest: <span className="font-medium text-foreground">{complaint.guest_name}</span></span>
                )}
              </div>
              <ComplaintActions complaintId={complaint.id} currentStatus={complaint.status} />
            </div>

            <p className="mt-4 text-sm text-foreground leading-relaxed">{complaint.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {metaItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-medium text-foreground capitalize">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ComplaintTimeline updates={updates} complaintId={complaint.id} />
          </CardContent>
        </Card>

      </div>
    </>
  );
}
