import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProperties } from "@/lib/supabase/queries/complaints";
import { Building2, Bell, Shield, Users, Zap, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    icon: Building2,
    title: "Properties",
    description: "Manage your 5 properties, room counts, and location details",
    badge: "5 active",
    badgeVariant: "positive" as const,
  },
  {
    icon: Users,
    title: "Team & Access",
    description: "Invite staff, assign roles (Admin, Manager, Front Desk, Viewer)",
    badge: "Coming soon",
    badgeVariant: "neutral" as const,
  },
  {
    icon: Bell,
    title: "Alert Thresholds",
    description: "Configure when keyword hits trigger alerts per property",
    badge: null,
    badgeVariant: null,
  },
  {
    icon: Zap,
    title: "Integrations",
    description: "Connect Booking.com, Google My Business, and TripAdvisor for auto-import",
    badge: "Coming soon",
    badgeVariant: "neutral" as const,
  },
  {
    icon: Shield,
    title: "Security",
    description: "Two-factor authentication, session management, audit log",
    badge: "Coming soon",
    badgeVariant: "neutral" as const,
  },
];

export default async function SettingsPage() {
  const properties = await getProperties();

  return (
    <>
      <Header title="Settings" subtitle="Manage properties, team access, and system configuration" />
      <div className="p-6 space-y-6 animate-fade-in max-w-3xl">

        {/* Settings nav */}
        <div className="space-y-2">
          {SECTIONS.map(({ icon: Icon, title, description, badge, badgeVariant }) => (
            <Card key={title} className="hover:shadow-card-hover transition-shadow cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-lg bg-primary/8 p-2.5 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    {badge && badgeVariant && (
                      <Badge variant={badgeVariant} className="text-[10px] py-0">{badge}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Properties list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.location} · {p.total_rooms} rooms</p>
                  </div>
                </div>
                <Badge variant={p.type as "hotel" | "hostel"} className="text-[10px]">{p.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">System Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-xs">
            {[
              { label: "Version", value: "1.0.0-beta" },
              { label: "Environment", value: "Production" },
              { label: "Database", value: "Supabase PostgreSQL" },
              { label: "Hosting", value: "Vercel" },
              { label: "Properties", value: `${properties.length} active` },
              { label: "Last updated", value: new Date().toLocaleDateString("en-GB") },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </>
  );
}
