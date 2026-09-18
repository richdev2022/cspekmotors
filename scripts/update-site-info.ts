/**
 * C-SPEK MOTORS LTD — One-off site info + admin credentials update
 *  - Address:      18, Oguntana Crescent, Gbagada - Lagos
 *  - Phone lines:  08039552546  /  09074884438
 *  - Admin password: Cspek@2026 (for every admin account)
 * Run: bun run scripts/update-site-info.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // --- Site settings ---
  const s = await db.siteSettings.upsert({
    where: { id: "main" },
    update: {
      phone: "08039552546",
      phoneSecondary: "09074884438",
      whatsapp: "2348039552546",
      address: "18, Oguntana Crescent, Gbagada - Lagos",
      mapUrl: "https://maps.google.com/?q=18+Oguntana+Crescent+Gbagada+Lagos+Nigeria",
    },
    create: {
      id: "main",
      phone: "08039552546",
      phoneSecondary: "09074884438",
      whatsapp: "2348039552546",
      address: "18, Oguntana Crescent, Gbagada - Lagos",
      mapUrl: "https://maps.google.com/?q=18+Oguntana+Crescent+Gbagada+Lagos+Nigeria",
    },
  });
  console.log("✓ Settings:", { phone: s.phone, phoneSecondary: s.phoneSecondary, address: s.address, mapUrl: s.mapUrl });

  // --- Admin password ---
  const admins = await db.adminUser.findMany({ select: { id: true, email: true } });
  const passwordHash = await bcrypt.hash("Cspek@2026", 12);
  for (const a of admins) {
    await db.adminUser.update({ where: { id: a.id }, data: { passwordHash } });
    console.log(`✓ Password updated for ${a.email}`);
  }
}

main().finally(() => db.$disconnect());
