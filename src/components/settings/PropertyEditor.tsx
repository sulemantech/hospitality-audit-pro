"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { updateProperty } from "@/lib/actions/properties";
import { Building2, Pencil, Loader2, CheckCircle2, Hotel, Home } from "lucide-react";
import type { Property } from "@/types";

const schema = z.object({
  name:        z.string().min(2, "Name must be at least 2 characters"),
  type:        z.enum(["hotel", "hostel"]),
  location:    z.string().min(2, "Location is required"),
  total_rooms: z.coerce.number().int().min(1, "Must have at least 1 room"),
});

type FormData = z.infer<typeof schema>;

export function PropertyEditor({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  function openEdit(p: Property) {
    setEditing(p);
    setServerError(null);
    reset({ name: p.name, type: p.type, location: p.location, total_rooms: p.total_rooms });
  }

  async function onSubmit(data: FormData) {
    if (!editing) return;
    setSaving(true);
    setServerError(null);
    const result = await updateProperty(editing.id, data);
    setSaving(false);
    if (!result.success) { setServerError(result.error ?? "Failed to save"); return; }
    setSavedId(editing.id);
    setEditing(null);
    router.refresh();
    setTimeout(() => setSavedId(null), 2000);
  }

  return (
    <>
      <div className="divide-y divide-border">
        {properties.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 py-4 px-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {p.type === "hotel"
                  ? <Hotel className="h-4 w-4 text-primary" />
                  : <Home className="h-4 w-4 text-primary" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  {savedId === p.id && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {p.location || "—"} · {p.total_rooms} rooms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={p.type === "hotel" ? "neutral" : "info" as "neutral"} className="text-[10px] capitalize hidden sm:flex">
                {p.type}
              </Badge>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEdit(p)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(isOpen) => { if (!isOpen) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Edit Property
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Property name</label>
              <Input {...register("name")} placeholder="e.g. Bee Hostel Paphos" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Type</label>
              <select
                {...register("type")}
                className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="hotel">Hotel</option>
                <option value="hostel">Hostel</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Location / City</label>
              <Input {...register("location")} placeholder="e.g. Paphos, Cyprus" />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Total rooms / beds</label>
              <Input {...register("total_rooms")} type="number" min={1} placeholder="e.g. 24" />
              {errors.total_rooms && <p className="text-xs text-destructive">{errors.total_rooms.message}</p>}
            </div>

            {serverError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {serverError}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
