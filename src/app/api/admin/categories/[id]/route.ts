import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { categoryUpdateSchema } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { logAudit } from "@/lib/audit";
import { getStorageProvider } from "@/lib/storage";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = categoryUpdateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return jsonError("Category not found.", 404);

    const d = parsed.data;
    let slug = existing.slug;
    if (d.slug !== undefined && d.slug.trim()) {
      const candidate = slugify(d.slug);
      if (candidate !== existing.slug) {
        const taken = await db.category.findFirst({ where: { slug: candidate, id: { not: id } } });
        if (taken) return jsonError("That URL slug is already taken by another category.", 409);
        slug = candidate;
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(slug !== existing.slug && { slug }),
        ...(d.description !== undefined && { description: d.description || null }),
        ...(d.image !== undefined && { image: d.image ? new URL(d.image, req.nextUrl.origin).toString() : null }),
        ...(d.video !== undefined && { video: d.video || null }),
        ...(d.isActive !== undefined && { isActive: d.isActive }),
        ...(d.sortOrder !== undefined && { sortOrder: d.sortOrder }),
      },
      include: { _count: { select: { vehicles: true, media: true } } },
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "UPDATE", resource: "CATEGORY",
      resourceId: category.id, details: `Updated category "${category.name}"`,
    });

    return jsonOk(category);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const existing = await db.category.findUnique({ where: { id }, include: { _count: { select: { vehicles: true } } } });
    if (!existing) return jsonError("Category not found.", 404);

    if (existing._count.vehicles > 0) {
      return jsonError(
        `Cannot delete "${existing.name}" — it still has ${existing._count.vehicles} vehicle(s). Move or delete those vehicles first.`,
        409
      );
    }

    // Clean up category media files (cascade deletes DB rows)
    const mediaFiles = await db.media.findMany({ where: { categoryId: id } });
    await db.category.delete({ where: { id } });

    const storage = getStorageProvider();
    await Promise.all(mediaFiles.filter((m) => !m.vehicleId).map((m) => storage.delete(m.url).catch(() => {})));

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "DELETE", resource: "CATEGORY",
      resourceId: id, details: `Deleted category "${existing.name}"`,
    });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
