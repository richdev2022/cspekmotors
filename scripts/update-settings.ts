/**
 * C-SPEK MOTORS LTD — Quick settings updater
 * Kept in sync with the current company contact details.
 * Run: bun run scripts/update-settings.ts
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const data = {
    phone: "08039552546",
    phoneSecondary: "09074884438",
    whatsapp: "2348039552546",
    address: "18, Oguntana Crescent, Gbagada - Lagos",
    mapUrl: "https://maps.google.com/?q=18+Oguntana+Crescent+Gbagada+Lagos+Nigeria",
    logoLight: "/brand/logo-light-bg.png",
    logoDark: "/brand/logo-dark-bg.png",
    socialSharingImage: "/og-image.png",
  };
  const s = await db.siteSettings.upsert({
    where: { id: "main" },
    update: data,
    create: { id: "main", ...data },
  });
  console.log("Settings updated:", {
    phone: s.phone,
    phoneSecondary: s.phoneSecondary,
    whatsapp: s.whatsapp,
    address: s.address,
    mapUrl: s.mapUrl,
  });
}

main().finally(() => db.$disconnect());
