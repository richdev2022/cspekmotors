import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { categoryCreateSchema } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { logAudit } from "@/lib/audit";
import { publicMediaUrl } from "@/lib/media";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0) : [];
    if (ids.length === 0) return jsonError("Select at least one category.", 400);
    const categories = await db.category.findMany({ where: { id: { in: ids } }, include: { _count: { select: { vehicles: true } } } });
    if (categories.length !== ids.length) return jsonError("One or more categories were not found.", 404);
    const blocked = categories.find((category) => category._count.vehicles > 0);
    if (blocked) return jsonError(`Cannot delete "${blocked.name}" because it still contains vehicles.`, 409);
    await db.category.deleteMany({ where: { id: { in: ids } } });
    await logAudit({ adminId: admin.id, adminName: admin.name, action: "DELETE", resource: "CATEGORY", details: `Bulk deleted ${categories.length} categories` });
    return jsonOk({ deleted: categories.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: {
            vehicles: true,
            media: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return jsonOk(categories);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const d = parsed.data;
    const base = slugify(d.slug || d.name);
    const taken = await db.category.findUnique({ where: { slug: base } });
    const slug = taken ? `${base}-${Date.now().toString(36)}` : base;

    const category = await db.category.create({
      data: {
        name: d.name,
        slug,
        description: d.description || null,
        image: publicMediaUrl(d.image),
        video: d.video || null,
        isActive: d.isActive,
        sortOrder: d.sortOrder,
      },
      include: { _count: { select: { vehicles: true, media: true } } },
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "CREATE", resource: "CATEGORY",
      resourceId: category.id, details: `Created category "${category.name}"`,
    });

    return jsonOk(category, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
