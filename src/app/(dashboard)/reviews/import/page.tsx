import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { getProperties } from "@/lib/supabase/queries/complaints";
import { ImportWizard } from "@/components/reviews/ImportWizard";
import { ArrowLeft } from "lucide-react";

export default async function ReviewImportPage() {
  const properties = await getProperties();
  return (
    <>
      <Header title="Import Reviews" subtitle="Paste or upload a CSV export from any OTA platform" />
      <div className="p-6 max-w-3xl animate-fade-in space-y-4">
        <Button variant="ghost" size="sm" className="text-xs -ml-2" asChild>
          <Link href="/reviews"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to reviews</Link>
        </Button>
        <ImportWizard properties={properties} />
      </div>
    </>
  );
}
