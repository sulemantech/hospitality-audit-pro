"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, MessageSquareWarning, Star, TrendingDown,
  ClipboardList, FileText, Settings, LogOut, Building2,
} from "lucide-react";
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
  { href: "/action-plan", label: "Action\nPlan", icon: ClipboardList },
  { href: "/reports",     label: "Reports",     icon: FileText },
];

const BG      = "#7C3AED";
const ACTIVE  = "rgba(255,255,255,0.20)";
const HOVER   = "rgba(255,255,255,0.10)";
const ICON_ON = "#ffffff";
const ICON_OFF = "rgba(255,255,255,0.60)";
const TEXT_ON  = "#ffffff";
const TEXT_OFF = "rgba(255,255,255,0.55)";

const ALL: Property = {
  id: "all", name: "All Properties", type: "hotel",
  location: "Cyprus", total_rooms: 0, created_at: "",
};

export function Sidebar({ user, properties = [] }: { user?: AppUser | null; properties?: Property[] }) {
  const pathname     = usePathname();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const selectedId   = searchParams.get("property") ?? "all";
  const allProps     = [ALL, ...properties];
  const selectedProp = allProps.find((p) => p.id === selectedId) ?? ALL;

  function changeProperty(id: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (id === "all") sp.delete("property"); else sp.set("property", id);
    sp.delete("page");
    router.replace(`${pathname}?${sp.toString()}`);
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const shortName = (() => {
    if (selectedProp.id === "all") return "All";
    const w = selectedProp.name.split(" ");
    return w.length > 1 ? w[0].slice(0, 5) : selectedProp.name.slice(0, 5);
  })();

  return (
    <aside
      className="flex h-screen w-[72px] flex-col items-center py-2 shrink-0"
      style={{ background: BG }}
    >
      {/* ── Logo ───────────────────────────── */}
      <div className="flex h-12 w-full items-center justify-center mb-1">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-base select-none"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          🐝
        </div>
      </div>

      {/* ── Property picker (icon + short label) ── */}
      <div className="w-full px-2 mb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = HOVER; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Building2 className="h-5 w-5" style={{ color: ICON_OFF }} />
              <span className="text-[9px] font-medium leading-none" style={{ color: TEXT_OFF }}>
                {shortName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-[210px]">
            <DropdownMenuLabel>Select Property</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allProps.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => changeProperty(p.id)}
                className={selectedId === p.id ? "bg-accent text-accent-foreground font-medium" : ""}
              >
                <span className="truncate">{p.name}</span>
                {p.id !== "all" && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                    {p.type}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-8 h-px mb-2" style={{ background: "rgba(255,255,255,0.14)" }} />

      {/* ── Main nav ───────────────────────── */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-2 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
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
            href="/settings"
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

      {/* ── User footer ────────────────────── */}
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
