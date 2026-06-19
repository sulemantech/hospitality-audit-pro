import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  return (
    <>
      <Header title="Reviews" subtitle="Import and analyse guest reviews across OTA channels" />
      <div className="p-6 animate-fade-in">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-xl bg-muted p-4 mb-4">
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Review Analytics</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Sprint 2 · W2-5 — CSV import and keyword flagging coming next.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
