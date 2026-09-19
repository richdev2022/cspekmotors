import { db } from "@/lib/db";
import type { SiteSettings } from "@prisma/client";

export interface BusinessHourRow {
  days: string;
  hours: string;
}

export const DEFAULT_SETTINGS_VALUES = {
  id: "main",
  companyName: "C-SPEK MOTORS LTD",
  tagline: "Quality Vehicles. Trusted Deals.",
  phone: "08039552546",
  phoneSecondary: "09074884438",
  whatsapp: "2348039552546",
  email: "info@cspekmotors.com",
  address: "18, Oguntana Crescent, Gbagada - Lagos",
  logoLight: "/brand/logo-light-bg.png",
  logoDark: "/brand/logo-dark-bg.png",
  socialSharingImage: "/og-image.png",
  heroImage: null,
  businessHours: JSON.stringify([
    { days: "Monday – Friday", hours: "8:00 AM – 6:00 PM" },
    { days: "Saturday", hours: "9:00 AM – 4:00 PM" },
    { days: "Sunday", hours: "Closed" },
  ] as BusinessHourRow[]),
  mapUrl: "https://maps.google.com/?q=18+Oguntana+Crescent+Gbagada+Lagos+Nigeria",
  websiteTitle: "C-SPEK MOTORS LTD — Quality Vehicles. Trusted Deals.",
  websiteDescription:
    "C-SPEK MOTORS LTD is a trusted Nigerian automobile dealership offering quality cars, SUVs, trucks, trailers, buses and vans. Browse verified inventory and enquire directly on WhatsApp.",
};

/** Fetches the single settings row, creating defaults on first access. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const existing = await db.siteSettings.findUnique({ where: { id: "main" } });
    if (existing) return existing;
    try {
      return await db.siteSettings.create({ data: { ...DEFAULT_SETTINGS_VALUES, id: "main" } });
    } catch {
      const created = await db.siteSettings.findUnique({ where: { id: "main" } });
      if (created) return created;
    }
  } catch {
    // Public pages should remain readable while the database is unavailable.
  }

  return {
    ...DEFAULT_SETTINGS_VALUES,
    logo: null,
    phoneSecondary: DEFAULT_SETTINGS_VALUES.phoneSecondary,
    facebook: null,
    instagram: null,
    tiktok: null,
    twitter: null,
    youtube: null,
    seoDefaultTitle: null,
    seoDefaultDescription: null,
    updatedAt: new Date(),
  } as SiteSettings;
}

export function parseBusinessHours(json?: string | null): BusinessHourRow[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter((r) => r && typeof r.days === "string" && typeof r.hours === "string");
    }
  } catch { /* ignore malformed */ }
  return [];
}
