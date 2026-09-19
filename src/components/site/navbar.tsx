"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavSettings {
  companyName: string;
  phone: string | null;
  logoLight: string | null;
  logoDark: string | null;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ settings }: { settings: NavSettings }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const darkMode = resolvedTheme === "dark";

  // Dark artwork (silver) over the dark hero; dark-text artwork on white once scrolled/menu open
  const logoSrc = scrolled || open
    ? (settings.logoLight || "/brand/logo-light-bg.png")
    : (settings.logoDark || "/brand/logo-dark-bg.png");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || open
          ? darkMode
            ? "bg-zinc-950/95 backdrop-blur-md border-b border-white/10"
            : "bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-[0_1px_20px_rgba(0,0,0,0.06)]"
          : "bg-zinc-950 border-b border-white/5"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label={settings.companyName}>
            { }
            <img src={logoSrc} alt={`${settings.companyName} logo`} className="h-10 md:h-12 w-auto transition-all duration-300" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    scrolled
                      ? darkMode
                        ? active
                          ? "bg-amber-500 text-zinc-950"
                          : "text-zinc-300 hover:text-white hover:bg-white/10"
                        : active
                          ? "bg-zinc-950 text-white"
                          : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100"
                      : active
                        ? "bg-white text-zinc-950"
                        : "text-white/85 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {settings.phone && (
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold transition-colors",
                  scrolled ? "text-zinc-800 hover:text-amber-600" : "text-white/90 hover:text-amber-400"
                )}
              >
                <Phone className="h-4 w-4" />
                <span className="hidden xl:inline">{settings.phone}</span>
              </a>
            )}
            <ThemeToggle className={cn("text-white", (scrolled || open) && !darkMode && "text-zinc-900")} />
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded-full">
              <Link href="/vehicles">Explore Vehicles</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-full transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? (
              <X className="h-6 w-6 text-zinc-900" />
            ) : (
              <Menu className={cn("h-6 w-6", scrolled ? "text-zinc-900" : "text-white")} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-zinc-200 bg-white">
          <nav className="mx-auto max-w-7xl px-4 py-4 space-y-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                    active ? "bg-zinc-950 text-white" : "text-zinc-800 hover:bg-zinc-100"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
              <span className="text-sm font-medium text-zinc-600">Appearance</span>
              <ThemeToggle className="text-zinc-900" />
            </div>
            <div className="pt-3 flex flex-col gap-2">
              {settings.phone && (
                <Button asChild variant="outline" className="rounded-full h-12">
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                    <Phone className="h-4 w-4" /> Call {settings.phone}
                  </a>
                </Button>
              )}
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded-full h-12">
                <Link href="/vehicles">Explore Vehicles</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
