import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryCard } from "@/components/site/category-card";
import { SectionHeading } from "@/components/site/section-heading";
import { categoryImageOf, categoryMediaOrderBy } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vehicle Categories — Cars, SUVs, Trucks, Trailers, Buses & Vans",
  description:
    "Explore all vehicle categories at C-SPEK MOTORS LTD: cars, SUVs, trucks, trailers, buses, vans, commercial and specialist vehicles for sale in Nigeria.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { vehicles: { where: { isPublished: true, status: { not: "HIDDEN" } } } } },
      media: { orderBy: [...categoryMediaOrderBy] },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="bg-zinc-50">
      <section className="bg-zinc-950 py-16 sm:py-20" aria-label="Vehicle categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Our Categories</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-5xl">Vehicle Categories</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            Whatever moves your life or your business, we have a category for it. Browse our full range
            and find your perfect vehicle.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {categories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <CategoryCard
                key={c.id}
                name={c.name}
                slug={c.slug}
                description={c.description}
                image={categoryImageOf(c)}
                vehicleCount={c._count.vehicles}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center text-zinc-500">
            Categories are being prepared. Please check back shortly.
          </div>
        )}
      </div>
    </div>
  );
}
