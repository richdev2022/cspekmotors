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
  const existing = await db.siteSettings.findUnique({ where: { id: "main" } });
  if (existing) return existing;
  try {
    return await db.siteSettings.create({ data: { ...DEFAULT_SETTINGS_VALUES, id: "main" } });
  } catch {
    // Race-safe: another request may have created it first
    const created = await db.siteSettings.findUnique({ where: { id: "main" } });
    if (!created) throw new Error("Unable to load site settings.");
    return created;
  }
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
