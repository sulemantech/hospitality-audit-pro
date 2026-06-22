"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
      <Printer className="h-3.5 w-3.5" /> Print Report
    </Button>
  );
}
