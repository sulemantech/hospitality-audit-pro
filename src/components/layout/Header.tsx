"use client";

import { Bell, Search, Building2, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProperties, ALL_PROPERTY } from "@/components/layout/PropertyContext";
import { useNotifications } from "@/components/layout/NotificationsContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const properties   = useProperties();
  const notifications = useNotifications();
  const pathname     = usePathname();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const selectedId   = searchParams.get("property") ?? "all";
  const allProps     = [ALL_PROPERTY, ...properties];
  const selectedProp = allProps.find((p) => p.id === selectedId) ?? ALL_PROPERTY;

  function changeProperty(id: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (id === "all") sp.delete("property"); else sp.set("property", id);
    sp.delete("page");
    router.replace(`${pathname}?${sp.toString()}`);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4">

      {/* ── Property selector ───────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/8 hover:bg-primary/14 px-3 h-9 text-sm font-semibold text-primary transition-colors shrink-0 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {selectedProp.name}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[230px]">
          <DropdownMenuLabel>Switch Property</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allProps.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => changeProperty(p.id)}
              className={selectedId === p.id ? "bg-accent text-accent-foreground font-medium" : ""}
            >
              <span className="truncate flex-1">{p.name}</span>
              {selectedId === p.id && (
                <span className="ml-2 text-[10px] text-primary font-semibold shrink-0">active</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="h-5 w-px bg-border shrink-0" />

      {/* ── Page title ──────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-foreground leading-none truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search…"
          className="pl-8 w-52 h-8 text-sm bg-background"
        />
      </div>

      {/* ── Notifications ───────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="relative shrink-0">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[320px]">
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="critical" className="text-[10px] py-0">
                {unreadCount} new
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No recent alerts — all clear!
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} className="flex-col items-start gap-1 py-2.5">
                <div className="flex items-center gap-2 w-full">
                  <span
                    className={`status-dot shrink-0 ${
                      notif.type === "critical" ? "bg-red-500"
                      : notif.type === "high"   ? "bg-orange-500"
                      : notif.type === "medium" ? "bg-amber-500"
                      : "bg-blue-500"
                    }`}
                  />
                  <span className="text-sm font-medium flex-1 truncate">{notif.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{notif.time}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-4 line-clamp-2">{notif.description}</p>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-xs text-primary font-medium">
            View all alerts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
