"use server";

import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

export interface ReviewImportRow {
  property_id: string;
  source: string;
  rating: number;
  raw_rating: number | null;
  reviewer_name: string | null;
  review_text: string;
  review_date: string; // ISO date YYYY-MM-DD
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

  // Insert in batches of 50; ON CONFLICT (content_hash) → skip
  const BATCH = 50;
  let totalInserted = 0;

  for (let i = 0; i < withHash.length; i += BATCH) {
    const batch = withHash.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from("reviews")
      .upsert(batch, { onConflict: "content_hash", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    totalInserted += data?.length ?? 0;
  }

  return {
    inserted: totalInserted,
    skipped: rows.length - totalInserted,
    total: rows.length,
  };
}
