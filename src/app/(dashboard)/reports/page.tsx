import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <>
      <Header title="Reports" subtitle="Export operational summaries and audit reports" />
      <div className="p-6 animate-fade-in">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-xl bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Reports & Export</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Sprint 4 · W4-1 — PDF and CSV export coming in the final sprint.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
