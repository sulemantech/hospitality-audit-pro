"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bee-complaints-property";

interface Property { id: string; name: string; type: string; }

interface Props {
  properties: Property[];
  searchParams: Record<string, string | undefined>;
}

const STATUSES = ["open", "pending", "resolved", "closed"];
const SEVERITIES = ["critical", "high", "medium", "low"];
const CATEGORIES = ["cleanliness", "maintenance", "noise", "staff", "facilities", "pest", "safety", "billing", "other"];

export function ComplaintFilters({ properties, searchParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams();
      const merged = { ...searchParams, [key]: value, page: "1" };
      Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (key === "property") {
        if (value) localStorage.setItem(STORAGE_KEY, value);
        else localStorage.removeItem(STORAGE_KEY);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // On mount: restore saved property if URL has none
  useEffect(() => {
    if (!searchParams.property) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) update("property", saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFilters = !!(searchParams.property || searchParams.status || searchParams.severity || searchParams.category || searchParams.search);

  return (
    <div className="flex items-center gap-2 flex-wrap flex-1">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search description…"
          className="pl-8 h-8 w-52 text-xs"
          defaultValue={searchParams.search ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>)._searchTimeout);
            (window as unknown as Record<string, ReturnType<typeof setTimeout>>)._searchTimeout = setTimeout(() => update("search", v || undefined), 350);
          }}
        />
      </div>

      {/* Property */}
      <select
        className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={searchParams.property ?? ""}
        onChange={(e) => update("property", e.target.value || undefined)}
      >
        <option value="">All Properties</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* Status */}
      <select
        className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={searchParams.status ?? ""}
        onChange={(e) => update("status", e.target.value || undefined)}
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>

      {/* Severity */}
      <select
        className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={searchParams.severity ?? ""}
        onChange={(e) => update("severity", e.target.value || undefined)}
      >
        <option value="">All Severities</option>
        {SEVERITIES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>

      {/* Category */}
      <select
        className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={searchParams.category ?? ""}
        onChange={(e) => update("category", e.target.value || undefined)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
      </select>

      {/* Clear */}
      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" onClick={() => { localStorage.removeItem(STORAGE_KEY); router.push(pathname); }}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
