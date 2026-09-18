import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enquiryUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = enquiryUpdateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const existing = await db.enquiry.findUnique({ where: { id } });
    if (!existing) return jsonError("Enquiry not found.", 404);

    const enquiry = await db.enquiry.update({
      where: { id },
      data: { ...(parsed.data.status && { status: parsed.data.status }) },
      include: { attachments: true, vehicle: { select: { id: true, title: true, slug: true } } },
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "UPDATE", resource: "ENQUIRY",
      resourceId: id, details: `Enquiry from ${existing.customerName} → status ${parsed.data.status}`,
    });

    return jsonOk(enquiry);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const existing = await db.enquiry.findUnique({ where: { id } });
    if (!existing) return jsonError("Enquiry not found.", 404);

    await db.enquiry.delete({ where: { id } });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "DELETE", resource: "ENQUIRY",
      resourceId: id, details: `Deleted enquiry from ${existing.customerName}`,
    });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
