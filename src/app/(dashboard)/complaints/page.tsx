export const dynamic = "force-dynamic";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getComplaints, getComplaintStats, getProperties } from "@/lib/supabase/queries/complaints";
import { ComplaintFilters } from "@/components/complaints/ComplaintFilters";
import { ComplaintsTable } from "@/components/complaints/ComplaintsTable";
import { CheckCircle2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import type { ComplaintCategory, ComplaintSeverity, ComplaintStatus } from "@/types";


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
              <ComplaintsTable complaints={complaints as Parameters<typeof ComplaintsTable>[0]["complaints"]} />
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
