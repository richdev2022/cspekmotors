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
    const limit = Math.min(100, parseIntParam(sp.get("limit"), 30));
    const resource = sp.get("resource");

    const where: Prisma.AuditLogWhereInput = {};
    if (resource) where.resource = resource;

    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    return jsonOk({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}
