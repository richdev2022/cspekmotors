import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, BadgeCheck, Phone, Mail, MessageCircleQuestion } from "lucide-react";
import { db } from "@/lib/db";
import { vehicleInclude } from "@/lib/vehicles";
import { getSiteSettings } from "@/lib/settings";
import { toPublicSettings } from "@/types";
import { VehicleGallery } from "@/components/site/vehicle-gallery";
import { VehicleEnquiryButton } from "@/components/site/enquiry-dialog";
import { VehicleStatusBadge } from "@/components/site/vehicle-card";
import { VehicleCard } from "@/components/site/vehicle-card";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/floating-whatsapp";
import { generateWhatsAppVehicleLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await db.vehicle.findFirst({
    where: { slug, isPublished: true, status: { not: "HIDDEN" } },
    include: { category: true, media: { where: { type: "IMAGE" }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
  });
  if (!vehicle) return { title: "Vehicle Not Found" };

  const title = vehicle.seoTitle || `${vehicle.title} for Sale in Nigeria`;
  const description =
    vehicle.seoDescription ||
    `View the ${vehicle.title} available at C-SPEK MOTORS LTD. Contact us on WhatsApp or by phone for pricing and full details.`;
  const image = vehicle.media[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/vehicles/${vehicle.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/vehicles/${vehicle.slug}`,
      ...(image && { images: [{ url: image, alt: `${vehicle.title} — C-SPEK MOTORS LTD` }] }),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const { slug } = await params;
  const [vehicle, settings] = await Promise.all([
    db.vehicle.findFirst({
      where: { slug, isPublished: true, status: { not: "HIDDEN" } },
      include: vehicleInclude,
    }),
    getSiteSettings(),
  ]);
  if (!vehicle) notFound();

  // If a vehicle post has no media of its own, fall back to the media
  // uploaded for its category (Smart Wizard / Manual category uploads),
  // so posts never render an empty placeholder.
  let galleryMedia = vehicle.media;
  if (galleryMedia.length === 0) {
    galleryMedia = await db.media.findMany({
      where: { categoryId: vehicle.categoryId },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  const s = toPublicSettings(settings);
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const vehicleUrl = `${appUrl}/vehicles/${vehicle.slug}`;
  const whatsappUrl = generateWhatsAppVehicleLink(vehicle.title, vehicleUrl, s.whatsapp);

  const related = await db.vehicle.findMany({
    where: { categoryId: vehicle.categoryId, isPublished: true, status: { not: "HIDDEN" }, id: { not: vehicle.id } },
    include: vehicleInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 3,
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Vehicles", item: `${appUrl}/vehicles` },
      { "@type": "ListItem", position: 3, name: vehicle.category.name, item: `${appUrl}/categories/${vehicle.category.slug}` },
      { "@type": "ListItem", position: 4, name: vehicle.title, item: vehicleUrl },
    ],
  };

  // NOTE: price & detailed specs are intentionally omitted from structured data —
  // the dealership shares pricing directly with customers on enquiry.
  const vehicleLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicle.title,
    brand: { "@type": "Brand", name: vehicle.brand },
    category: vehicle.category.name,
    itemCondition: vehicle.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    image: vehicle.media.filter((m) => m.type === "IMAGE").map((m) => m.url),
    offers: {
      "@type": "Offer",
      availability: vehicle.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: vehicleUrl,
      seller: { "@type": "AutoDealer", name: s.companyName },
    },
  };

  return (
    <div className="bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleLd) }} />

      {/* Breadcrumbs — dark bar keeps the fixed transparent navbar readable */}
      <nav aria-label="Breadcrumb" className="border-b border-white/10 bg-zinc-950">
        <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 pt-24 pb-4 text-sm text-zinc-400 sm:px-6 lg:px-8">
          <li><Link href="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/vehicles" className="hover:text-amber-400 transition-colors">Vehicles</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href={`/categories/${vehicle.category.slug}`} className="hover:text-amber-400 transition-colors">{vehicle.category.name}</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li aria-current="page" className="truncate font-medium text-white">{vehicle.title}</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* Left: media gallery */}
          <div>
            <VehicleGallery media={galleryMedia} title={vehicle.title} />
          </div>

          {/* Right: enquiry panel */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <VehicleStatusBadge status={vehicle.status} />
                {vehicle.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                    <BadgeCheck className="h-3.5 w-3.5" /> Featured
                  </span>
                )}
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700 border border-amber-200">
                  {vehicle.category.name}
                </span>
              </div>

              <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl">
                {vehicle.title}
              </h1>

              <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <MessageCircleQuestion className="h-4.5 w-4.5 text-amber-500" />
                  Price &amp; full details available on request.
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  Our sales team is ready to share pricing, specifications, import details and more — reach out and get a
                  response the same day.
                </p>
              </div>

              <div className="mt-6 space-y-2.5">
                {vehicle.status !== "SOLD" && (
                  <>
                    <VehicleEnquiryButton
                      vehicle={{
                        vehicleId: vehicle.id,
                        vehicleTitle: vehicle.title,
                        vehicleCategory: vehicle.category.name,
                        vehicleSlug: vehicle.slug,
                      }}
                      label="Enquire Now"
                      className="w-full h-12 rounded-full text-base"
                    />
                    <Button asChild className="h-12 w-full rounded-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#1fb857]">
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
                      </a>
                    </Button>
                  </>
                )}
                {vehicle.status === "SOLD" && (
                  <div className="rounded-xl bg-red-50 p-4 text-center">
                    <p className="font-display text-lg font-bold text-red-700">SOLD</p>
                    <p className="mt-1 text-xs leading-relaxed text-red-600/80">
                      This vehicle has been sold. Browse similar vehicles below or contact us — new stock arrives weekly.
                    </p>
                    <Button asChild variant="outline" className="mt-3 w-full rounded-full border-red-200 text-red-700 hover:bg-red-50">
                      <Link href="/vehicles">Browse Available Vehicles</Link>
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2 border-t border-zinc-100 pt-5 text-sm">
                {s.phone && (
                  <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 text-zinc-600 transition-colors hover:text-amber-600">
                    <Phone className="h-4 w-4 text-zinc-400" /> {s.phone}
                  </a>
                )}
                {s.email && (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-2.5 text-zinc-600 transition-colors hover:text-amber-600">
                    <Mail className="h-4 w-4 text-zinc-400" /> {s.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related vehicles */}
        {related.length > 0 && (
          <section className="mt-14" aria-label={`More ${vehicle.category.name}`}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-zinc-950">More From {vehicle.category.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">Similar vehicles you might be interested in.</p>
              </div>
              <Button asChild variant="ghost" className="hidden shrink-0 text-amber-600 hover:text-amber-700 sm:inline-flex">
                <Link href={`/categories/${vehicle.category.slug}`}>View All <ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
