import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function ActionPlanPage() {
  return (
    <>
      <Header title="Action Plan" subtitle="Prioritised operational tasks generated from complaints, reviews and financial data" />
      <div className="p-6 animate-fade-in">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-xl bg-muted p-4 mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Action Plan Generator</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Sprint 2 · W2-8 — Rule-based action item engine coming next.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
