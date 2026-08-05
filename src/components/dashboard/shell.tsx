"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Bell,
  LogOut,
  Menu,
} from "lucide-react";

const navItems = [
  { label: "Overzicht", href: "/dashboard", icon: LayoutDashboard },
  { label: "Dagelijks", href: "/dashboard/daily", icon: CalendarDays },
  { label: "Medewerkers", href: "/dashboard/employees", icon: Users },
  { label: "Meldingen", href: "/dashboard/alerts", icon: Bell },
];

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

interface DashboardShellProps {
  userName: string;
  children: React.ReactNode;
}

export function DashboardShell({ userName, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href, pathname)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const userSection = (
    <div className="border-t pt-4">
      <div className="mb-3 px-3 text-sm text-muted-foreground">
        Ingelogd als{" "}
        <span className="font-medium text-foreground">{userName}</span>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="size-4" />
        Uitloggen
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card p-4 lg:flex">
        <div className="mb-6 px-3">
          <h1 className="text-lg font-bold">Thuishaven</h1>
          <p className="text-xs text-muted-foreground">HR Dashboard</p>
        </div>
        {navLinks}
        {userSection}
      </aside>

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetHeader className="p-0">
                <SheetTitle>Thuishaven</SheetTitle>
              </SheetHeader>
              {navLinks}
              {userSection}
            </SheetContent>
          </Sheet>
          <h1 className="text-sm font-bold">Thuishaven HR</h1>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
