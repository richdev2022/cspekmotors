import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { mediaUpdateSchema } from "@/lib/validation";
import { getStorageProvider } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = mediaUpdateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const existing = await db.media.findUnique({ where: { id } });
    if (!existing) return jsonError("Media not found.", 404);

    const d = parsed.data;

    // Setting primary on a vehicle demotes others
    if (d.isPrimary && existing.vehicleId) {
      await db.media.updateMany({ where: { vehicleId: existing.vehicleId, isPrimary: true }, data: { isPrimary: false } });
    }

    const media = await db.media.update({
      where: { id },
      data: {
        ...(d.caption !== undefined && { caption: d.caption }),
        ...(d.isPrimary !== undefined && { isPrimary: d.isPrimary }),
        ...(d.sortOrder !== undefined && { sortOrder: d.sortOrder }),
        ...(d.vehicleId !== undefined && { vehicleId: d.vehicleId }),
        ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
      },
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "UPDATE", resource: "MEDIA",
      resourceId: id, details: `Updated media "${existing.filename}"`,
    });

    return jsonOk(media);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const existing = await db.media.findUnique({ where: { id } });
    if (!existing) return jsonError("Media not found.", 404);

    await db.media.delete({ where: { id } });
    await getStorageProvider().delete(existing.url).catch(() => {});

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "DELETE", resource: "MEDIA",
      resourceId: id, details: `Deleted media "${existing.filename}"`,
    });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
