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

    const where: Prisma.ContactMessageWhereInput = {};
    if (status && ["NEW", "READ", "ARCHIVED"].includes(status)) where.status = status;

    const [items, total] = await Promise.all([
      db.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contactMessage.count({ where }),
    ]);

    return jsonOk({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}
