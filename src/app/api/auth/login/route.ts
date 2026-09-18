import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { assertSameOrigin, handleApiError, jsonError, jsonOk, rateLimit } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    rateLimit(req, "login", 8, 10 * 60 * 1000); // 8 attempts / 10 min / IP

    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Please enter a valid email address and password.", 422);
    }

    const { email, password } = parsed.data;
    const admin = await db.adminUser.findUnique({ where: { email: email.toLowerCase() } });

    if (!admin || !admin.isActive || !(await verifyPassword(password, admin.passwordHash))) {
      return jsonError("Invalid email or password. Please try again.", 401);
    }

    const token = await createSessionToken(admin);
    await setAuthCookie(token);

    await logAudit({
      adminId: admin.id,
      adminName: admin.name,
      action: "LOGIN",
      resource: "AUTH",
      resourceId: admin.id,
      details: "Signed in to admin dashboard",
    });

    return jsonOk({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });
  } catch (err) {
    return handleApiError(err);
  }
}
