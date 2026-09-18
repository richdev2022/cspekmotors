import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonOk } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    await clearAuthCookie();
    return jsonOk({ loggedOut: true });
  } catch (err) {
    return handleApiError(err);
  }
}
