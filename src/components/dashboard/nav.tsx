"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  AlertTriangle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <Image
        src="/brand/totem.png"
        alt=""
        width={compact ? 28 : 36}
        height={compact ? 28 : 36}
        className={cn(
          "shrink-0 object-contain",
          compact ? "size-7" : "size-9",
        )}
        priority
      />
      <div className="min-w-0">
        <p className="th-heading text-sm tracking-[0.2em]">THUISHAVEN</p>
        {!compact && (
          <p className="mt-0.5 text-xs text-sidebar-foreground/60">HR Dashboard</p>
        )}
      </div>
    </Link>
  );
}

const navItems = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/dashboard/daily", label: "Dagelijks", icon: CalendarDays },
  { href: "/dashboard/employees", label: "Medewerkers", icon: Users },
  { href: "/dashboard/alerts", label: "Meldingen", icon: AlertTriangle },
];

function NavLinks({
  onNavigate,
  alertCount,
}: {
  onNavigate?: () => void;
  alertCount: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {item.href === "/dashboard/alerts" && alertCount > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {alertCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardNav({
  userName,
  alertCount = 0,
}: {
  userName: string;
  alertCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-4 py-4">
          <BrandMark />
        </div>

        <div className="flex-1 px-3 py-4">
          <NavLinks alertCount={alertCount} />
        </div>

        <div className="border-t border-sidebar-border px-4 py-4">
          <p className="truncate text-sm font-medium">{userName}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Uitloggen
          </Button>
        </div>
      </aside>

      <div className="border-b border-border bg-sidebar text-sidebar-foreground md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <BrandMark compact />
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
        {open && (
          <div className="border-t border-sidebar-border px-3 py-3">
            <NavLinks
              alertCount={alertCount}
              onNavigate={() => setOpen(false)}
            />
            <div className="mt-3 border-t border-sidebar-border pt-3">
              <p className="truncate px-3 text-sm font-medium">{userName}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full justify-start text-sidebar-foreground/70"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-4" />
                Uitloggen
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
