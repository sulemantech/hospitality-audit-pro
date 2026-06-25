import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProperties } from "@/lib/supabase/queries/complaints";
import { PropertyEditor } from "@/components/settings/PropertyEditor";
import { Building2, Bell, Shield, Users, Zap, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const properties = await getProperties();

  return (
    <>
      <Header title="Settings" subtitle="Manage properties, team access, and system configuration" />
      <div className="p-6 space-y-6 animate-fade-in max-w-3xl">

        {/* Properties CRUD */}
        <Card>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Properties
              </CardTitle>
              <Badge variant="positive" className="text-[10px]">{properties.length} active</Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Update property names, types, locations, and room counts. Changes reflect immediately across all dropdowns.
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <PropertyEditor properties={properties} />
          </CardContent>
        </Card>

        {/* Roadmap sections */}
        <div className="space-y-2">
          {[
            {
              icon: Users,
              title: "Team & Access",
              description: "Invite staff by email, assign roles (Admin, Manager, Front Desk, Viewer), revoke access",
              badge: "Coming soon",
            },
            {
              icon: Bell,
              title: "Alert Thresholds",
              description: "Configure how many keyword hits trigger a critical alert per property and per 30-day window",
              badge: "Coming soon",
            },
            {
              icon: Zap,
              title: "Integrations",
              description: "Auto-import reviews from Booking.com, Google My Business, and TripAdvisor",
              badge: "Coming soon",
            },
            {
              icon: Shield,
              title: "Security",
              description: "Two-factor authentication, session management, audit log export",
              badge: "Coming soon",
            },
          ].map(({ icon: Icon, title, description, badge }) => (
            <Card key={title} className="opacity-75">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-lg bg-muted p-2.5 shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <Badge variant="neutral" className="text-[10px] py-0">{badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-xs">
            {[
              { label: "Version",     value: "1.0.0-beta" },
              { label: "Environment", value: "Production" },
              { label: "Database",    value: "Supabase PostgreSQL" },
              { label: "Hosting",     value: "Vercel Hobby" },
              { label: "Properties",  value: `${properties.length} active` },
              { label: "Last updated",value: new Date().toLocaleDateString("en-GB") },
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
