import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { queryVehicles } from "@/lib/vehicles";
import { VehicleCard } from "@/components/site/vehicle-card";
import { VehicleFilters } from "@/components/site/vehicle-filters";
import { EmptyState } from "@/components/site/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { parseIntParam } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vehicles for Sale — Cars, SUVs, Trucks, Buses & Vans",
  description:
    "Browse the full C-SPEK MOTORS LTD inventory: quality cars, SUVs, trucks, trailers, buses and vans for sale in Nigeria. Filter by category and availability, then enquire on WhatsApp for price and details.",
  alternates: { canonical: "/vehicles" },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VehiclesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const page = parseIntParam(get("page") ?? null, 1);
  const [result, categories] = await Promise.all([
    queryVehicles({
      category: get("category"),
      search: get("search"),
      status: get("status"),
      featured: get("featured") === "true" ? true : undefined,
      sort: get("sort"),
      page,
      limit: 12,
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string" && k !== "page") params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/vehicles${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="bg-zinc-50">
      {/* Page header */}
      <section className="bg-zinc-950 py-16 sm:py-20" aria-label="Vehicle inventory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Our Inventory</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-5xl">Vehicles for Sale</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            Every vehicle in our inventory is inspected, documented and ready for its next owner.
            Use the filters to find exactly what you need.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar filters */}
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Vehicle filters">
            <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
              <VehicleFilters categories={categories} />
            </Suspense>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-zinc-500" role="status">
                Showing <span className="font-semibold text-zinc-900">{result.items.length}</span> of{" "}
                <span className="font-semibold text-zinc-900">{result.total}</span> vehicle
                {result.total === 1 ? "" : "s"}
                {result.totalPages > 1 ? ` — page ${result.page} of ${result.totalPages}` : ""}
              </p>
            </div>

            {result.items.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No vehicles match your search"
                description="Try adjusting your filters or search keywords. New stock arrives weekly — or tell us what you need and we will source it for you."
                resetHref="/vehicles"
              />
            )}

            {/* Pagination */}
            {result.totalPages > 1 && (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
                {result.page > 1 && (
                  <Link
                    href={buildPageUrl(result.page - 1)}
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
                  >
                    Previous
                  </Link>
                )}
                {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === result.totalPages || Math.abs(p - result.page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-zinc-400">…</span>}
                      <Link
                        href={buildPageUrl(p)}
                        aria-current={p === result.page ? "page" : undefined}
                        className={
                          p === result.page
                            ? "rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
                            : "rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-950 transition-colors"
                        }
                      >
                        {p}
                      </Link>
                    </span>
                  ))}
                {result.page < result.totalPages && (
                  <Link
                    href={buildPageUrl(result.page + 1)}
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
