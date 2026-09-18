import { getCurrentAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return jsonError("Not authenticated.", 401);
    return jsonOk({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });
  } catch (err) {
    return handleApiError(err);
  }
}
