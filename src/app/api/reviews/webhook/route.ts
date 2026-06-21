import { NextRequest, NextResponse } from "next/server";
import { importReviews, type ReviewImportRow } from "@/lib/actions/reviews";
import { createAdminClient } from "@/lib/supabase/server";

// Make.com posts here when a new Google review is detected
// Expected body: { property_id, reviewer_name, rating, review_text, review_date, source }
export async function POST(req: NextRequest) {
  try {
    // Simple secret check to prevent abuse
    const secret = req.headers.get("x-webhook-secret");
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Support both single review and array
    const items: unknown[] = Array.isArray(body) ? body : [body];

    const supabase = createAdminClient();

    const rows: ReviewImportRow[] = [];
    for (const item of items) {
      const r = item as Record<string, unknown>;

      // Resolve property_id from name if only name provided
      let propertyId = r.property_id as string | undefined;
      if (!propertyId && r.property_name) {
        const { data } = await supabase
          .from("properties")
          .select("id")
          .ilike("name", `%${r.property_name}%`)
          .limit(1)
          .single();
        propertyId = data?.id;
      }

      if (!propertyId) continue;

      const rating = Number(r.rating ?? r.star_rating ?? 5);
      const normalised = rating <= 5 ? rating * 2 : rating;

      rows.push({
        property_id: propertyId,
        source: (r.source as string) ?? "google",
        rating: normalised,
        raw_rating: rating,
        reviewer_name: (r.reviewer_name as string) ?? null,
        review_text: (r.review_text ?? r.text ?? r.comment ?? "") as string,
        review_date: (r.review_date as string) ?? new Date().toISOString().split("T")[0],
      });
    }

    if (!rows.length) {
      return NextResponse.json({ message: "No valid rows", inserted: 0 });
    }

    const result = await importReviews(rows);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
