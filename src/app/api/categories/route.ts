import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const includeCounts = req.nextUrl.searchParams.get("counts") !== "false";
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      ...(includeCounts
        ? {
            include: {
              _count: {
                select: {
                  vehicles: { where: { isPublished: true, status: { not: "HIDDEN" } } },
                  media: true,
                },
              },
            },
          }
        : {}),
    });
    return jsonOk(categories);
  } catch (err) {
    return handleApiError(err);
  }
}
