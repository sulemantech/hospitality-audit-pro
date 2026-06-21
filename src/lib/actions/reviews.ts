"use server";

import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { pushReviewAlert } from "@/lib/notifications/push";

export interface ReviewImportRow {
  property_id: string;
  source: string;
  rating: number;
  raw_rating: number | null;
  reviewer_name: string | null;
  review_text: string;
  review_date: string;
}

export async function importReviews(rows: ReviewImportRow[]) {
  if (!rows.length) return { inserted: 0, skipped: 0, total: 0 };

  const supabase = createAdminClient();

  const withHash = rows.map((r) => ({
    ...r,
    content_hash: createHash("md5")
      .update(`${r.property_id}${r.source}${r.review_date}${r.review_text}`)
      .digest("hex"),
  }));

  const BATCH = 50;
  let totalInserted = 0;
  const insertedIds: string[] = [];

  for (let i = 0; i < withHash.length; i += BATCH) {
    const batch = withHash.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from("reviews")
      .upsert(batch, { onConflict: "content_hash", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    totalInserted += data?.length ?? 0;
    insertedIds.push(...(data?.map((r) => r.id) ?? []));
  }

  // Notify on newly inserted flagged negative reviews
  if (insertedIds.length > 0) {
    const { data: flagged } = await supabase
      .from("reviews")
      .select("rating, reviewer_name, flagged_keywords, properties(name)")
      .in("id", insertedIds)
      .eq("sentiment", "negative")
      .gt("flag_count", 0)
      .order("flag_count", { ascending: false })
      .limit(3);

    if (flagged?.length) {
      // Send one notification per flagged review (max 3 to avoid spam)
      await Promise.allSettled(
        flagged.map((r) =>
          pushReviewAlert({
            propertyName: (r.properties as unknown as { name: string } | null)?.name ?? "Unknown",
            rating: Number(r.rating),
            keywords: r.flagged_keywords ?? [],
            reviewerName: r.reviewer_name,
          })
        )
      );
    }
  }

  return {
    inserted: totalInserted,
    skipped: rows.length - totalInserted,
    total: rows.length,
  };
}
