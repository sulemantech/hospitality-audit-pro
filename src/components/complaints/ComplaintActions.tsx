"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, ArrowUpCircle, XCircle, Loader2 } from "lucide-react";

interface Props { complaintId: string; currentStatus: string; }

export function ComplaintActions({ complaintId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function transition(
    newStatus: string,
    action: string,
    note: string,
    extraFields: Record<string, unknown> = {}
  ) {
    setLoading(newStatus);
    const supabase = createClient();
    await supabase.from("complaints").update({ status: newStatus, ...extraFields }).eq("id", complaintId);
    await supabase.from("complaint_updates").insert({
      complaint_id: complaintId, author: "Staff", action, note,
    });
    setLoading(null);
    router.refresh();
  }

  if (currentStatus === "resolved" || currentStatus === "closed") {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        {currentStatus === "resolved" ? "Resolved" : "Closed"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {currentStatus === "open" && (
        <Button
          size="sm" variant="outline" className="h-8 text-xs"
          disabled={!!loading}
          onClick={() => transition("pending", "updated", "Status changed to Pending — under investigation.")}
        >
          {loading === "pending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <ArrowUpCircle className="h-3.5 w-3.5" /> Mark Pending
        </Button>
      )}
      <Button
        size="sm" className="h-8 text-xs bg-green-700 hover:bg-green-800"
        disabled={!!loading}
        onClick={() => transition("resolved", "resolved", "Complaint marked as resolved.", { resolved_at: new Date().toISOString() })}
      >
        {loading === "resolved" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
      </Button>
      <Button
        size="sm" variant="outline" className="h-8 text-xs text-muted-foreground"
        disabled={!!loading}
        onClick={() => transition("closed", "closed", "Complaint closed without full resolution.", { resolved_at: new Date().toISOString() })}
      >
        {loading === "closed" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <XCircle className="h-3.5 w-3.5" /> Close
      </Button>
    </div>
  );
}
