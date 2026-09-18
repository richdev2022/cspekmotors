import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const notHidden = { isPublished: true, status: { not: "HIDDEN" } };

    const [totalVehicles, availableVehicles, soldVehicles, reservedVehicles, categories, totalEnquiries, newEnquiries, inProgressEnquiries, totalMedia, recentVehicles, recentEnquiries, recentMedia, vehiclesByCategory] =
      await Promise.all([
        db.vehicle.count(),
        db.vehicle.count({ where: { status: "AVAILABLE" } }),
        db.vehicle.count({ where: { status: "SOLD" } }),
        db.vehicle.count({ where: { status: "RESERVED" } }),
        db.category.count(),
        db.enquiry.count(),
        db.enquiry.count({ where: { status: "NEW" } }),
        db.enquiry.count({ where: { status: "IN_PROGRESS" } }),
        db.media.count(),
        db.vehicle.findMany({
          include: { category: true, media: { where: { isPrimary: true }, take: 1 } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        db.enquiry.findMany({ include: { vehicle: { select: { slug: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
        db.media.findMany({
          include: { vehicle: { select: { title: true, slug: true } } },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        db.category.findMany({
          where: { isActive: true },
          select: { name: true, _count: { select: { vehicles: { where: notHidden } } } },
          orderBy: { sortOrder: "asc" },
        }),
      ]);

    return jsonOk({
      stats: {
        totalVehicles,
        availableVehicles,
        soldVehicles,
        reservedVehicles,
        categories,
        totalEnquiries,
        newEnquiries,
        inProgressEnquiries,
        totalMedia,
      },
      recentVehicles,
      recentEnquiries,
      recentMedia,
      vehiclesByCategory: vehiclesByCategory.map((c) => ({ name: c.name, count: c._count.vehicles })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
