"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logComplaint } from "@/lib/actions/complaints";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

const HOSTEL_CATEGORIES = ["cleanliness", "maintenance", "noise", "staff", "facilities", "pest", "safety", "billing", "other"];
const HOTEL_CATEGORIES = ["cleanliness", "maintenance", "noise", "staff", "facilities", "pest", "safety", "billing", "other"];

const schema = z.object({
  property_id: z.string().min(1, "Select a property"),
  room_number: z.string().optional(),
  guest_name: z.string().optional(),
  category: z.enum(["cleanliness", "maintenance", "noise", "staff", "facilities", "pest", "safety", "billing", "other"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  source: z.enum(["guest_report", "staff_observation", "review"]),
  description: z.string().min(20, "Description must be at least 20 characters"),
  reported_by: z.string().min(2, "Enter your name"),
  assigned_to: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Property { id: string; name: string; type: string; }

const SEVERITY_COLOURS: Record<string, string> = {
  critical: "border-red-300 bg-red-50 text-red-700",
  high: "border-orange-300 bg-orange-50 text-orange-700",
  medium: "border-amber-300 bg-amber-50 text-amber-700",
  low: "border-stone-300 bg-stone-50 text-stone-700",
};

export function NewComplaintForm({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { severity: "medium", source: "guest_report", category: "cleanliness" },
  });

  const selectedSeverity = watch("severity");
  const selectedPropertyId = watch("property_id");
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const categories = selectedProperty?.type === "hostel" ? HOSTEL_CATEGORIES : HOTEL_CATEGORIES;

  async function onSubmit(data: FormData) {
    setServerError(null);
    const result = await logComplaint(data);
    if (!result.success) { setServerError(result.error ?? "Failed to log complaint"); return; }
    setSuccess(true);
    setTimeout(() => router.push("/complaints"), 1200);
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-base font-semibold text-foreground">Complaint logged successfully</h3>
          <p className="text-sm text-muted-foreground mt-1">Redirecting to complaints list…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Property + Room */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold text-foreground">Location</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-foreground">Property <span className="text-red-500">*</span></label>
            <select
              {...register("property_id")}
              className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select property…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.property_id && <p className="text-xs text-destructive">{errors.property_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Room / Bed / Area</label>
            <Input {...register("room_number")} placeholder="e.g. 204, Dorm 6B, Pool" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Guest name</label>
            <Input {...register("guest_name")} placeholder="Optional" className="h-9" />
          </div>
        </CardContent>
      </Card>

      {/* Severity selector */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold text-foreground">Severity <span className="text-red-500">*</span></p>
          <p className="text-xs text-muted-foreground">Choose how urgent this is. Critical = immediate action required.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {(["critical", "high", "medium", "low"] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setValue("severity", sev)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs font-semibold capitalize ${
                  selectedSeverity === sev
                    ? SEVERITY_COLOURS[sev] + " ring-2 ring-offset-1 ring-current"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {sev === "critical" || sev === "high"
                  ? <AlertTriangle className="h-4 w-4" />
                  : <CheckCircle2 className="h-4 w-4" />}
                {sev}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category + Source */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold text-foreground">Classification</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Category <span className="text-red-500">*</span></label>
            <select
              {...register("category")}
              className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Source <span className="text-red-500">*</span></label>
            <select
              {...register("source")}
              className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="guest_report">Guest Report</option>
              <option value="staff_observation">Staff Observation</option>
              <option value="review">From Review</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold text-foreground">Description <span className="text-red-500">*</span></p>
          <p className="text-xs text-muted-foreground">Be specific — include what happened, where, and what the guest said. Min 20 characters.</p>
        </CardHeader>
        <CardContent>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="e.g. Guest in Room 12 reported what appears to be a bedbug on the mattress. Guest is very upset and requested an immediate room change…"
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
        </CardContent>
      </Card>

      {/* Staff info */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold text-foreground">Staff</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Logged by <span className="text-red-500">*</span></label>
            <Input {...register("reported_by")} placeholder="Your name" className="h-9" />
            {errors.reported_by && <p className="text-xs text-destructive">{errors.reported_by.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Assign to</label>
            <Input {...register("assigned_to")} placeholder="Name or department" className="h-9" />
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Logging…" : "Log Complaint"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
