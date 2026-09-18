import Link from "next/link";
import { ArrowRight, ShieldCheck, BadgeCheck, HandshakeIcon, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { toPublicSettings } from "@/types";
import { Hero } from "@/components/site/hero";
import { VehicleCard } from "@/components/site/vehicle-card";
import { CategoryCard } from "@/components/site/category-card";
import { SectionHeading } from "@/components/site/section-heading";
import { WhatsAppIcon } from "@/components/site/floating-whatsapp";
import { generateWhatsAppGeneralLink } from "@/lib/whatsapp";
import { categoryImageOf, categoryMediaOrderBy } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featured, categories] = await Promise.all([
    getSiteSettings(),
    db.vehicle.findMany({
      where: { isFeatured: true, isPublished: true, status: { not: "HIDDEN" } },
      include: { category: true, media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { vehicles: { where: { isPublished: true, status: { not: "HIDDEN" } } } } },
        media: { orderBy: [...categoryMediaOrderBy] },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  const s = toPublicSettings(settings);
  const whatsappUrl = generateWhatsAppGeneralLink(s.whatsapp);

  return (
    <>
      <Hero settings={{ companyName: s.companyName, tagline: s.tagline, whatsapp: s.whatsapp }} />

      {/* Why choose us */}
      <section className="border-b border-zinc-100 bg-white py-16" aria-label="Why choose C-SPEK MOTORS">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Inspected & Verified", text: "Every vehicle passes a rigorous multi-point inspection before it reaches our showroom floor." },
              { icon: BadgeCheck, title: "Complete Documentation", text: "Clean customs papers and registration — drive away with total peace of mind." },
              { icon: HandshakeIcon, title: "Honest Deals, Real People", text: "Transparent pricing with no hidden charges. Our team guides you from first enquiry to delivery." },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-zinc-950">{f.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured vehicles */}
      <section className="bg-zinc-50 py-16 lg:py-20" aria-label="Featured vehicles">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Handpicked For You"
            title="Featured Vehicles"
            description="Explore a selection of our finest vehicles currently available — inspected, documented and ready for immediate delivery."
          />
          {featured.length > 0 ? (
            <>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.slice(0, 6).map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 font-semibold">
                  <Link href="/vehicles">
                    View All Vehicles <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <p className="font-display text-lg font-semibold text-zinc-800">No featured vehicles available right now</p>
              <p className="mt-2 text-sm text-zinc-500">New stock arrives weekly — browse all vehicles or contact us for exactly what you need.</p>
              <Button asChild className="mt-5 rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
                <Link href="/vehicles">Browse All Vehicles</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16 lg:py-20" aria-label="Vehicle categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Find Your Fit"
            title="Shop By Category"
            description="From family SUVs to heavy-duty trucks and commuter buses — every category, one trusted dealer."
          />
          {categories.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center text-zinc-500">
              Categories are being prepared. Please check back shortly.
            </div>
          )}
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-zinc-950 py-20" aria-label="Contact C-SPEK MOTORS">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 40%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 40%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl text-balance">
            Ready to find your next vehicle?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            Talk to our friendly sales team today. We will help you choose, inspect, finance and deliver —
            anywhere in Nigeria.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 rounded-full bg-amber-500 px-8 py-3.5 font-semibold text-zinc-950 hover:bg-amber-600">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
              </a>
            </Button>
            {s.phone && (
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white hover:bg-white/10 hover:text-white">
                <a href={`tel:${s.phone.replace(/\s/g, "")}`}>
                  <Phone className="h-5 w-5" /> Call {s.phone}
                </a>
              </Button>
            )}
          </div>
          {s.address && (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-500">
              <MapPin className="h-4 w-4 text-amber-500" /> {s.address}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
