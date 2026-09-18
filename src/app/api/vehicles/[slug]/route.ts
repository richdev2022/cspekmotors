import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicleInclude, toPublicVehicle } from "@/lib/vehicles";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const vehicle = await db.vehicle.findFirst({
      where: { slug, isPublished: true, status: { not: "HIDDEN" } },
      include: vehicleInclude,
    });
    if (!vehicle) return jsonError("Vehicle not found. It may have been sold or unpublished.", 404);

    // Fire-and-forget view counter
    db.vehicle.update({ where: { id: vehicle.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    const related = await db.vehicle.findMany({
      where: { categoryId: vehicle.categoryId, isPublished: true, status: { not: "HIDDEN" }, id: { not: vehicle.id } },
      include: vehicleInclude,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 4,
    });

    // Public payload — price & technical details are never exposed
    return jsonOk({ vehicle: toPublicVehicle(vehicle), related: related.map(toPublicVehicle) });
  } catch (err) {
    return handleApiError(err);
  }
}
