"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, MessageSquareWarning, Star, TrendingDown,
  ClipboardList, FileText, Settings, LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppUser } from "@/types";

const NAV = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/complaints",  label: "Complaints",  icon: MessageSquareWarning },
  { href: "/reviews",     label: "Reviews",     icon: Star },
  { href: "/financials",  label: "Financials",  icon: TrendingDown },
  { href: "/action-plan", label: "Action\nPlan", icon: ClipboardList },
  { href: "/reports",     label: "Reports",     icon: FileText },
];

const BG      = "#7C3AED";
const ACTIVE  = "rgba(255,255,255,0.20)";
const HOVER   = "rgba(255,255,255,0.10)";
const ICON_ON  = "#ffffff";
const ICON_OFF = "rgba(255,255,255,0.60)";
const TEXT_ON  = "#ffffff";
const TEXT_OFF = "rgba(255,255,255,0.55)";

export function Sidebar({ user }: { user?: AppUser | null }) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const propertyId   = searchParams.get("property");

  function navHref(base: string) {
    return propertyId ? `${base}?property=${propertyId}` : base;
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside
      className="flex h-screen w-[72px] flex-col items-center py-2 shrink-0"
      style={{ background: BG }}
    >
      {/* ── Logo ──────────────────────────────────── */}
      <div className="flex h-12 w-full items-center justify-center mb-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-base select-none"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          🐝
        </div>
      </div>

      <div className="w-8 h-px mb-2" style={{ background: "rgba(255,255,255,0.14)" }} />

      {/* ── Main nav ──────────────────────────────── */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-2 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={navHref(href)}
              className="flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors"
              style={{ background: active ? ACTIVE : "transparent" }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = HOVER;
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon className="h-5 w-5" style={{ color: active ? ICON_ON : ICON_OFF }} />
              <span
                className="text-[9.5px] font-medium text-center leading-tight whitespace-pre-line"
                style={{ color: active ? TEXT_ON : TEXT_OFF }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <div className="w-8 h-px my-1.5" style={{ background: "rgba(255,255,255,0.14)" }} />

        {user?.role === "admin" && (
          <Link
            href={navHref("/settings")}
            className="flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors"
            style={{
              background: pathname.startsWith("/settings") ? ACTIVE : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!pathname.startsWith("/settings"))
                (e.currentTarget as HTMLElement).style.background = HOVER;
            }}
            onMouseLeave={(e) => {
              if (!pathname.startsWith("/settings"))
                (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Settings
              className="h-5 w-5"
              style={{ color: pathname.startsWith("/settings") ? ICON_ON : ICON_OFF }}
            />
            <span
              className="text-[9.5px] font-medium"
              style={{ color: pathname.startsWith("/settings") ? TEXT_ON : TEXT_OFF }}
            >
              Settings
            </span>
          </Link>
        )}
      </nav>

      {/* ── User footer ───────────────────────────── */}
      <div className="mt-2 w-full px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex flex-col items-center gap-1 py-2 rounded-xl transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = HOVER; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Avatar className="h-7 w-7 ring-1 ring-white/20">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback
                  className="text-[11px] border-0"
                  style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[9px] font-medium" style={{ color: TEXT_OFF }}>
                {user?.full_name?.split(" ")[0] ?? "Me"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-[200px]">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.full_name ?? "Guest"}</p>
              <p className="text-xs font-normal text-muted-foreground truncate">{user?.email}</p>
            </DropdownMenuLabel>
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
