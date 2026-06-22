"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, MessageSquareWarning, Star, TrendingDown,
  ClipboardList, FileText, Settings, LogOut, ChevronDown, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppUser, Property } from "@/types";

const NAV = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/complaints",  label: "Complaints",  icon: MessageSquareWarning },
  { href: "/reviews",     label: "Reviews",     icon: Star },
  { href: "/financials",  label: "Financials",  icon: TrendingDown },
  { href: "/action-plan", label: "Action Plan", icon: ClipboardList },
  { href: "/reports",     label: "Reports",     icon: FileText },
];

const ALL: Property = { id: "all", name: "All Properties", type: "hotel", location: "Cyprus", total_rooms: 0, created_at: "" };

export function Sidebar({ user, properties = [] }: { user?: AppUser | null; properties?: Property[] }) {
  const pathname       = usePathname();
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const selectedId     = searchParams.get("property") ?? "all";
  const allProps       = [ALL, ...properties];
  const selectedProp   = allProps.find((p) => p.id === selectedId) ?? ALL;

  function changeProperty(id: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (id === "all") sp.delete("property"); else sp.set("property", id);
    sp.delete("page");
    router.replace(`${pathname}?${sp.toString()}`);
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside className="flex h-screen w-[220px] flex-col" style={{ background: "#0E3D2A" }}>

      {/* ── Brand ─────────────────────────────────────── */}
      <div className="flex h-14 items-center gap-3 px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
             style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
          🐝
        </div>
        <div>
          <p className="text-sm font-semibold leading-none" style={{ color: "rgba(255,255,255,0.95)" }}>
            Bee Hospitality
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.40)" }}>
            Audit Pro
          </p>
        </div>
      </div>

      {/* ── Property selector ─────────────────────────── */}
      <div className="px-3 pt-3 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.80)",
              }}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.40)" }} />
              <span className="flex-1 text-left truncate font-medium">{selectedProp.name}</span>
              <ChevronDown className="h-3 w-3 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Select Property</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allProps.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => changeProperty(p.id)}
                className={cn(selectedId === p.id && "bg-accent text-accent-foreground font-medium")}
              >
                <span className="truncate">{p.name}</span>
                {p.id !== "all" && (
                  <span className={cn(
                    "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    p.type === "hostel" ? "bg-gold-light text-gold-dark" : "bg-brand-muted text-brand-dark"
                  )}>
                    {p.type}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mx-3 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all"
              style={{
                color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400" />
              )}
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: active ? "#34d399" : "rgba(255,255,255,0.38)" }}
              />
              {label}
            </Link>
          );
        })}

        <div className="mx-1 my-2 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

        {user?.role === "admin" && (
          <Link
            href="/settings"
            className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all"
            style={{
              color: pathname.startsWith("/settings") ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
              background: pathname.startsWith("/settings") ? "rgba(255,255,255,0.10)" : "transparent",
            }}
          >
            {pathname.startsWith("/settings") && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400" />
            )}
            <Settings
              className="h-4 w-4 shrink-0"
              style={{ color: pathname.startsWith("/settings") ? "#34d399" : "rgba(255,255,255,0.38)" }}
            />
            Settings
          </Link>
        )}
      </nav>

      {/* ── User footer ───────────────────────────────── */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center gap-2.5 rounded-lg p-1.5 transition-colors"
              style={{ color: "rgba(255,255,255,0.80)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Avatar className="h-7 w-7 ring-1 ring-white/10">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback
                  className="text-[11px] border-0"
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.90)" }}>
                  {user?.full_name ?? "Guest"}
                </p>
                <p className="text-[10px] truncate capitalize" style={{ color: "rgba(255,255,255,0.40)" }}>
                  {user?.role ?? "viewer"}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.30)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4" /> Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
