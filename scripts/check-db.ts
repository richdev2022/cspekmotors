import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const [vehicles, categories, media, settings, admins, enquiries, messages] = await Promise.all([
    db.vehicle.count(),
    db.category.count(),
    db.media.count(),
    db.siteSettings.findFirst(),
    db.adminUser.findMany({ select: { email: true, name: true, role: true } }),
    db.enquiry.count(),
    db.contactMessage.count(),
  ])
  console.log(JSON.stringify({
    vehicles, categories, media, admins, enquiries, messages,
    settings: settings ? {
      companyName: settings.companyName,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email,
      logo: settings.logo,
      tagline: settings.tagline,
    } : null,
    vehicleSample: (await db.vehicle.findMany({ take: 3, select: { title: true, slug: true, isFeatured: true, isPublished: true, status: true } })),
    categoryList: await db.category.findMany({ select: { name: true, slug: true, image: true }, orderBy: { sortOrder: 'asc' } }),
  }, null, 2))
}
main().finally(() => db.$disconnect())
