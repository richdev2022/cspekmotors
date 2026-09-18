"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "year-desc", label: "Year: Newest" },
  { value: "title-asc", label: "Name: A to Z" },
];

export function VehicleFilters({
  categories,
  lockCategory,
}: {
  categories: FilterCategory[];
  lockCategory?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = {
    search: searchParams.get("search") ?? "",
    category: lockCategory ?? searchParams.get("category") ?? "all",
    status: searchParams.get("status") ?? "all",
    featured: searchParams.get("featured") ?? "all",
    sort: searchParams.get("sort") ?? "newest",
  };

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page"); // reset pagination on filter change
    startTransition(() => {
      router.push(`/vehicles${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    });
  }

  const body = (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">Search</Label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = (new FormData(e.currentTarget).get("search") as string) ?? "";
            updateParam("search", value.trim());
            setMobileOpen(false);
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            id="filter-search"
            name="search"
            defaultValue={current.search}
            placeholder="Search by name, brand, model, year…"
            className="pl-9"
          />
        </form>
      </div>

      {!lockCategory && (
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={current.category} onValueChange={(v) => updateParam("category", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Availability</Label>
        <Select value={current.status} onValueChange={(v) => updateParam("status", v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Any status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Featured</Label>
        <Select value={current.featured} onValueChange={(v) => updateParam("featured", v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All vehicles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            <SelectItem value="true">Featured Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Sort By</Label>
        <Select value={current.sort} onValueChange={(v) => updateParam("sort", v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop filter bar */}
      <div className="hidden lg:block">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">{body}</div>
      </div>

      {/* Mobile filter trigger + sort */}
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1 rounded-full">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto styled-scrollbar">
            <SheetTitle className="font-display">Filter Vehicles</SheetTitle>
            <div className="mt-4">{body}</div>
            <Button
              variant="outline"
              className="mt-6 w-full rounded-full"
              onClick={() => {
                startTransition(() => router.push("/vehicles", { scroll: false }));
                setMobileOpen(false);
              }}
            >
              Reset All Filters
            </Button>
          </SheetContent>
        </Sheet>
        <Select value={current.sort} onValueChange={(v) => updateParam("sort", v)}>
          <SelectTrigger className="flex-1 rounded-full"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pending && (
        <div className={cn("fixed top-20 right-6 z-50 rounded-full bg-zinc-950 px-4 py-2 text-xs font-medium text-white shadow-lg flex items-center gap-2")}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
        </div>
      )}
    </>
  );
}
