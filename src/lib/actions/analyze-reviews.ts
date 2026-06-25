"use server";

import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

// ─── Gemini free tier: 15 RPM → 4s between calls ─────────────────────────────
const RATE_LIMIT_MS = 4100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Structured output schema ─────────────────────────────────────────────────

const ReviewAnalysisSchema = z.object({
  summary: z.string().describe("One sentence: what the guest actually experienced, in plain English for a GM"),
  severity: z.enum(["critical", "high", "medium", "low", "positive"]).describe("How urgently this needs attention"),
  emotion: z.enum(["angry", "frustrated", "disappointed", "neutral", "satisfied", "delighted"]).describe("Dominant emotional tone of the review"),
  topics: z.array(z.string()).describe("Specific operational topics mentioned, e.g. 'staff attitude', 'checkout wait', 'room cleanliness'"),
  systemic_risk: z.boolean().describe("True if this suggests a recurring problem affecting multiple guests, not a one-off"),
  suggested_action: z.string().describe("One concrete action staff should take within 24 hours"),
});

export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;

// ─── Analyze a single review ──────────────────────────────────────────────────

async function analyzeOne(review: {
  id: string;
  review_text: string;
  rating: number;
  reviewer_name: string | null;
  review_date: string;
  propertyName: string;
}): Promise<ReviewAnalysis | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") return null;

  try {
    const { output: object } = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({ schema: ReviewAnalysisSchema }),
      prompt: `You are a hospitality intelligence analyst helping a hotel group in Cyprus understand guest feedback.

Analyze this guest review and extract structured insights for hotel management.

Property: ${review.propertyName}
Rating: ${review.rating}/10
Date: ${review.review_date}
Reviewer: ${review.reviewer_name ?? "Anonymous"}
Review text: "${review.review_text}"

Rules:
- severity "critical" = health/safety risk, pest, abusive staff, or something that could go viral
- severity "high" = strong negative emotion, likely to write a public bad review soon
- severity "medium" = genuine complaint but calm tone
- severity "low" = minor gripe or mixed feedback
- severity "positive" = overall positive even if minor issues mentioned
- systemic_risk = true if the issue is likely structural (e.g. always slow check-in, recurring cleanliness) not a one-off
- suggested_action must be specific and actionable within 24 hours`,
    });

    return object;
  } catch (err) {
    console.error(`[analyze-reviews] Gemini failed for review ${review.id}:`, err);
    return null;
  }
}

// ─── Batch job ────────────────────────────────────────────────────────────────
// Fetches up to `limit` unanalyzed reviews, processes them with rate limiting,
// and saves results back to DB. Returns a summary of what was done.

export async function analyzeUnprocessedReviews(limit = 12): Promise<{
  processed: number;
  failed: number;
  skipped: number;
}> {
  const supabase = createAdminClient();

  // Fetch unanalyzed reviews — prioritize recent ones and negatives
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, review_text, rating, reviewer_name, review_date, property_id, properties(name)")
    .is("ai_analyzed_at", null)
    .not("review_text", "is", null)
    .neq("review_text", "")
    .order("review_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[analyze-reviews] Failed to fetch reviews:", error.message);
    return { processed: 0, failed: 0, skipped: 0 };
  }

  if (!reviews?.length) {
    console.log("[analyze-reviews] No unanalyzed reviews found");
    return { processed: 0, failed: 0, skipped: 0 };
  }

  console.log(`[analyze-reviews] Processing ${reviews.length} reviews`);

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    const propertyName =
      (r.properties as unknown as { name: string } | null)?.name ?? "Unknown Property";

    // Rate limit: wait before every call except the first
    if (i > 0) await sleep(RATE_LIMIT_MS);

    const analysis = await analyzeOne({
      id: r.id,
      review_text: r.review_text,
      rating: r.rating,
      reviewer_name: r.reviewer_name,
      review_date: r.review_date,
      propertyName,
    });

    if (!analysis) {
      failed++;
      // Still mark as attempted so we don't retry in a loop on persistent errors
      await supabase
        .from("reviews")
        .update({ ai_analyzed_at: new Date().toISOString() })
        .eq("id", r.id);
      continue;
    }

    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        ai_summary: analysis.summary,
        ai_severity: analysis.severity,
        ai_emotion: analysis.emotion,
        ai_topics: analysis.topics,
        ai_action: analysis.suggested_action,
        ai_systemic_risk: analysis.systemic_risk,
        ai_analyzed_at: new Date().toISOString(),
      })
      .eq("id", r.id);

    if (updateError) {
      console.error(`[analyze-reviews] Failed to save analysis for ${r.id}:`, updateError.message);
      failed++;
    } else {
      console.log(`[analyze-reviews] ✓ ${propertyName} | ${r.rating}/10 | ${analysis.severity} | ${analysis.emotion}`);
      processed++;
    }
  }

  return { processed, failed, skipped: limit - reviews.length };
}
