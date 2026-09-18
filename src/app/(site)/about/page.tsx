import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, BadgeCheck, HandshakeIcon, Truck, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getSiteSettings, parseBusinessHours } from "@/lib/settings";
import { toPublicSettings } from "@/types";
import { SectionHeading } from "@/components/site/section-heading";
import { CategoryCard } from "@/components/site/category-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us — Trusted Nigerian Automobile Dealership",
  description:
    "Learn about C-SPEK MOTORS LTD — our story, our promise, and why customers across Nigeria trust us for quality cars, SUVs, trucks, trailers, buses and vans.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    db.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { vehicles: { where: { isPublished: true, status: { not: "HIDDEN" } } } } } },
      orderBy: [{ sortOrder: "asc" }],
      take: 8,
    }),
  ]);
  const s = toPublicSettings(settings);
  const hours = parseBusinessHours(settings.businessHours);

  return (
    <div className="bg-zinc-50">
      {/* Header */}
      <section className="relative overflow-hidden bg-zinc-950 py-20 sm:py-28" aria-label="About C-SPEK MOTORS LTD">
        { }
        <img src="/api/files/seed/showroom-1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">About Us</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold text-white sm:text-5xl text-balance">
            The trusted name behind Nigeria&apos;s finest vehicles
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300">
            {s.companyName} is a modern automobile dealership built on one simple promise: quality vehicles,
            honest deals and service that treats every customer like family.
          </p>
        </div>
      </section>

      {/* Who we are */}
      <section className="bg-white py-16" aria-label="Who we are">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="start"
                eyebrow="Who We Are"
                title="A dealership you can rely on"
                description=""
              />
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-600">
                <p>
                  C-SPEK MOTORS LTD has grown into one of the most dependable vehicle dealerships serving
                  customers across Nigeria. From the very beginning, our mission has been simple — to take
                  the stress and guesswork out of buying a vehicle. We believe that whether you are a family
                  looking for a reliable SUV, a business expanding your haulage fleet, or a transport
                  entrepreneur adding buses to your operation, you deserve the same standard of transparency,
                  quality and respect.
                </p>
                <p>
                  Every vehicle on our floor is carefully selected, thoroughly inspected and fully documented
                  before it is listed. Our team walks with you through the entire journey — choosing the right
                  vehicle, understanding total costs, arranging delivery, and supporting you after the sale.
                  That is why the majority of our customers come to us through referrals and repeat business.
                </p>
                <p>
                  We stock a wide range of vehicles across every category — cars, SUVs, trucks, trailers,
                  buses, vans, commercial and specialist vehicles — sourced from trusted local and
                  international channels. When you buy from C-SPEK MOTORS LTD, you buy with confidence.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              { }
              <img src="/api/files/seed/showroom-1.jpg" alt="C-SPEK MOTORS LTD showroom — customers inspecting vehicles" className="aspect-[4/5] w-full rounded-2xl object-cover" loading="lazy" />
              { }
              <img src="/api/files/seed/showroom-2.jpg" alt="Vehicle handover at C-SPEK MOTORS LTD" className="aspect-[4/5] w-full translate-y-6 rounded-2xl object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* What we offer / why choose us */}
      <section className="bg-zinc-50 py-16" aria-label="Why customers choose us">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why Choose Us"
            title="The C-SPEK MOTORS difference"
            description="Four promises we make to every customer who walks through our doors or messages us on WhatsApp."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Inspected & Verified", text: "Multi-point mechanical and documentation checks on every single vehicle we list." },
              { icon: BadgeCheck, title: "Complete Papers", text: "Customs clearance, registration and ownership documents — always in order, always transparent." },
              { icon: HandshakeIcon, title: "Fair, Honest Pricing", text: "What we quote is what you pay. No hidden charges, no surprise fees at handover." },
              { icon: Truck, title: "Nationwide Delivery", text: "Buy from anywhere in Nigeria — we deliver safely to your doorstep with full insurance options." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-zinc-950">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16" aria-label="Our vehicle categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What We Offer"
            title="Vehicles for every need"
            description="From compact city cars to 60-ton haulage solutions — explore our categories."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <CategoryCard key={c.id} name={c.name} slug={c.slug} description={c.description} image={c.image} vehicleCount={c._count.vehicles} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-zinc-950 py-16" aria-label="Contact us">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl text-balance">Let&apos;s find your next vehicle together</h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-400">
                Visit our showroom, give us a call, or send a WhatsApp message — our friendly team is ready
                to help you make the right choice.
              </p>
              <Button asChild className="mt-7 rounded-full bg-amber-500 px-8 font-semibold text-zinc-950 hover:bg-amber-600">
                <Link href="/contact">Get In Touch</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {(s.phone || s.phoneSecondary) && (
                <div className="rounded-2xl bg-white/5 p-5 transition-colors hover:bg-white/10">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><Phone className="h-5 w-5" /></span>
                    <span><span className="block text-xs text-zinc-500">Call us</span>
                      {s.phone && <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="block font-semibold text-white hover:text-amber-400">{s.phone}</a>}
                      {s.phoneSecondary && <a href={`tel:${s.phoneSecondary.replace(/\s/g, "")}`} className="block font-semibold text-white hover:text-amber-400">{s.phoneSecondary}</a>}
                    </span>
                  </div>
                </div>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className="flex items-center gap-4 rounded-2xl bg-white/5 p-5 transition-colors hover:bg-white/10">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><Mail className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-zinc-500">Email us</span><span className="font-semibold text-white">{s.email}</span></span>
                </a>
              )}
              {s.address && (
                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><MapPin className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-zinc-500">Visit us</span><span className="font-semibold text-white">{s.address}</span></span>
                </div>
              )}
              {hours.length > 0 && (
                <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><Clock className="h-5 w-5" /></span>
                  <span className="w-full">
                    <span className="block text-xs text-zinc-500">Opening hours</span>
                    {hours.map((h, i) => (
                      <span key={i} className="flex justify-between text-sm font-medium text-white">
                        <span>{h.days}</span><span className="text-zinc-300">{h.hours}</span>
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
