import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { messageUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = messageUpdateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const existing = await db.contactMessage.findUnique({ where: { id } });
    if (!existing) return jsonError("Message not found.", 404);

    const message = await db.contactMessage.update({
      where: { id },
      data: { ...(parsed.data.status && { status: parsed.data.status }) },
    });
    return jsonOk(message);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const existing = await db.contactMessage.findUnique({ where: { id } });
    if (!existing) return jsonError("Message not found.", 404);

    await db.contactMessage.delete({ where: { id } });
    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "DELETE", resource: "CONTACT_MESSAGE",
      resourceId: id, details: `Deleted contact message from ${existing.name}`,
    });
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
