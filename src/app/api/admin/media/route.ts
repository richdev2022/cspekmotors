import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api-utils";

export const runtime = "nodejs";

/**
 * GET /api/admin/media — all media, grouped Category → Vehicle → Media
 * so admins can always see which media belongs to what.
 */
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
