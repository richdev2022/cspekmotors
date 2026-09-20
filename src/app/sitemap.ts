import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Auto-generated sitemap — homepage, categories, published vehicles, about & contact.
 * Hidden / unpublished vehicles are excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

  let vehicleEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];

  try {
    const [vehicles, categories] = await Promise.all([
      db.vehicle.findMany({
        where: { isPublished: true, status: { not: "HIDDEN" } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    vehicleEntries = vehicles.map((v) => ({
      url: `${appUrl}/vehicles/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    categoryEntries = categories.map((c) => ({
      url: `${appUrl}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // DB not ready — still emit static routes
  }

  const staticEntries: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/vehicles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${appUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...staticEntries, ...categoryEntries, ...vehicleEntries];
}
