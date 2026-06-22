"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bee-reviews-property";

interface Property { id: string; name: string; }

const SOURCES = [
  { value: "booking.com", label: "Booking.com" },
  { value: "google", label: "Google" },
  { value: "tripadvisor", label: "TripAdvisor" },
  { value: "airbnb", label: "Airbnb" },
  { value: "expedia", label: "Expedia" },
  { value: "direct", label: "Direct" },
];

const SENTIMENTS = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
];

const MIN_RATINGS = [
  { value: "9", label: "9+ Excellent" },
  { value: "7", label: "7+ Good" },
  { value: "5", label: "5+ Average" },
];

export function ReviewFilters({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value) sp.set(key, value);
      else sp.delete(key);
      sp.delete("page");
      // Persist selected property so it survives navigation away and back
      if (key === "property") {
        if (value) localStorage.setItem(STORAGE_KEY, value);
        else localStorage.removeItem(STORAGE_KEY);
      }
      router.replace(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // On mount: if no property in URL but one was saved, restore it
  useEffect(() => {
    if (!searchParams.get("property")) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) update("property", saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => update("search", e.target.value), 350);
  };

  const hasFilters = ["property", "source", "sentiment", "minRating", "flagged", "search"].some(
    (k) => searchParams.has(k)
  );

  const sel = "w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search review text…"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={handleSearch}
          className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <select
        className={sel}
        style={{ width: "auto" }}
        value={searchParams.get("property") ?? ""}
        onChange={(e) => update("property", e.target.value)}
      >
        <option value="">All properties</option>
        {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <select
        className={sel}
        style={{ width: "auto" }}
        value={searchParams.get("source") ?? ""}
        onChange={(e) => update("source", e.target.value)}
      >
        <option value="">All sources</option>
        {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <select
        className={sel}
        style={{ width: "auto" }}
        value={searchParams.get("sentiment") ?? ""}
        onChange={(e) => update("sentiment", e.target.value)}
      >
        <option value="">All sentiments</option>
        {SENTIMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <select
        className={sel}
        style={{ width: "auto" }}
        value={searchParams.get("minRating") ?? ""}
        onChange={(e) => update("minRating", e.target.value)}
      >
        <option value="">Any rating</option>
        {MIN_RATINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>

      {/* Flagged toggle */}
      <button
        onClick={() => update("flagged", searchParams.get("flagged") === "1" ? "" : "1")}
        className={`h-9 px-3 rounded-md border text-xs font-medium transition-colors ${
          searchParams.get("flagged") === "1"
            ? "border-orange-300 bg-orange-50 text-orange-700"
            : "border-input bg-card text-muted-foreground hover:text-foreground"
        }`}
      >
        Flagged only
      </button>

      {hasFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="h-9 text-xs text-muted-foreground"
          onClick={() => router.replace(pathname)}
        >
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}
