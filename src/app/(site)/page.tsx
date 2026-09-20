import Link from "next/link";
import { ArrowRight, ShieldCheck, BadgeCheck, HandshakeIcon, Phone, MapPin, Truck, Wrench, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { toPublicSettings } from "@/types";
import { Hero } from "@/components/site/hero";
import { VehicleCard } from "@/components/site/vehicle-card";
import { CategoryCard } from "@/components/site/category-card";
import { SectionHeading } from "@/components/site/section-heading";
import { WhatsAppIcon } from "@/components/site/floating-whatsapp";
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  HoverLift,
  Counter,
  Parallax,
  ScrollProgress,
  BackToTop,
} from "@/components/site/animations";
import { generateWhatsAppGeneralLink } from "@/lib/whatsapp";
import { categoryImageOf, categoryMediaOrderBy } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featured, categories, vehicleCount, categoryCount] = await Promise.all([
    getSiteSettings(),
    db.vehicle.findMany({
      where: { isFeatured: true, isPublished: true, status: { not: "HIDDEN" } },
      include: { category: true, media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }).catch(() => []),
    db.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { vehicles: { where: { isPublished: true, status: { not: "HIDDEN" } } } } },
        media: { orderBy: [...categoryMediaOrderBy] },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }).catch(() => []),
    db.vehicle.count({ where: { isPublished: true, status: { not: "HIDDEN" } } }).catch(() => 0),
    db.category.count({ where: { isActive: true } }).catch(() => 0),
  ]);
  const s = toPublicSettings(settings);
  const whatsappUrl = generateWhatsAppGeneralLink(s.whatsapp);

  const features = [
    { icon: ShieldCheck, title: "Inspected & Verified", text: "Every vehicle passes a rigorous multi-point inspection before it reaches our showroom floor." },
    { icon: BadgeCheck, title: "Complete Documentation", text: "Clean customs papers and registration — drive away with total peace of mind." },
    { icon: HandshakeIcon, title: "Honest Deals, Real People", text: "Transparent pricing with no hidden charges. Our team guides you from first enquiry to delivery." },
  ];

  const stats = [
    { icon: Truck, value: vehicleCount || 0, label: "Vehicles in stock", suffix: "+" },
    { icon: Users, value: categoryCount || 0, label: "Vehicle categories", suffix: "" },
    { icon: Wrench, value: 100, label: "Inspection points", suffix: "%" },
    { icon: Clock, value: 24, label: "Hour response time", suffix: "h" },
  ];

  return (
    <>
      <ScrollProgress />
      <Hero settings={{ companyName: s.companyName, tagline: s.tagline, whatsapp: s.whatsapp, heroImage: s.heroImage }} />

      {/* Why choose us */}
      <section className="border-b border-zinc-100 bg-white py-16 lg:py-24" aria-label="Why choose C-SPEK MOTORS">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Why Choose Us"
              title="Three promises behind every vehicle"
              description="We have built our reputation on three non-negotiable principles — and they show up in every vehicle we sell."
            />
          </Reveal>
          <StaggerGroup className="mt-12 grid gap-8 sm:grid-cols-3">
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <HoverLift className="group h-full rounded-2xl border border-zinc-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-xl">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white">
                    <f.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-zinc-950">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">{f.text}</p>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Stats band */}
      <section className="relative overflow-hidden bg-zinc-950 py-16" aria-label="By the numbers">
        <Parallax
          speed={0.15}
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 35%), radial-gradient(circle at 80% 30%, #f59e0b 0%, transparent 35%)",
            }}
          />
        </Parallax>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaggerGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.label} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-sm font-medium uppercase tracking-wider text-zinc-400">{stat.label}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Featured vehicles */}
      <section className="bg-zinc-50 py-16 lg:py-24" aria-label="Featured vehicles">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Handpicked For You"
              title="Featured Vehicles"
              description="Explore a selection of our finest vehicles currently available — inspected, documented and ready for immediate delivery."
            />
          </Reveal>
          {featured.length > 0 ? (
            <>
              <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.slice(0, 6).map((v) => (
                  <StaggerItem key={v.id}>
                    <HoverLift intensity={8} className="h-full">
                      <VehicleCard vehicle={v} />
                    </HoverLift>
                  </StaggerItem>
                ))}
              </StaggerGroup>
              <Reveal delay={0.1} className="mt-10 text-center">
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 font-semibold transition-transform hover:scale-105">
                  <Link href="/vehicles">
                    View All Vehicles <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Reveal>
            </>
          ) : (
            <Reveal className="mt-10">
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
                <p className="font-display text-lg font-semibold text-zinc-800">No featured vehicles available right now</p>
                <p className="mt-2 text-sm text-zinc-500">New stock arrives weekly — browse all vehicles or contact us for exactly what you need.</p>
                <Button asChild className="mt-5 rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
                  <Link href="/vehicles">Browse All Vehicles</Link>
                </Button>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16 lg:py-24" aria-label="Vehicle categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Find Your Fit"
              title="Shop By Category"
              description="From family SUVs to heavy-duty trucks and commuter buses — every category, one trusted dealer."
            />
          </Reveal>
          {categories.length > 0 ? (
            <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c) => (
                <StaggerItem key={c.id}>
                  <HoverLift intensity={6} className="h-full">
                    <CategoryCard
                      name={c.name}
                      slug={c.slug}
                      description={c.description}
                      image={categoryImageOf(c)}
                      vehicleCount={c._count.vehicles}
                    />
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center text-zinc-500">
              Categories are being prepared. Please check back shortly.
            </div>
          )}
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-zinc-950 py-24" aria-label="Contact C-SPEK MOTORS">
        <Parallax
          speed={0.25}
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 40%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 40%)",
            }}
          />
        </Parallax>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl text-balance">
              Ready to find your next vehicle?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
              Talk to our friendly sales team today. We will help you choose, inspect, finance and deliver —
              anywhere in Nigeria.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-13 rounded-full bg-amber-500 px-8 py-3.5 font-semibold text-zinc-950 transition-transform hover:scale-105 hover:bg-amber-600">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
                </a>
              </Button>
              {s.phone && (
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white transition-transform hover:scale-105 hover:bg-white/10 hover:text-white">
                  <a href={`tel:${s.phone.replace(/\s/g, "")}`}>
                    <Phone className="h-5 w-5" /> Call {s.phone}
                  </a>
                </Button>
              )}
            </div>
          </Reveal>
          {s.address && (
            <Reveal delay={0.3}>
              <p className="mt-8 inline-flex items-center gap-2 text-sm text-zinc-500">
                <MapPin className="h-4 w-4 text-amber-500" /> {s.address}
              </p>
            </Reveal>
          )}
        </div>
      </section>

      <BackToTop />
    </>
  );
}
