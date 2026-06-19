"use client";

import { Bell, Search } from "lucide-react";
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

interface Notification {
  id: string;
  title: string;
  description: string;
  type: "critical" | "high" | "medium" | "info";
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Critical complaint",
    description: "Pest sighting reported — Bee Hostel Paphos, Room 12",
    type: "critical",
    time: "5m ago",
    read: false,
  },
  {
    id: "2",
    title: "New negative review",
    description: "1-star review received on Booking.com — Hotel A",
    type: "high",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    title: "Action item overdue",
    description: "AC repair in Room 8 — Bee Hostel Limassol",
    type: "medium",
    time: "2h ago",
    read: false,
  },
];

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6">
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search complaints, reviews…"
          className="pl-8 w-60 h-8 text-sm bg-background"
        />
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="relative">
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
            <Badge variant="critical" className="text-[10px] py-0">
              {unreadCount} new
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {MOCK_NOTIFICATIONS.map((notif) => (
            <DropdownMenuItem key={notif.id} className="flex-col items-start gap-1 py-2.5">
              <div className="flex items-center gap-2 w-full">
                <span
                  className={`status-dot shrink-0 ${
                    notif.type === "critical"
                      ? "bg-red-500"
                      : notif.type === "high"
                      ? "bg-orange-500"
                      : notif.type === "medium"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />
                <span className="text-sm font-medium flex-1">{notif.title}</span>
                <span className="text-[10px] text-muted-foreground">{notif.time}</span>
              </div>
              <p className="text-xs text-muted-foreground pl-4">{notif.description}</p>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-xs text-primary font-medium">
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
