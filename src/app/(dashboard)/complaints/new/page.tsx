export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/Header";
import { NewComplaintForm } from "@/components/complaints/NewComplaintForm";
import { getProperties } from "@/lib/supabase/queries/complaints";

export default async function NewComplaintPage() {
  const properties = await getProperties();
  return (
    <>
      <Header title="Log New Complaint" subtitle="Record a guest complaint across any property" />
      <div className="p-6 max-w-2xl animate-fade-in">
        <NewComplaintForm properties={properties} />
      </div>
    </>
  );
}
