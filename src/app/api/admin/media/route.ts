import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { getStorageProvider } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * GET /api/admin/media — all media, grouped Category → Vehicle → Media
 * so admins can always see which media belongs to what.
 */
export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0) : [];
    if (ids.length === 0) return jsonError("Select at least one media item.", 400);
    const media = await db.media.findMany({ where: { id: { in: ids } } });
    if (media.length !== ids.length) return jsonError("One or more media items were not found.", 404);
    await db.media.deleteMany({ where: { id: { in: ids } } });
    const storage = getStorageProvider();
    await Promise.all(media.map((item) => storage.delete(item.url).catch(() => {})));
    await logAudit({ adminId: admin.id, adminName: admin.name, action: "DELETE", resource: "MEDIA", details: `Bulk deleted ${media.length} media items` });
    return jsonOk({ deleted: media.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const type = req.nextUrl.searchParams.get("type"); // IMAGE | VIDEO
    const where = type && ["IMAGE", "VIDEO"].includes(type) ? { type } : {};

    const [categories, unassigned] = await Promise.all([
      db.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          media: { where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          vehicles: {
            orderBy: { createdAt: "desc" },
            include: { media: { where, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } },
          },
        },
      }),
      db.media.findMany({
        where: { ...where, vehicleId: null, categoryId: null },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return jsonOk({ categories, unassigned });
  } catch (err) {
    return handleApiError(err);
  }
}
