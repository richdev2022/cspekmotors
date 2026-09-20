import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Images } from "lucide-react";
import { db } from "@/lib/db";
import { queryVehicles, categoryImageOf, categoryMediaOrderBy } from "@/lib/vehicles";
import { publicMediaUrl } from "@/lib/media";
import { VehicleCard } from "@/components/site/vehicle-card";
import { EmptyState } from "@/components/site/empty-state";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  return db.category.findFirst({
    where: { slug, isActive: true },
    include: {
      _count: { select: { vehicles: { where: { isPublished: true, status: { not: "HIDDEN" } } } } },
      media: { orderBy: [...categoryMediaOrderBy] },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} for Sale in Nigeria`,
    description:
      category.description ||
      `Browse quality ${category.name.toLowerCase()} for sale at C-SPEK MOTORS LTD — inspected, documented and ready for delivery anywhere in Nigeria.`,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      title: `${category.name} for Sale in Nigeria | C-SPEK MOTORS LTD`,
      description: category.description || undefined,
      url: `/categories/${category.slug}`,
      ...(category.image && { images: [{ url: categoryImageOf(category) ?? category.image, alt: `${category.name} at C-SPEK MOTORS LTD` }] }),
    },
  };
}

/** Gallery strip for media uploaded at the category level (wizard/manual uploads). */
function CategoryGallery({ name, video, media }: { name: string; video: string | null; media: { id: string; url: string; type: string; caption: string | null }[] }) {
  const galleryMedia = video && !media.some((item) => item.url === video)
    ? [{ id: "category-video", url: video, type: "VIDEO", caption: "Trucks in action" }, ...media]
    : media;

  if (galleryMedia.length === 0) return null;
  return (
    <section className="mt-12" aria-label={`${name} gallery`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-zinc-950">{name} Gallery</h2>
          <p className="mt-1 text-sm text-zinc-500">Photos and videos from our {name.toLowerCase()} stock.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          <Images className="h-3.5 w-3.5" /> {galleryMedia.length} file{galleryMedia.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {galleryMedia.map((m) => {
          const url = publicMediaUrl(m.url) ?? m.url;
          return m.type === "VIDEO" ? (
            <video
              key={m.id}
              src={url}
              controls
              preload="metadata"
              className="aspect-[4/3] w-full rounded-2xl bg-zinc-950 object-contain"
              aria-label={m.caption || `${name} video`}
            />
          ) : (
            <a
              key={m.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100"
              title={m.caption || `${name} photo`}
            >
              <img
                src={url}
                alt={m.caption || `${name} photo`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const [vehicles, allCategories] = await Promise.all([
    queryVehicles({ category: category.slug, page: 1, limit: 24, sort: "newest" }),
    db.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }] }),
  ]);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: process.env.APP_URL || "http://localhost:3000" },
      { "@type": "ListItem", position: 2, name: "Categories", item: `${process.env.APP_URL || "http://localhost:3000"}/categories` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${process.env.APP_URL || "http://localhost:3000"}/categories/${category.slug}` },
    ],
  };

  return (
    <div className="bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className="bg-zinc-950 py-16 sm:py-20" aria-label={category.name}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Category</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-5xl">{category.name}</h1>
          {category.description && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">{category.description}</p>
          )}
          <p className="mt-3 text-sm text-zinc-500">
            {category._count.vehicles} vehicle{category._count.vehicles === 1 ? "" : "s"} available
          </p>
        </div>
      </section>

      {/* Category chips */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="styled-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3.5 sm:px-6 lg:px-8" aria-label="All categories">
          {allCategories.map((c) => (
            <a
              key={c.id}
              href={`/categories/${c.slug}`}
              className={
                c.slug === category.slug
                  ? "shrink-0 rounded-full bg-zinc-950 px-4 py-1.5 text-sm font-semibold text-white"
                  : "shrink-0 rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
              }
              aria-current={c.slug === category.slug ? "page" : undefined}
            >
              {c.name}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {vehicles.items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.items.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No vehicles available in ${category.name} right now`}
            description="We update our stock weekly. Tell us what you are looking for and our team will source it or notify you first when new stock arrives."
            resetHref="/categories"
            icon={undefined}
          />
        )}

        {/* Media uploaded to this category (from the admin Smart Wizard or Manual upload) */}
        <CategoryGallery
          name={category.name}
          video={category.video ?? (category.slug === "trucks" ? "/api/files/vehicles/whatsapp-video-2026-09-16-at-11-55-14-pm-mu6ywk2htgr2t6.mp4" : null)}
          media={category.media}
        />
      </div>
    </div>
  );
}
