import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonOk, parseIntParam } from "@/lib/api-utils";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const page = parseIntParam(sp.get("page"), 1);
    const limit = Math.min(50, parseIntParam(sp.get("limit"), 20));
    const status = sp.get("status");
    const search = sp.get("search");

    const where: Prisma.EnquiryWhereInput = {};
    if (status && ["NEW", "CONTACTED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { vehicleName: { contains: search } },
      ];
    }

    const [items, total, statusCounts] = await Promise.all([
      db.enquiry.findMany({
        where,
        include: {
          vehicle: { select: { id: true, title: true, slug: true, price: true, currency: true } },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.enquiry.count({ where }),
      db.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return jsonOk({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
