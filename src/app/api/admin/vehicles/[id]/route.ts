import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { vehicleUpdateSchema } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { logAudit } from "@/lib/audit";
import { parseSpecifications } from "@/types";
import { vehicleInclude } from "@/lib/vehicles";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const vehicle = await db.vehicle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { ...vehicleInclude, media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
    if (!vehicle) return jsonError("Vehicle not found.", 404);
    return jsonOk({ ...vehicle, specifications: parseSpecifications(vehicle.specifications) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = vehicleUpdateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const existing = await db.vehicle.findUnique({ where: { id } });
    if (!existing) return jsonError("Vehicle not found.", 404);

    const d = parsed.data;

    // Optional custom slug — validate uniqueness if changing
    let slug = existing.slug;
    if (d.slug !== undefined && d.slug.trim()) {
      const candidate = slugify(d.slug);
      if (candidate !== existing.slug) {
        const taken = await db.vehicle.findFirst({ where: { slug: candidate, id: { not: id } } });
        if (taken) return jsonError("That URL slug is already taken by another vehicle.", 409);
        slug = candidate;
      }
    }

    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        ...(d.title !== undefined && { title: d.title }),
        ...(slug !== existing.slug && { slug }),
        ...(d.brand !== undefined && { brand: d.brand }),
        ...(d.model !== undefined && { model: d.model }),
        ...(d.year !== undefined && { year: d.year }),
        ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
        ...(d.price !== undefined && { price: d.price }),
        ...(d.currency !== undefined && { currency: d.currency }),
        ...(d.condition !== undefined && { condition: d.condition }),
        ...(d.status !== undefined && { status: d.status }),
        ...(d.location !== undefined && { location: d.location || null }),
        ...(d.shortDescription !== undefined && { shortDescription: d.shortDescription || null }),
        ...(d.description !== undefined && { description: d.description || null }),
        ...(d.mileage !== undefined && { mileage: d.mileage }),
        ...(d.transmission !== undefined && { transmission: d.transmission || null }),
        ...(d.fuelType !== undefined && { fuelType: d.fuelType || null }),
        ...(d.engine !== undefined && { engine: d.engine || null }),
        ...(d.colour !== undefined && { colour: d.colour || null }),
        ...(d.bodyType !== undefined && { bodyType: d.bodyType || null }),
        ...(d.driveType !== undefined && { driveType: d.driveType || null }),
        ...(d.seats !== undefined && { seats: d.seats }),
        ...(d.specifications !== undefined && { specifications: JSON.stringify(d.specifications) }),
        ...(d.isFeatured !== undefined && { isFeatured: d.isFeatured }),
        ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
        ...(d.publishDetails !== undefined && { publishDetails: d.publishDetails }),
        ...(d.seoTitle !== undefined && { seoTitle: d.seoTitle || null }),
        ...(d.seoDescription !== undefined && { seoDescription: d.seoDescription || null }),
        ...(d.seoKeywords !== undefined && { seoKeywords: d.seoKeywords || null }),
      },
      include: vehicleInclude,
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "UPDATE", resource: "VEHICLE",
      resourceId: vehicle.id, details: `Updated vehicle "${vehicle.title}"`,
    });

    return jsonOk({ ...vehicle, specifications: parseSpecifications(vehicle.specifications) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const existing = await db.vehicle.findUnique({ where: { id } });
    if (!existing) return jsonError("Vehicle not found.", 404);

    // Media rows + enquiry links are handled by FK rules (Cascade / SetNull).
    // Local files referenced by this vehicle are cleaned up best-effort.
    const mediaFiles = await db.media.findMany({ where: { vehicleId: id } });
    await db.vehicle.delete({ where: { id } });

    const { getStorageProvider } = await import("@/lib/storage");
    const storage = getStorageProvider();
    await Promise.all(mediaFiles.map((m) => storage.delete(m.url).catch(() => {})));

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "DELETE", resource: "VEHICLE",
      resourceId: id, details: `Deleted vehicle "${existing.title}" and ${mediaFiles.length} media files`,
    });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
