import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { adminUserUpdateSchema } from "@/lib/validation";
import { toSafeAdmin } from "@/types";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireSuperAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const existing = await db.adminUser.findUnique({ where: { id } });
    if (!existing) return jsonError("Admin user not found.", 404);

    const d = parsed.data;
    const user = await db.adminUser.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.role !== undefined && { role: d.role }),
        ...(d.isActive !== undefined && { isActive: d.isActive }),
        ...(d.password && { passwordHash: await hashPassword(d.password) }),
      },
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "UPDATE", resource: "ADMIN_USER",
      resourceId: id, details: `Updated admin account "${user.email}"`,
    });

    return jsonOk(toSafeAdmin(user));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireSuperAdmin();
    const { id } = await ctx.params;

    if (id === admin.id) return jsonError("You cannot delete your own account.", 400);

    const existing = await db.adminUser.findUnique({ where: { id } });
    if (!existing) return jsonError("Admin user not found.", 404);

    // Block only if the deletion itself would leave zero active super admins.
    // (Deleting an INACTIVE super admin is fine even when they are the only
    // other one — they are not an active super admin to begin with.)
    if (existing.role === "SUPER_ADMIN" && existing.isActive) {
      const remainingActiveSuperAdmins = await db.adminUser.count({
        where: { role: "SUPER_ADMIN", isActive: true, id: { not: id } },
      });
      if (remainingActiveSuperAdmins === 0) {
        return jsonError("Cannot delete the last active super admin.", 400);
      }
    }

    await db.adminUser.delete({ where: { id } });
    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "DELETE", resource: "ADMIN_USER",
      resourceId: id, details: `Deleted admin account "${existing.email}"`,
    });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
