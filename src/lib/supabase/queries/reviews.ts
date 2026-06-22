import { createAdminClient } from "@/lib/supabase/server";

export interface ReviewFilters {
  propertyId?: string;
  source?: string;
  sentiment?: string;
  minRating?: number;
  flagged?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getReviews(filters: ReviewFilters = {}) {
  const supabase = createAdminClient();
  const { propertyId, source, sentiment, minRating, flagged, search, page = 1, pageSize = 25 } = filters;

  let query = supabase
    .from("reviews")
    .select(
      `id, property_id, source, rating, reviewer_name, review_text,
       review_date, flagged_keywords, flag_count, sentiment, sentiment_score,
       imported_at, ai_summary, ai_severity, ai_emotion, ai_topics,
       ai_action, ai_systemic_risk, ai_analyzed_at,
       properties(id, name, type)`,
      { count: "exact" }
    )
    .order("review_date", { ascending: false });

  if (propertyId) query = query.eq("property_id", propertyId);
  if (source) query = query.eq("source", source);
  if (sentiment) query = query.eq("sentiment", sentiment);
  if (minRating) query = query.gte("rating", minRating);
  if (flagged) query = query.gt("flag_count", 0);
  if (search) query = query.ilike("review_text", `%${search}%`);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { reviews: data ?? [], total: count ?? 0 };
}

export async function getReviewStats(propertyId?: string) {
  const supabase = createAdminClient();
  let query = supabase.from("reviews").select("rating, sentiment, flag_count");
  if (propertyId) query = query.eq("property_id", propertyId);
  const { data } = await query;
  const rows = (data ?? []) as Array<{ rating: number; sentiment: string; flag_count: number }>;

  const total = rows.length;
  const avgRating =
    total > 0
      ? Math.round((rows.reduce((s, r) => s + Number(r.rating), 0) / total) * 10) / 10
      : 0;
  const flagged = rows.filter((r) => r.flag_count > 0).length;
  const negative = rows.filter((r) => r.sentiment === "negative").length;
  const positive = rows.filter((r) => r.sentiment === "positive").length;

  return { total, avgRating, flagged, negative, positive };
}

export async function getReviewAnalytics(propertyId?: string) {
  const supabase = createAdminClient();

  // 1. Keyword hits from view
  let kwQuery = supabase
    .from("keyword_hit_counts")
    .select("property_id, property_name, keyword, category, severity, hit_count_30d, threshold")
    .gt("hit_count_30d", 0)
    .order("hit_count_30d", { ascending: false })
    .limit(30);
  if (propertyId) kwQuery = kwQuery.eq("property_id", propertyId);
  const { data: kwData } = await kwQuery;

  // 2. Per-property sentiment + rating breakdown
  let sentQuery = supabase
    .from("reviews")
    .select("property_id, sentiment, rating, properties(name)");
  if (propertyId) sentQuery = sentQuery.eq("property_id", propertyId);
  const { data: sentData } = await sentQuery;

  const stats = await getReviewStats(propertyId);

  const rows = (sentData ?? []) as Array<{
    property_id: string;
    sentiment: string;
    rating: number;
    properties: unknown;
  }>;

  const byProp: Record<string, { name: string; positive: number; neutral: number; negative: number; ratings: number[] }> = {};
  rows.forEach((r) => {
    const pid = r.property_id;
    const name = (r.properties as { name: string } | null)?.name ?? pid;
    if (!byProp[pid]) byProp[pid] = { name, positive: 0, neutral: 0, negative: 0, ratings: [] };
    if (r.sentiment === "positive") byProp[pid].positive++;
    else if (r.sentiment === "negative") byProp[pid].negative++;
    else byProp[pid].neutral++;
    byProp[pid].ratings.push(Number(r.rating));
  });

  const propertyBreakdown = Object.entries(byProp)
    .map(([id, d]) => ({
      property_id: id,
      property_name: d.name,
      positive: d.positive,
      neutral: d.neutral,
      negative: d.negative,
      total: d.positive + d.neutral + d.negative,
      avg_rating:
        d.ratings.length > 0
          ? Math.round((d.ratings.reduce((s, v) => s + v, 0) / d.ratings.length) * 10) / 10
          : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const allRatings = rows.map((r) => Number(r.rating));
  const ratingBuckets = [
    { label: "9–10", count: allRatings.filter((r) => r >= 9).length },
    { label: "7–8", count: allRatings.filter((r) => r >= 7 && r < 9).length },
    { label: "5–6", count: allRatings.filter((r) => r >= 5 && r < 7).length },
    { label: "1–4", count: allRatings.filter((r) => r < 5).length },
  ];

  return { stats, keywords: kwData ?? [], propertyBreakdown, ratingBuckets };
}
