import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { getSiteSettings, parseBusinessHours } from "@/lib/settings";
import { toPublicSettings } from "@/types";
import { ContactForm } from "@/components/site/contact-form";
import { WhatsAppIcon } from "@/components/site/floating-whatsapp";
import { generateWhatsAppGeneralLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube, Music2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us — Visit, Call or WhatsApp C-SPEK MOTORS LTD",
  description:
    "Contact C-SPEK MOTORS LTD: phone, WhatsApp, email, showroom address and opening hours. Send us a message and our team will respond promptly.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const s = toPublicSettings(settings);
  const hours = parseBusinessHours(settings.businessHours);
  const whatsappUrl = generateWhatsAppGeneralLink(s.whatsapp);

  const socials = [
    { href: s.facebook, icon: Facebook, label: "Facebook" },
    { href: s.instagram, icon: Instagram, label: "Instagram" },
    { href: s.tiktok, icon: Music2, label: "TikTok" },
    { href: s.twitter, icon: Twitter, label: "X (Twitter)" },
    { href: s.youtube, icon: Youtube, label: "YouTube" },
  ].filter((x) => x.href);

  return (
    <div className="bg-zinc-50">
      <section className="bg-zinc-950 py-16 sm:py-20" aria-label="Contact C-SPEK MOTORS LTD">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Contact Us</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-5xl">We&apos;re here to help</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            Questions about a vehicle, trade-in or fleet purchase? Reach out through any channel below —
            WhatsApp is usually the fastest way to reach our sales team.
          </p>
          <Button asChild className="mt-6 h-12 rounded-full bg-[#25D366] px-7 text-base font-semibold text-white hover:bg-[#1fb857]">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
          </Button>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          {/* Contact details */}
          <div className="space-y-4">
            {(s.phone || s.phoneSecondary) && (
              <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Phone className="h-5 w-5" /></span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-950">Phone</span>
                  {s.phone && (
                    <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="block text-sm text-zinc-500 transition-colors hover:text-amber-600">{s.phone}</a>
                  )}
                  {s.phoneSecondary && (
                    <a href={`tel:${s.phoneSecondary.replace(/\s/g, "")}`} className="block text-sm text-zinc-500 transition-colors hover:text-amber-600">{s.phoneSecondary}</a>
                  )}
                </span>
              </div>
            )}
            {s.whatsapp && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-[#25D366] hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#1fb857]"><WhatsAppIcon className="h-5 w-5" /></span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-950">WhatsApp</span>
                  <span className="text-sm text-zinc-500">+{s.whatsapp} — instant replies during business hours</span>
                </span>
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Mail className="h-5 w-5" /></span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-950">Email</span>
                  <span className="text-sm text-zinc-500">{s.email}</span>
                </span>
              </a>
            )}
            {s.address && (
              <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><MapPin className="h-5 w-5" /></span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-950">Showroom</span>
                  <span className="text-sm text-zinc-500">{s.address}</span>
                  {s.mapUrl && (
                    <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-amber-600 hover:underline">
                      Open in Google Maps →
                    </a>
                  )}
                </span>
              </div>
            )}
            {hours.length > 0 && (
              <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Clock className="h-5 w-5" /></span>
                <span className="w-full">
                  <span className="block text-sm font-semibold text-zinc-950">Opening Hours</span>
                  {hours.map((h, i) => (
                    <span key={i} className="flex justify-between py-0.5 text-sm text-zinc-500">
                      <span>{h.days}</span><span className="font-medium text-zinc-700">{h.hours}</span>
                    </span>
                  ))}
                </span>
              </div>
            )}
            {socials.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <span className="block text-sm font-semibold text-zinc-950">Follow Us</span>
                <div className="mt-3 flex gap-2.5">
                  {socials.map(({ href, icon: Icon, label }) => (
                    <a key={label} href={href ?? "#"} target="_blank" rel="noopener noreferrer" aria-label={`${label} of C-SPEK MOTORS LTD`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-amber-500 hover:text-zinc-950">
                      <Icon className="h-4.5 w-4.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl font-bold text-zinc-950">Send Us a Message</h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              Fill in the form and our team will get back to you within one business day.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
