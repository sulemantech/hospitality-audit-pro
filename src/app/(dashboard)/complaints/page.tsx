import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getComplaints, getComplaintStats, getProperties } from "@/lib/supabase/queries/complaints";
import { formatRelativeDate, cn } from "@/lib/utils";
import { ComplaintFilters } from "@/components/complaints/ComplaintFilters";
import {
  AlertTriangle, Clock, CheckCircle2, Plus, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { ComplaintCategory, ComplaintSeverity, ComplaintStatus } from "@/types";

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4 text-red-500" />,
  high: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  medium: <Clock className="h-4 w-4 text-amber-400" />,
  low: <Clock className="h-4 w-4 text-muted-foreground" />,
};

interface PageProps {
  searchParams: {
    property?: string;
    status?: string;
    severity?: string;
    category?: string;
    search?: string;
    page?: string;
  };
}

export default async function ComplaintsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const filters = {
    property_id: searchParams.property,
    status: searchParams.status as ComplaintStatus | undefined,
    severity: searchParams.severity as ComplaintSeverity | undefined,
    category: searchParams.category as ComplaintCategory | undefined,
    search: searchParams.search,
    page,
    per_page: 20,
  };

  const [{ data: complaints, count }, stats, properties] = await Promise.all([
    getComplaints(filters),
    getComplaintStats(),
    getProperties(),
  ]);

  const totalPages = Math.ceil((count ?? 0) / 20);
  const hasFilters = !!(searchParams.property || searchParams.status || searchParams.severity || searchParams.category || searchParams.search);

  return (
    <>
      <Header
        title="Complaints"
        subtitle={`${stats.total_active} active · ${stats.critical_open} critical`}
      />

      <div className="p-6 space-y-4 animate-fade-in">

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Open", value: stats.total_open, color: "text-orange-600 bg-orange-50 border-orange-200" },
            { label: "Pending", value: stats.total_pending, color: "text-blue-600 bg-blue-50 border-blue-200" },
            { label: "Critical", value: stats.critical_open, color: "text-red-600 bg-red-50 border-red-200" },
            { label: "Total Active", value: stats.total_active, color: "text-foreground bg-muted border-border" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg border px-4 py-3 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <ComplaintFilters properties={properties} searchParams={searchParams} />
          <Button asChild size="sm" className="shrink-0">
            <Link href="/complaints/new">
              <Plus className="h-4 w-4" /> Log Complaint
            </Link>
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {complaints.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  {hasFilters ? "No complaints match your filters" : "No complaints yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasFilters ? "Try clearing some filters" : "When staff log complaints, they'll appear here"}
                </p>
              </div>
            ) : (
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
                      const prop = c.properties as unknown as { name: string } | null;
                      return (
                        <tr
                          key={c.id}
                          className={cn(
                            "hover:bg-muted/30 transition-colors cursor-pointer",
                            c.severity === "critical" && c.status !== "resolved" && c.status !== "closed"
                              ? "bg-red-50/50 hover:bg-red-50"
                              : ""
                          )}
                          onClick={() => { window.location.href = `/complaints/${c.id}`; }}
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
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, count ?? 0)} of {count} complaints</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild>
                <Link href={`/complaints?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Link>
              </Button>
              <span>Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
                <Link href={`/complaints?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}>
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
