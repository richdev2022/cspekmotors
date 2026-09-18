import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Youtube, Music2 } from "lucide-react";
import type { PublicSettings } from "@/types";
import { parseBusinessHours } from "@/lib/settings";

export function Footer({ settings }: { settings: PublicSettings }) {
  const hours = parseBusinessHours(settings.businessHours);
  const socials = [
    { href: settings.facebook, icon: Facebook, label: "Facebook" },
    { href: settings.instagram, icon: Instagram, label: "Instagram" },
    { href: settings.tiktok, icon: Music2, label: "TikTok" },
    { href: settings.twitter, icon: Twitter, label: "X (Twitter)" },
    { href: settings.youtube, icon: Youtube, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-auto bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            { }
            <img
              src={settings.logoDark || "/brand/logo-dark-bg.png"}
              alt={`${settings.companyName} logo`}
              className="h-12 w-auto"
            />
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {settings.companyName} is your trusted partner for quality vehicles in Nigeria — cars, SUVs,
              trucks, trailers, buses and vans, all inspected and ready for the road.
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex gap-2.5">
                {socials.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${label}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-amber-500 hover:text-zinc-950 transition-colors"
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <nav aria-label="Footer navigation">
            <h3 className="text-white font-display font-semibold text-base">Quick Links</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/vehicles", label: "All Vehicles" },
                { href: "/categories", label: "Vehicle Categories" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact Us" },
                { href: "/admin/login", label: "Staff Login" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-zinc-400 hover:text-amber-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-white font-display font-semibold text-base">Contact Us</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              {settings.phone && (
                <li className="flex gap-3">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-amber-400 transition-colors">{settings.phone}</a>
                </li>
              )}
              {settings.phoneSecondary && (
                <li className="flex gap-3">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-transparent" />
                  <a href={`tel:${settings.phoneSecondary.replace(/\s/g, "")}`} className="hover:text-amber-400 transition-colors">{settings.phoneSecondary}</a>
                </li>
              )}
              {settings.email && (
                <li className="flex gap-3">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  <a href={`mailto:${settings.email}`} className="hover:text-amber-400 transition-colors">{settings.email}</a>
                </li>
              )}
              {settings.address && (
                <li className="flex gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Hours */}
          {hours.length > 0 && (
            <div>
              <h3 className="text-white font-display font-semibold text-base">Opening Hours</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {hours.map((row, i) => (
                  <li key={i} className="flex gap-3 text-zinc-400">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                    <span className="flex-1 flex justify-between gap-4">
                      <span>{row.days}</span>
                      <span className="text-zinc-300">{row.hours}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
          <p>Quality Vehicles. Trusted Deals.</p>
        </div>
      </div>
    </footer>
  );
}
