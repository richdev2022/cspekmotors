import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonOk, parseIntParam } from "@/lib/api-utils";
import { vehicleCreateSchema } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { logAudit } from "@/lib/audit";
import { parseSpecifications } from "@/types";
import { vehicleInclude } from "@/lib/vehicles";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || `vehicle-${Date.now()}`;
  let candidate = root;
  let n = 1;
  // Loop with DB check — slugs are unique
  while (await db.vehicle.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
    if (n > 50) { candidate = `${root}-${Date.now().toString(36)}`; break; }
  }
  return candidate;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const page = parseIntParam(sp.get("page"), 1);
    const limit = Math.min(60, parseIntParam(sp.get("limit"), 15));
    const status = sp.get("status");
    const category = sp.get("category");
    const search = sp.get("search");
    const featured = sp.get("featured");

    const where: Prisma.VehicleWhereInput = {};
    if (status && ["AVAILABLE", "RESERVED", "SOLD", "HIDDEN"].includes(status)) where.status = status;
    if (category) where.category = { OR: [{ slug: category }, { id: category }] };
    if (featured === "true") where.isFeatured = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        include: { category: true, media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.vehicle.count({ where }),
    ]);

    return jsonOk({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = vehicleCreateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const d = parsed.data;
    const slug = await uniqueSlug(d.slug || `${d.title}-${d.year}`);

    const vehicle = await db.vehicle.create({
      data: {
        title: d.title,
        slug,
        brand: d.brand,
        model: d.model,
        year: d.year,
        categoryId: d.categoryId,
        price: d.price ?? null,
        currency: d.currency,
        condition: d.condition,
        status: d.status,
        location: d.location || null,
        shortDescription: d.shortDescription || null,
        description: d.description || null,
        mileage: d.mileage ?? null,
        transmission: d.transmission || null,
        fuelType: d.fuelType || null,
        engine: d.engine || null,
        colour: d.colour || null,
        bodyType: d.bodyType || null,
        driveType: d.driveType || null,
        seats: d.seats ?? null,
        specifications: JSON.stringify(d.specifications),
        isFeatured: d.isFeatured,
        isPublished: d.isPublished,
        seoTitle: d.seoTitle || `${d.title} for Sale in Nigeria | C-SPEK MOTORS LTD`,
        seoDescription: d.seoDescription || d.shortDescription || null,
        seoKeywords: d.seoKeywords || null,
      },
      include: vehicleInclude,
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "CREATE", resource: "VEHICLE",
      resourceId: vehicle.id, details: `Added vehicle "${vehicle.title}"`,
    });

    return jsonOk({ ...vehicle, specifications: parseSpecifications(vehicle.specifications) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
