import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/floating-whatsapp";
import { generateWhatsAppGeneralLink } from "@/lib/whatsapp";

export function Hero({
  settings,
}: {
  settings: { companyName: string; tagline: string; whatsapp: string | null };
}) {
  const whatsappUrl = generateWhatsAppGeneralLink(settings.whatsapp);
  // Rotating hero images from seeded media (stored locally)
  const heroImage = "/api/files/seed/hero-1.jpg";

  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden bg-zinc-950" aria-label="Welcome">
      {/* Background image with slow zoom */}
      <div className="absolute inset-0" aria-hidden="true">
        { }
        <img
          src={heroImage}
          alt=""
          className="hero-zoom h-full w-full object-cover opacity-45"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/55 to-zinc-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/40 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="hero-rise inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            {settings.companyName}
          </p>

          <h1 className="hero-rise hero-rise-delay-1 mt-6 font-display text-4xl font-bold leading-[1.08] text-white sm:text-6xl lg:text-7xl text-balance">
            Quality Vehicles.
            <br />
            <span className="text-amber-400">Trusted Deals.</span>
          </h1>

          <p className="hero-rise hero-rise-delay-2 mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            From premium SUVs and family cars to heavy-duty trucks, trailers and buses —
            we stock, inspect and deliver the vehicles that keep Nigeria moving.
          </p>

          <div className="hero-rise hero-rise-delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 rounded-full bg-amber-500 px-8 text-base font-semibold text-zinc-950 hover:bg-amber-600">
              <Link href="/vehicles">
                Explore Vehicles <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-white/25 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>

          <div className="hero-rise hero-rise-delay-3 mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors">
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Instant WhatsApp enquiries
              </a>
            </span>
            <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden="true" />
            <span>Nationwide delivery available</span>
          </div>
        </div>
      </div>
    </section>
  );
}
