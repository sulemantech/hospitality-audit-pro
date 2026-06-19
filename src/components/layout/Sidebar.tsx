"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareWarning,
  Star,
  TrendingDown,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { AppUser, Property } from "@/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/financials", label: "Financials", icon: TrendingDown },
  { href: "/action-plan", label: "Action Plan", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: FileText },
];

const ALL_OPTION: Property = { id: "all", name: "All Properties", type: "hotel", location: "Cyprus", total_rooms: 0, created_at: "" };

interface SidebarProps {
  user?: AppUser | null;
  properties?: Property[];
}

export function Sidebar({ user, properties = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPropertyId = searchParams.get("property") ?? "all";
  const allProperties = [ALL_OPTION, ...properties];
  const selectedProperty = allProperties.find((p) => p.id === selectedPropertyId) ?? ALL_OPTION;

  function handlePropertyChange(id: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (id === "all") sp.delete("property");
    else sp.set("property", id);
    sp.delete("page");
    router.replace(`${pathname}?${sp.toString()}`);
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          B
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Bee Hospitality</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit Pro</p>
        </div>
      </div>

      {/* Property Selector */}
      <div className="px-3 pt-3 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-sm hover:bg-muted/50 transition-colors">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-left truncate text-foreground font-medium text-xs">
                {selectedProperty.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Select Property</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allProperties.map((property) => (
              <DropdownMenuItem
                key={property.id}
                onClick={() => handlePropertyChange(property.id)}
                className={cn(
                  selectedPropertyId === property.id && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <span className="truncate">{property.name}</span>
                {property.id !== "all" && (
                  <span className={cn(
                    "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    property.type === "hostel"
                      ? "bg-gold-light text-gold-dark"
                      : "bg-brand-muted text-brand-dark"
                  )}>
                    {property.type}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors relative",
                isActive
                  ? "nav-item-active text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              {label}
            </Link>
          );
        })}

        <Separator className="my-2" />

        {user?.role === "admin" && (
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors relative",
              pathname.startsWith("/settings")
                ? "nav-item-active text-accent-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Settings className={cn("h-4 w-4 shrink-0", pathname.startsWith("/settings") && "text-primary")} />
            Settings
          </Link>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 rounded-md p-1.5 hover:bg-muted/60 transition-colors">
              <Avatar className="h-7 w-7">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">{user?.full_name ?? "Guest"}</p>
                <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role ?? "viewer"}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
