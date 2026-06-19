import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

export default function FinancialsPage() {
  return (
    <>
      <Header title="Financial Tracker" subtitle="OTA commission leakage and supplier price benchmarking" />
      <div className="p-6 animate-fade-in">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-xl bg-muted p-4 mb-4">
              <TrendingDown className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Financial Leak Tracker</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Sprint 3 · W3-1 — OTA commission tracker and supplier benchmarking coming next.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
