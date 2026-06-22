import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getReviews, getReviewAnalytics } from "@/lib/supabase/queries/reviews";
import { getProperties } from "@/lib/supabase/queries/complaints";
import { ReviewFilters } from "@/components/reviews/ReviewFilters";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Star, Upload, AlertTriangle, TrendingUp, TrendingDown,
  MessageSquare, Flag,
} from "lucide-react";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  "booking.com": "Booking.com",
  google: "Google",
  tripadvisor: "TripAdvisor",
  airbnb: "Airbnb",
  expedia: "Expedia",
  direct: "Direct",
  other: "Other",
};

const SOURCE_COLOR: Record<string, string> = {
  "booking.com": "bg-blue-100 text-blue-700",
  google: "bg-red-100 text-red-700",
  tripadvisor: "bg-emerald-100 text-emerald-700",
  airbnb: "bg-rose-100 text-rose-700",
  expedia: "bg-yellow-100 text-yellow-700",
  direct: "bg-purple-100 text-purple-700",
  other: "bg-stone-100 text-stone-700",
};

function RatingBadge({ rating }: { rating: number }) {
  const r = Number(rating);
  const color =
    r >= 8.5 ? "bg-green-100 text-green-700" :
    r >= 7   ? "bg-emerald-100 text-emerald-700" :
    r >= 5   ? "bg-amber-100 text-amber-700" :
               "bg-red-100 text-red-700";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums", color)}>
      <Star className="h-3 w-3 fill-current" />
      {r.toFixed(1)}
    </span>
  );
}

interface PageProps {
  searchParams: {
    property?: string; source?: string; sentiment?: string;
    minRating?: string; flagged?: string; search?: string;
    page?: string; view?: string;
  };
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const view = searchParams.view ?? "reviews";
  const page = parseInt(searchParams.page ?? "1", 10);
  const pageSize = 25;

  const filters = {
    propertyId: searchParams.property,
    source: searchParams.source,
    sentiment: searchParams.sentiment,
    minRating: searchParams.minRating ? parseFloat(searchParams.minRating) : undefined,
    flagged: searchParams.flagged === "1",
    search: searchParams.search,
    page,
    pageSize,
  };

  const [{ reviews, total }, analytics, properties] = await Promise.all([
    getReviews(filters),
    getReviewAnalytics(searchParams.property),
    getProperties(),
  ]);

  const { stats, keywords, propertyBreakdown, ratingBuckets } = analytics;
  const totalPages = Math.ceil(total / pageSize);

  const buildUrl = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { ...searchParams, ...params };
    Object.entries(merged).forEach(([k, v]) => { if (v) sp.set(k, v); });
    return `/reviews?${sp.toString()}`;
  };

  return (
    <>
      <Header
        title="Reviews"
        subtitle="Guest reviews across all OTA channels · keyword-flagged on import"
      />

      <div className="p-6 space-y-5 animate-fade-in">

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Reviews", value: stats.total, icon: MessageSquare, color: "text-primary" },
            { label: "Avg Rating", value: `${stats.avgRating}/10`, icon: Star, color: "text-amber-600" },
            { label: "Flagged Reviews", value: stats.flagged, icon: Flag, color: "text-orange-500", link: buildUrl({ flagged: "1", view: "reviews", page: "1" }) },
            { label: "Negative", value: stats.negative, icon: TrendingDown, color: "text-destructive", link: buildUrl({ sentiment: "negative", view: "reviews", page: "1" }) },
          ].map(({ label, value, icon: Icon, color, link }) => (
            <Card key={label} className={link ? "hover:shadow-card-hover transition-shadow cursor-pointer" : ""}>
              <CardContent className="p-4">
                {link ? (
                  <Link href={link} className="block">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                    <p className={cn("text-2xl font-bold", color)}>{value}</p>
                  </Link>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                    <p className={cn("text-2xl font-bold", color)}>{value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab bar + Import button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {[
              { label: "All Reviews", value: "reviews" },
              { label: "Analytics", value: "analytics" },
            ].map((tab) => (
              <Link
                key={tab.value}
                href={buildUrl({ view: tab.value, page: "1" })}
                className={cn(
                  "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
                  view === tab.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <Button size="sm" asChild>
            <Link href="/reviews/import">
              <Upload className="h-3.5 w-3.5" /> Import Reviews
            </Link>
          </Button>
        </div>

        {view === "reviews" && (
          <>
            {/* Filters */}
            <Suspense fallback={<div className="h-9 rounded-md bg-muted animate-pulse" />}>
              <ReviewFilters properties={properties} />
            </Suspense>

            {/* Review list */}
            <div className="space-y-2">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No reviews match your filters.</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((r) => {
                  const prop = r.properties as unknown as { name: string; type: string } | null;
                  return (
                    <ReviewCard key={r.id} review={r} propName={prop?.name ?? "—"} />
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={buildUrl({ page: String(page - 1) })}>Previous</Link>
                    </Button>
                  )}
                  {page < totalPages && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={buildUrl({ page: String(page + 1) })}>Next</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {view === "analytics" && (
          <AnalyticsView
            propertyBreakdown={propertyBreakdown}
            keywords={keywords}
            ratingBuckets={ratingBuckets}
            stats={stats}
          />
        )}
      </div>
    </>
  );
}

// ─── Review Card ──────────────────────────────────────────────

interface ReviewRow {
  id: string; property_id: string; source: string; rating: number;
  reviewer_name: string | null; review_text: string; review_date: string;
  flagged_keywords: string[] | null; flag_count: number;
  sentiment: string | null; sentiment_score: number | null; imported_at: string;
  // AI fields — null until nightly engine runs
  ai_summary: string | null;
  ai_severity: string | null;
  ai_emotion: string | null;
  ai_topics: string[] | null;
  ai_action: string | null;
  ai_systemic_risk: boolean | null;
  ai_analyzed_at: string | null;
}

const EMOTION_EMOJI: Record<string, string> = {
  angry: "😡", frustrated: "😤", disappointed: "😞",
  neutral: "😐", satisfied: "🙂", delighted: "😄",
};

const AI_SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high:     "bg-orange-100 text-orange-700 border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border-amber-200",
  low:      "bg-stone-100 text-stone-600 border-stone-200",
  positive: "bg-green-100 text-green-700 border-green-200",
};

function ReviewCard({ review, propName }: { review: ReviewRow; propName: string }) {
  const flagged = review.flag_count > 0;
  const hasAI = !!review.ai_analyzed_at;
  const isNegativeAI = review.ai_severity === "critical" || review.ai_severity === "high";

  return (
    <Card className={cn(
      hasAI && isNegativeAI ? "border-orange-200" :
      flagged && review.sentiment === "negative" ? "border-orange-200 bg-orange-50/30" : ""
    )}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <RatingBadge rating={review.rating} />
            <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", SOURCE_COLOR[review.source] ?? SOURCE_COLOR.other)}>
              {SOURCE_LABEL[review.source] ?? review.source}
            </span>
            {/* Show AI severity if available, else keyword sentiment */}
            {hasAI && review.ai_severity ? (
              <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize", AI_SEVERITY_COLOR[review.ai_severity])}>
                {EMOTION_EMOJI[review.ai_emotion ?? ""] ?? ""} {review.ai_severity}
              </span>
            ) : (
              <Badge variant={review.sentiment as "positive" | "neutral" | "negative"} className="capitalize text-[11px]">
                {review.sentiment}
              </Badge>
            )}
            {review.ai_systemic_risk && (
              <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                systemic risk
              </span>
            )}
            {flagged && !hasAI && (
              <span className="flex items-center gap-1 text-[11px] text-orange-600 font-medium">
                <AlertTriangle className="h-3 w-3" />
                {review.flag_count} flag{review.flag_count > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <span className="font-medium text-foreground">{propName}</span>
            <span>·</span>
            <span>{formatDate(review.review_date)}</span>
            {review.reviewer_name && <span>· {review.reviewer_name}</span>}
          </div>
        </div>

        {/* AI insight block — shown when Gemini has analyzed the review */}
        {hasAI && review.ai_summary && (
          <div className={cn(
            "mt-3 rounded-lg border px-3 py-2.5",
            isNegativeAI ? "border-orange-200 bg-orange-50/60" : "border-green-200 bg-green-50/60"
          )}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              AI Analysis
            </p>
            <p className="text-sm text-foreground leading-snug">{review.ai_summary}</p>

            {/* Topics */}
            {(review.ai_topics?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(review.ai_topics ?? []).map((t) => (
                  <span key={t} className="rounded-full bg-white/80 border border-border px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Suggested action — only for high/critical */}
            {isNegativeAI && review.ai_action && (
              <div className="mt-2 pt-2 border-t border-orange-200/60">
                <p className="text-[11px] text-orange-800">
                  <span className="font-semibold">Action: </span>{review.ai_action}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Original review text */}
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {review.review_text}
        </p>

        {/* Keyword flags — only if no AI yet */}
        {!hasAI && flagged && (review.flagged_keywords?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(review.flagged_keywords ?? []).map((kw: string) => (
              <span key={kw} className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Pending AI badge */}
        {!hasAI && (
          <p className="mt-2 text-[10px] text-muted-foreground/60">AI analysis pending · runs nightly</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Analytics View ───────────────────────────────────────────

interface AnalyticsProps {
  propertyBreakdown: Array<{
    property_id: string; property_name: string;
    positive: number; neutral: number; negative: number;
    total: number; avg_rating: number;
  }>;
  keywords: Array<{
    keyword: string; category: string; severity: string;
    hit_count_30d: number; threshold: number; property_name: string;
  }>;
  ratingBuckets: Array<{ label: string; count: number }>;
  stats: { total: number; avgRating: number; flagged: number; negative: number; positive: number };
}

function AnalyticsView({ propertyBreakdown, keywords, ratingBuckets, stats }: AnalyticsProps) {
  const maxBucket = Math.max(...ratingBuckets.map((b) => b.count), 1);
  const positiveRate = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

      {/* Sentiment by property */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sentiment by Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {propertyBreakdown.map((p) => {
            const posW = p.total ? Math.round((p.positive / p.total) * 100) : 0;
            const neuW = p.total ? Math.round((p.neutral / p.total) * 100) : 0;
            const negW = p.total ? Math.round((p.negative / p.total) * 100) : 0;
            return (
              <div key={p.property_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground truncate max-w-[60%]">{p.property_name}</span>
                  <span className="text-xs text-muted-foreground">{p.avg_rating}/10 · {p.total} reviews</span>
                </div>
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
                  {posW > 0 && <div style={{ width: `${posW}%` }} className="bg-green-500 transition-all" title={`Positive: ${posW}%`} />}
                  {neuW > 0 && <div style={{ width: `${neuW}%` }} className="bg-stone-300 transition-all" title={`Neutral: ${neuW}%`} />}
                  {negW > 0 && <div style={{ width: `${negW}%` }} className="bg-red-400 transition-all" title={`Negative: ${negW}%`} />}
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span className="text-green-600">● {posW}% positive</span>
                  <span className="text-stone-500">● {neuW}% neutral</span>
                  <span className="text-red-500">● {negW}% negative</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Rating distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rating Distribution</CardTitle>
          <p className="text-xs text-muted-foreground">{positiveRate}% of reviews rated 7+ out of 10</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {ratingBuckets.map((b) => {
            const w = Math.round((b.count / maxBucket) * 100);
            const color =
              b.label === "9–10" ? "bg-green-500" :
              b.label === "7–8" ? "bg-emerald-400" :
              b.label === "5–6" ? "bg-amber-400" :
              "bg-red-400";
            return (
              <div key={b.label} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-muted-foreground text-right">{b.label}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div className={cn("h-full rounded transition-all", color)} style={{ width: `${w}%` }} />
                </div>
                <span className="w-8 text-xs text-muted-foreground tabular-nums">{b.count}</span>
              </div>
            );
          })}
          <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            Overall average: <span className="font-semibold text-foreground">{stats.avgRating}/10</span>
          </div>
        </CardContent>
      </Card>

      {/* Keyword spikes */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Keyword Spike Monitor — Last 30 Days</CardTitle>
          <p className="text-xs text-muted-foreground">Keywords that crossed alert threshold are highlighted</p>
        </CardHeader>
        <CardContent>
          {keywords.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No keyword hits in the last 30 days.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Keyword</th>
                    <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Category</th>
                    <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Property</th>
                    <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Severity</th>
                    <th className="py-2 pr-4 text-right font-medium text-muted-foreground">30-day hits</th>
                    <th className="py-2 text-right font-medium text-muted-foreground">Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keywords.map((kw, i) => {
                    const overThreshold = kw.hit_count_30d >= kw.threshold;
                    return (
                      <tr key={i} className={overThreshold ? "bg-red-50/60" : ""}>
                        <td className="py-2.5 pr-4 font-semibold text-foreground">{kw.keyword}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground capitalize">{kw.category}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{kw.property_name}</td>
                        <td className="py-2.5 pr-4">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 font-medium",
                            kw.severity === "critical" ? "bg-red-100 text-red-700" :
                            kw.severity === "warning" ? "bg-orange-100 text-orange-700" :
                            "bg-green-100 text-green-700"
                          )}>
                            {kw.severity}
                          </span>
                        </td>
                        <td className={cn("py-2.5 pr-4 text-right font-bold tabular-nums",
                          overThreshold ? "text-red-600" : "text-foreground")}>
                          {kw.hit_count_30d}
                          {overThreshold && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">{kw.threshold}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
