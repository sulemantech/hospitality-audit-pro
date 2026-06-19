"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { importReviews } from "@/lib/actions/reviews";
import {
  CheckCircle2, Loader2, AlertTriangle, ChevronRight,
  Upload, FileText, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Source configs ───────────────────────────────────────────

interface SourceConfig {
  label: string;
  enumValue: string;
  ratingScale: 5 | 10;
  columns: {
    date: string[];
    rating: string[];
    reviewText: string[];
    reviewTextPositive?: string[];
    reviewTextNegative?: string[];
    reviewerName?: string[];
  };
  instructions: string;
  sampleHeaders: string;
}

const SOURCES: Record<string, SourceConfig> = {
  "booking.com": {
    label: "Booking.com",
    enumValue: "booking.com",
    ratingScale: 10,
    columns: {
      date: ["Date of Stay", "Date", "Check-in Date"],
      rating: ["Score", "Rating", "Overall Score"],
      reviewText: ["Review", "Comment"],
      reviewTextPositive: ["Positive", "Positive Reviews", "What did you like?"],
      reviewTextNegative: ["Negative", "Negative Reviews", "What could be improved?"],
      reviewerName: ["Guest Name", "Name", "Guest"],
    },
    instructions: "From Booking.com Extranet → Reviews → Export. Rating is out of 10.",
    sampleHeaders: "Date of Stay,Guest Name,Score,Positive Reviews,Negative Reviews",
  },
  google: {
    label: "Google Reviews",
    enumValue: "google",
    ratingScale: 5,
    columns: {
      date: ["Date", "Review Date", "Published"],
      rating: ["Rating", "Stars", "Score"],
      reviewText: ["Review", "Review Text", "Comment", "Text"],
      reviewerName: ["Reviewer Name", "Name", "Author"],
    },
    instructions: "Export via Google My Business or third-party tool. Rating is out of 5 and will be normalized to /10.",
    sampleHeaders: "Date,Reviewer Name,Rating,Review",
  },
  tripadvisor: {
    label: "TripAdvisor",
    enumValue: "tripadvisor",
    ratingScale: 5,
    columns: {
      date: ["Date", "Review Date", "Stay Date"],
      rating: ["Rating", "Stars", "Bubble Rating", "Score"],
      reviewText: ["Review", "Review Text", "Comment", "Body"],
      reviewerName: ["Reviewer", "Username", "Name", "Author"],
    },
    instructions: "Export from TripAdvisor Management Center. Rating (1-5) normalized to /10.",
    sampleHeaders: "Date,Reviewer,Rating,Review",
  },
  airbnb: {
    label: "Airbnb",
    enumValue: "airbnb",
    ratingScale: 5,
    columns: {
      date: ["Date", "Review Date"],
      rating: ["Overall Rating", "Rating", "Stars"],
      reviewText: ["Comment", "Review", "Review Text"],
      reviewerName: ["Guest Name", "Reviewer", "Name"],
    },
    instructions: "Export from Airbnb Host dashboard → Reviews. Rating out of 5.",
    sampleHeaders: "Date,Guest Name,Rating,Comment",
  },
  expedia: {
    label: "Expedia",
    enumValue: "expedia",
    ratingScale: 10,
    columns: {
      date: ["Date", "Review Date", "Stay Date"],
      rating: ["Overall Rating", "Rating", "Score"],
      reviewText: ["Review", "Comment", "Review Text"],
      reviewerName: ["Guest Name", "Reviewer", "Name"],
    },
    instructions: "Export from Expedia Partner Central. Rating out of 10.",
    sampleHeaders: "Date,Guest Name,Rating,Review",
  },
  manual: {
    label: "Manual / Other",
    enumValue: "other",
    ratingScale: 10,
    columns: {
      date: ["Date"],
      rating: ["Rating"],
      reviewText: ["Review", "Text", "Comment"],
      reviewerName: ["Name", "Reviewer"],
    },
    instructions: "Use this for custom exports. Rating can be out of 5 or 10 — select below.",
    sampleHeaders: "Date,Name,Rating,Review",
  },
};

// ─── CSV Parser ───────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  // Character-based parser: handles quoted fields that span multiple lines
  const rows: string[][] = [];
  let cells: string[] = [];
  let cur = "";
  let inQuote = false;
  const n = text.length;

  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (i + 1 < n && text[i + 1] === '"') { cur += '"'; i++; } // escaped ""
        else inQuote = false; // closing quote
      } else {
        cur += ch; // include newlines inside quoted fields
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ',') {
        cells.push(cur.trim());
        cur = "";
      } else if (ch === '\r' || ch === '\n') {
        if (ch === '\r' && i + 1 < n && text[i + 1] === '\n') i++; // \r\n → single
        cells.push(cur.trim());
        cur = "";
        if (cells.some((c) => c !== "")) rows.push(cells);
        cells = [];
      } else {
        cur += ch;
      }
    }
  }
  // flush last cell / row
  cells.push(cur.trim());
  if (cells.some((c) => c !== "")) rows.push(cells);

  return rows;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();

  // ISO: 2024-01-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY — assume European
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;

  // "January 2024" → use 15th as midpoint
  const monthYear = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const months: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
    };
    const m = months[monthYear[1].toLowerCase()];
    if (m) return `${monthYear[2]}-${m}-15`;
  }

  // "15 Jan 2024"
  const dayMonYear = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dayMonYear) {
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const m = months[dayMonYear[2].toLowerCase().slice(0, 3)];
    if (m) return `${dayMonYear[3]}-${m}-${dayMonYear[1].padStart(2, "0")}`;
  }

  // Relative dates: "yesterday", "2 days ago", "3 weeks ago", "a month ago", "2 years ago"
  const lower = s.toLowerCase();
  if (lower === "today") return isoDate(new Date());
  if (lower === "yesterday") {
    const d = new Date(); d.setDate(d.getDate() - 1); return isoDate(d);
  }
  const rel = lower.match(/^(?:(a|an|\d+)\s+)(day|week|month|year)s?\s+ago$/);
  if (rel) {
    const n = rel[1] === "a" || rel[1] === "an" ? 1 : parseInt(rel[1], 10);
    const unit = rel[2];
    const d = new Date();
    if (unit === "day")   d.setDate(d.getDate() - n);
    if (unit === "week")  d.setDate(d.getDate() - n * 7);
    if (unit === "month") d.setMonth(d.getMonth() - n);
    if (unit === "year")  d.setFullYear(d.getFullYear() - n);
    return isoDate(d);
  }

  return null;
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.toLowerCase().trim() === c.toLowerCase().trim());
    if (idx !== -1) return idx;
  }
  return -1;
}

interface ParsedRow {
  reviewer_name: string | null;
  review_date: string;
  rating: number;
  raw_rating: number;
  review_text: string;
  rowIndex: number;
  error?: string;
}

interface Property { id: string; name: string; type: string; }

// ─── Wizard Component ─────────────────────────────────────────

export function ImportWizard({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sourceKey, setSourceKey] = useState("booking.com");
  const [propertyId, setPropertyId] = useState("");
  const [manualScale, setManualScale] = useState<5 | 10>(10);
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; total: number } | null>(null);
  const [importError, setImportError] = useState("");

  const config = SOURCES[sourceKey];
  const ratingScale = sourceKey === "manual" ? manualScale : config.ratingScale;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string ?? "");
    reader.readAsText(file, "UTF-8");
  }

  function doParse() {
    setParseError("");
    if (!csvText.trim()) { setParseError("Paste CSV content or upload a file first."); return; }
    if (!propertyId) { setParseError("Select a property first."); return; }

    const rows = parseCSV(csvText);
    if (rows.length < 2) { setParseError("CSV must have at least a header row and one data row."); return; }

    const headers = rows[0];
    const cfg = config;

    const dateIdx = findColumn(headers, cfg.columns.date);
    const ratingIdx = findColumn(headers, cfg.columns.rating);
    const textIdx = findColumn(headers, cfg.columns.reviewText);
    const posIdx = cfg.columns.reviewTextPositive ? findColumn(headers, cfg.columns.reviewTextPositive) : -1;
    const negIdx = cfg.columns.reviewTextNegative ? findColumn(headers, cfg.columns.reviewTextNegative) : -1;
    const nameIdx = cfg.columns.reviewerName ? findColumn(headers, cfg.columns.reviewerName) : -1;

    if (dateIdx === -1) { setParseError(`Could not find a date column. Expected one of: ${cfg.columns.date.join(", ")}. Found: ${headers.join(", ")}`); return; }
    if (ratingIdx === -1) { setParseError(`Could not find a rating column. Expected one of: ${cfg.columns.rating.join(", ")}.`); return; }
    if (textIdx === -1 && posIdx === -1) { setParseError(`Could not find a review text column.`); return; }

    const results: ParsedRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every((c) => !c)) continue; // skip blank rows

      const rawDate = row[dateIdx] ?? "";
      const normalDate = normalizeDate(rawDate);
      if (!normalDate) {
        results.push({ rowIndex: i, reviewer_name: null, review_date: "", rating: 0, raw_rating: 0, review_text: "", error: `Row ${i + 1}: unrecognised date "${rawDate}"` });
        continue;
      }

      const rawRating = parseFloat(row[ratingIdx] ?? "");
      if (isNaN(rawRating)) {
        results.push({ rowIndex: i, reviewer_name: null, review_date: normalDate, rating: 0, raw_rating: 0, review_text: "", error: `Row ${i + 1}: invalid rating "${row[ratingIdx]}"` });
        continue;
      }

      const normalRating = ratingScale === 5
        ? Math.min(10, rawRating * 2)
        : Math.min(10, rawRating);

      // Combine positive + negative for Booking.com, otherwise single text column
      let reviewText = "";
      if (posIdx !== -1 || negIdx !== -1) {
        const pos = posIdx !== -1 ? (row[posIdx] ?? "").trim() : "";
        const neg = negIdx !== -1 ? (row[negIdx] ?? "").trim() : "";
        if (pos) reviewText += `Liked: ${pos}`;
        if (pos && neg) reviewText += "\n";
        if (neg) reviewText += `Disliked: ${neg}`;
      } else {
        reviewText = (row[textIdx] ?? "").trim();
      }

      if (!reviewText) {
        results.push({ rowIndex: i, reviewer_name: null, review_date: normalDate, rating: normalRating, raw_rating: rawRating, review_text: "", error: `Row ${i + 1}: empty review text` });
        continue;
      }

      results.push({
        rowIndex: i,
        reviewer_name: nameIdx !== -1 ? (row[nameIdx] ?? "").trim() || null : null,
        review_date: normalDate,
        rating: normalRating,
        raw_rating: rawRating,
        review_text: reviewText,
      });
    }

    if (!results.length) { setParseError("No valid rows found."); return; }
    setParsed(results);
    setStep(2);
  }

  async function doImport() {
    setImporting(true);
    setImportError("");
    const validRows = parsed
      .filter((r) => !r.error)
      .map((r) => ({
        property_id: propertyId,
        source: config.enumValue,
        rating: r.rating,
        raw_rating: r.raw_rating,
        reviewer_name: r.reviewer_name,
        review_text: r.review_text,
        review_date: r.review_date,
      }));
    try {
      const res = await importReviews(validRows);
      setResult(res);
      setStep(3);
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep(1); setCsvText(""); setParsed([]); setParseError("");
    setResult(null); setImportError("");
  }

  const validRows = parsed.filter((r) => !r.error);
  const errorRows = parsed.filter((r) => r.error);

  const sel = "w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-5">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { n: 1, label: "Configure" },
          { n: 2, label: "Preview" },
          { n: 3, label: "Done" },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 font-medium",
              step === n ? "bg-primary text-primary-foreground" :
              step > n ? "bg-green-100 text-green-700" :
              "bg-muted text-muted-foreground"
            )}>
              {step > n ? <CheckCircle2 className="h-3 w-3" /> : <span>{n}</span>}
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Step 1: Configure ─────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-semibold text-foreground">Configure Import</p>
          </CardHeader>
          <CardContent className="space-y-5">

            <div className="grid grid-cols-2 gap-4">
              {/* Property */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Property <span className="text-red-500">*</span></label>
                <select className={sel} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                  <option value="">Select property…</option>
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {/* Manual rating scale */}
              {sourceKey === "manual" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Rating scale</label>
                  <select className={sel} value={manualScale} onChange={(e) => setManualScale(Number(e.target.value) as 5 | 10)}>
                    <option value={10}>Out of 10</option>
                    <option value={5}>Out of 5 (normalize to /10)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Source selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Review source</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {Object.entries(SOURCES).map(([key, s]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSourceKey(key)}
                    className={cn(
                      "rounded-lg border px-2 py-2.5 text-xs font-medium transition-all text-center",
                      sourceKey === key
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground bg-muted/50 rounded px-3 py-2">{config.instructions}</p>
            </div>

            {/* CSV input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">CSV data <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Upload className="h-3 w-3" /> Upload file
                </button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={10}
                placeholder={`Paste CSV here…\n\nExpected headers:\n${config.sampleHeaders}`}
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              <p className="text-[11px] text-muted-foreground">
                <FileText className="h-3 w-3 inline mr-1" />
                Expected header row: <code className="bg-muted px-1 rounded">{config.sampleHeaders}</code>
              </p>
            </div>

            {parseError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {parseError}
              </div>
            )}

            <Button onClick={doParse} className="w-full sm:w-auto">
              Parse CSV <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Step 2: Preview ───────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Valid rows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{errorRows.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Rows with errors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{parsed.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total rows</p>
              </CardContent>
            </Card>
          </div>

          {/* Error rows */}
          {errorRows.length > 0 && (
            <Card className="border-red-200">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Rows that will be skipped
                </p>
                {errorRows.map((r) => (
                  <p key={r.rowIndex} className="text-xs text-muted-foreground">{r.error}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Preview table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reviewer</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rating</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validRows.slice(0, 10).map((r) => (
                    <tr key={r.rowIndex} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{r.review_date}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.reviewer_name ?? "—"}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-foreground">{r.rating.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-foreground max-w-xs">
                        <span className="line-clamp-2">{r.review_text}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 10 && (
                <p className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                  …and {validRows.length - 10} more rows
                </p>
              )}
            </CardContent>
          </Card>

          {importError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" /> {importError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={doImport} disabled={importing || validRows.length === 0}>
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              {importing ? "Importing…" : `Import ${validRows.length} review${validRows.length !== 1 ? "s" : ""}`}
            </Button>
            <Button variant="outline" onClick={() => setStep(1)}>
              <RotateCcw className="h-3.5 w-3.5" /> Back
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Done ──────────────────────────────── */}
      {step === 3 && result && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Import complete</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reviews have been keyword-flagged and alerts generated automatically.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-6 w-full max-w-xs">
              {[
                { label: "Imported", value: result.inserted, color: "text-green-600" },
                { label: "Skipped (dups)", value: result.skipped, color: "text-muted-foreground" },
                { label: "Total", value: result.total, color: "text-foreground" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={cn("text-2xl font-bold", color)}>{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => router.push("/reviews")}>View Reviews</Button>
              <Button variant="outline" onClick={reset}>Import More</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
