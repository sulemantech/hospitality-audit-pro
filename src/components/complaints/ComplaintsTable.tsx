"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { formatRelativeDate, cn } from "@/lib/utils";

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4 text-red-500" />,
  high:     <AlertTriangle className="h-4 w-4 text-orange-500" />,
  medium:   <Clock className="h-4 w-4 text-amber-400" />,
  low:      <Clock className="h-4 w-4 text-muted-foreground" />,
};

interface Complaint {
  id: string;
  severity: string;
  status: string;
  category: string;
  description: string;
  room_number: string | null;
  guest_name: string | null;
  reported_by: string;
  created_at: string;
  properties: unknown;
}

export function ComplaintsTable({ complaints }: { complaints: Complaint[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {["", "Property · Room", "Category", "Description", "Severity", "Status", "Reported", "Age"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {complaints.map((c) => {
            const prop = c.properties as { name: string } | null;
            return (
              <tr
                key={c.id}
                className={cn(
                  "hover:bg-muted/30 transition-colors cursor-pointer",
                  c.severity === "critical" && c.status !== "resolved" && c.status !== "closed"
                    ? "bg-red-50/50 hover:bg-red-50" : ""
                )}
                onClick={() => router.push(`/complaints/${c.id}`)}
              >
                <td className="pl-4 py-3">{SEVERITY_ICON[c.severity]}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="font-medium text-foreground text-xs">{prop?.name}</p>
                  {c.room_number && <p className="text-[11px] text-muted-foreground">Rm {c.room_number}</p>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px] py-0 capitalize">{c.category}</Badge>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-xs text-foreground line-clamp-1">{c.description}</p>
                  {c.guest_name && <p className="text-[11px] text-muted-foreground mt-0.5">Guest: {c.guest_name}</p>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.severity as "critical" | "high" | "medium" | "low"} className="text-[10px] py-0 capitalize">
                    {c.severity}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.status as "open" | "pending" | "resolved" | "closed"} className="text-[10px] py-0 capitalize">
                    {c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{c.reported_by}</td>
                <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{formatRelativeDate(c.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
