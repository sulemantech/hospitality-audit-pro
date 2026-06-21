"use client";

import { useState } from "react";
import { formatRelativeDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, MessageSquare, AlertTriangle, User, FileText } from "lucide-react";

interface Update {
  id: string;
  author: string;
  action: string;
  note: string | null;
  created_at: string;
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  logged: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
  updated: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
  note: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
  escalated: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />,
  assigned: <User className="h-3.5 w-3.5 text-purple-500" />,
  resolved: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  closed: <CheckCircle2 className="h-3.5 w-3.5 text-stone-400" />,
};

const ACTION_LABEL: Record<string, string> = {
  logged: "Logged complaint",
  updated: "Added update",
  note: "Added note",
  escalated: "Escalated",
  assigned: "Assigned",
  resolved: "Marked resolved",
  closed: "Closed",
};

export function ComplaintTimeline({ updates, complaintId }: { updates: Update[]; complaintId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addNote() {
    if (!note.trim()) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("complaint_updates").insert({
      complaint_id: complaintId,
      author: "Staff", // will be replaced with auth user
      action: "note",
      note: note.trim(),
    });
    if (err) { setError(err.message); setSubmitting(false); return; }
    setNote("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {updates.map((u) => (
            <div key={u.id} className="relative flex gap-4 pl-8">
              <div className="absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card">
                {ACTION_ICON[u.action] ?? <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">{u.author}</span>
                  <span className="text-xs text-muted-foreground">{ACTION_LABEL[u.action] ?? u.action}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{formatRelativeDate(u.created_at)}</span>
                </div>
                {u.note && (
                  <p className="mt-1 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-border">
                    {u.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add note */}
      <div className="pt-2 border-t border-border space-y-2">
        <p className="text-xs font-medium text-foreground">Add update or note</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add a note, action taken, or update for the timeline…"
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button size="sm" onClick={addNote} disabled={submitting || !note.trim()}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitting ? "Saving…" : "Add Note"}
        </Button>
      </div>
    </div>
  );
}
