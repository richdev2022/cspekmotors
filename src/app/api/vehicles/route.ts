import { NextRequest } from "next/server";
import { queryVehicles, toPublicVehicle } from "@/lib/vehicles";
import { handleApiError, jsonOk, parseIntParam } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const result = await queryVehicles({
      category: sp.get("category") || undefined,
      search: sp.get("search") || undefined,
      featured: sp.get("featured") === "true" ? true : undefined,
      status: sp.get("status") || undefined,
      condition: sp.get("condition") || undefined,
      sort: sp.get("sort") || undefined,
      page: parseIntParam(sp.get("page"), 1),
      limit: parseIntParam(sp.get("limit"), 12),
    });
    // Public payload — price & technical details are never exposed
    return jsonOk({ ...result, items: result.items.map(toPublicVehicle) });
  } catch (err) {
    return handleApiError(err);
  }
}
