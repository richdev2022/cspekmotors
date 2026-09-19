"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, Shapes, Images, MessagesSquare, Inbox, Settings, Users, ScrollText,
  LogOut, Menu, ExternalLink, ChevronsUpDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { SafeAdmin } from "@/types";
import { api } from "@/lib/api-client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/categories", label: "Categories", icon: Shapes },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessagesSquare },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const SUPER_NAV = [
  { href: "/admin/users", label: "Admin Users", icon: Users },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

export function AdminShell({ admin, children }: { admin: SafeAdmin; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [...NAV, ...(admin.role === "SUPER_ADMIN" ? SUPER_NAV : [])];

  async function logout() {
    const res = await api.post("/api/auth/logout");
    if (res.ok) {
      toast.success("Signed out successfully.");
      // Full page load — reliable behind proxies and clears all client state
      window.location.assign("/admin/login");
    } else {
      toast.error(res.error ?? "Could not sign out.");
    }
  }

  const initials = admin.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navContent = (
    <nav className="flex h-full flex-col" aria-label="Admin navigation">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          { }
          <img src="/brand/logo-dark-bg.png" alt="C-SPEK MOTORS LTD Admin" className="h-10 w-auto" />
        </Link>
      </div>
      <div className="styled-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4.5 w-4.5" /> View Website
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-4.5 w-4.5" /> Logout
        </button>
      </div>
    </nav>
  );

  return (
    <div className="admin-shell flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-zinc-950 lg:block" aria-label="Admin sidebar">
        {navContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-0 bg-zinc-950 p-0 [&>button]:text-white">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          {navContent}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-zinc-950 p-0 [&>button]:text-white">
                <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                {navContent}
              </SheetContent>
            </Sheet>
            <p className="font-display text-base font-semibold text-foreground">Admin Dashboard</p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="hidden rounded-full sm:inline-flex">
              <Link href="/admin/vehicles/new">+ Add Vehicle</Link>
            </Button>
            <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-1 sm:pr-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-zinc-950 text-xs font-bold text-amber-400">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-[140px] truncate text-xs font-semibold text-zinc-900">{admin.name}</span>
                <span className="block text-[10px] font-medium uppercase tracking-wide text-amber-600">
                  {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                </span>
              </span>
              <ChevronsUpDown className="hidden h-3.5 w-3.5 text-zinc-400 sm:block" aria-hidden="true" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
