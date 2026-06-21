"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateActionPlan, updateTaskStatus } from "@/lib/actions/action-plan";
import { type SavedPlan, type SavedTask } from "@/lib/supabase/queries/action-plan";
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2,
  Clock, Building2, User, Calendar, RefreshCw, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_ORDER = ["critical", "high", "medium", "low"] as const;

const PRIORITY_STYLE: Record<string, { border: string; bg: string; badge: string; dot: string }> = {
  critical: { border: "border-red-200",    bg: "bg-red-50/40",    badge: "bg-red-100 text-red-700",      dot: "bg-red-500" },
  high:     { border: "border-orange-200", bg: "bg-orange-50/40", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  medium:   { border: "border-amber-200",  bg: "bg-amber-50/30",  badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-500" },
  low:      { border: "border-border",     bg: "",                badge: "bg-muted text-muted-foreground", dot: "bg-stone-400" },
};

const CATEGORY_ICON: Record<string, string> = {
  pest: "🐛", facilities: "🔧", cleanliness: "🧹", staff: "👥",
  maintenance: "⚙️", review_response: "💬", process: "📋", financial: "💰",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TaskCard({
  task,
  onStatusChange,
}: {
  task: SavedTask;
  onStatusChange: (id: string, status: "open" | "in_progress" | "done") => void;
}) {
  const isDone = task.status === "done";
  const style = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.low;
  const dueLabel = task.due_in_days === 0 ? "Today"
    : task.due_in_days === 1 ? "Tomorrow"
    : `${task.due_in_days} days`;

  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-2 transition-opacity",
      isDone ? "opacity-50 border-border bg-muted/20" : cn(style.border, style.bg)
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className={cn("text-base mt-0.5 shrink-0", isDone && "grayscale")}>{CATEGORY_ICON[task.category ?? ""] ?? "📌"}</span>
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold leading-snug", isDone ? "line-through text-muted-foreground" : "text-foreground")}>{task.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isDone && (
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", style.badge)}>
              {task.priority}
            </span>
          )}
          <button
            onClick={() => onStatusChange(task.id, isDone ? "open" : "done")}
            className={cn(
              "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
              isDone
                ? "border-green-500 bg-green-500 text-white"
                : "border-muted-foreground/30 hover:border-green-500"
            )}
            title={isDone ? "Mark as open" : "Mark as done"}
          >
            {isDone && <Check className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {!isDone && (
        <>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground border-t border-border/50">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {task.property_name}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {task.assigned_to}
            </span>
            <span className={cn("flex items-center gap-1 font-medium", (task.due_in_days ?? 99) <= 1 ? "text-red-600" : (task.due_in_days ?? 99) <= 5 ? "text-orange-600" : "")}>
              <Calendar className="h-3 w-3" /> Due: {dueLabel}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground italic border-t border-border/50 pt-1.5">
            💡 {task.reasoning}
          </p>
        </>
      )}
    </div>
  );
}

interface Props {
  propertyId?: string;
  propertyName?: string;
  openComplaints: number;
  activeAlerts: number;
  flaggedReviews: number;
  initialPlan: SavedPlan | null;
}

export function ActionPlanClient({
  propertyId, propertyName, openComplaints, activeAlerts, flaggedReviews, initialPlan,
}: Props) {
  const [plan, setPlan] = useState<SavedPlan | null>(initialPlan);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateActionPlan(propertyId, { openComplaints, activeAlerts, flaggedReviews });
      if (result.success) {
        setPlan(result.plan);
      } else {
        setError(result.error);
      }
    });
  }

  function handleStatusChange(taskId: string, status: "open" | "in_progress" | "done") {
    // Optimistic update
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status, completed_at: status === "done" ? new Date().toISOString() : null }
            : t
        ),
      };
    });
    // Persist in background
    updateTaskStatus(taskId, status);
  }

  const doneTasks = plan?.tasks.filter((t) => t.status === "done").length ?? 0;
  const totalTasks = plan?.tasks.length ?? 0;

  const grouped = plan
    ? PRIORITY_ORDER.map((p) => ({
        priority: p,
        tasks: plan.tasks.filter((t) => t.priority === p),
      })).filter((g) => g.tasks.length > 0)
    : [];

  return (
    <div className="space-y-5">

      {/* Context banner */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Open Complaints", value: openComplaints, icon: AlertTriangle, color: openComplaints > 0 ? "text-orange-500" : "text-muted-foreground" },
          { label: "Active Alerts",   value: activeAlerts,   icon: Clock,         color: activeAlerts > 0 ? "text-red-500" : "text-muted-foreground" },
          { label: "Flagged Reviews", value: flaggedReviews, icon: AlertTriangle, color: flaggedReviews > 0 ? "text-amber-500" : "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={cn("h-5 w-5 shrink-0", color)} />
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No plan yet */}
      {!plan && (
        <Card className="border-primary/20 bg-primary/3">
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <div className="rounded-xl bg-primary/10 p-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">AI Action Plan Generator</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Gemini analyses your open complaints, active alerts, and flagged reviews
                {propertyName ? ` for ${propertyName}` : " across all properties"} and
                generates a prioritised task list with owners and deadlines.
              </p>
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 max-w-md text-left">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            <Button onClick={handleGenerate} disabled={isPending} size="lg" className="gap-2 mt-1">
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing data…</>
                : <><Sparkles className="h-4 w-4" /> Generate Action Plan</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan exists */}
      {plan && (
        <>
          {/* Summary bar */}
          <Card className="border-primary/20 bg-primary/3">
            <CardContent className="p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">AI Summary</p>
                  <span className="text-[11px] text-muted-foreground">· Generated {timeAgo(plan.generated_at)}</span>
                  {totalTasks > 0 && (
                    <span className="text-[11px] font-medium text-green-600 ml-auto">
                      {doneTasks}/{totalTasks} done
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.summary}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={handleGenerate} disabled={isPending}>
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Regenerate
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Tasks by priority */}
          {grouped.map(({ priority, tasks }) => {
            const doneInGroup = tasks.filter((t) => t.status === "done").length;
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("h-2 w-2 rounded-full", PRIORITY_STYLE[priority].dot)} />
                  <h3 className="text-sm font-semibold text-foreground capitalize">{priority} Priority</h3>
                  <Badge variant="outline" className="text-[10px] py-0">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</Badge>
                  {doneInGroup > 0 && (
                    <span className="text-[11px] text-green-600 font-medium ml-auto">{doneInGroup} done</span>
                  )}
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* All done celebration */}
          {totalTasks > 0 && doneTasks === totalTasks && (
            <Card className="border-green-200 bg-green-50/40">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-800">All tasks complete!</p>
                  <p className="text-xs text-green-700">Regenerate when new issues arise.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
