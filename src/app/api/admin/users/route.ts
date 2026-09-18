import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonOk } from "@/lib/api-utils";
import { adminUserCreateSchema } from "@/lib/validation";
import { toSafeAdmin } from "@/types";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSuperAdmin();
    const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
    return jsonOk(users.map(toSafeAdmin));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireSuperAdmin();
    const body = await req.json().catch(() => null);
    const parsed = adminUserCreateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const { name, email, password, role } = parsed.data;
    const exists = await db.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return handleApiError({ code: "P2002" });

    const user = await db.adminUser.create({
      data: { name, email: email.toLowerCase(), passwordHash: await hashPassword(password), role },
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "CREATE", resource: "ADMIN_USER",
      resourceId: user.id, details: `Created admin account "${user.email}" (${role})`,
    });

    return jsonOk(toSafeAdmin(user), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
