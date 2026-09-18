import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonOk } from "@/lib/api-utils";
import { categoryCreateSchema } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

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
        image: d.image || null,
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
