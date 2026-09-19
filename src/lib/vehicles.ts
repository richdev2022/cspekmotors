import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { publicMediaUrl } from "@/lib/media";
import type { Paginated, VehicleListParams, VehicleWithRelations } from "@/types";

// ------------------------------------------------------------
// Shared vehicle query builder — used by public and admin APIs
// ------------------------------------------------------------
export function buildVehicleWhere(params: VehicleListParams): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {};

  if (!params.includeHidden) {
    where.isPublished = true;
    where.status = { not: "HIDDEN" };
  } else if (params.status && ["AVAILABLE", "RESERVED", "SOLD", "HIDDEN"].includes(params.status)) {
    where.status = params.status;
  } else if (params.status && ["AVAILABLE", "RESERVED", "SOLD"].includes(params.status)) {
    where.status = params.status;
  }

  if (params.featured) where.isFeatured = true;
  if (params.condition && ["NEW", "USED"].includes(params.condition)) where.condition = params.condition;

  if (params.category) {
    where.category = { OR: [{ slug: params.category }, { id: params.category }] };
  }

  if (params.search) {
    const q = params.search.trim();
    where.OR = [
      { title: { contains: q } },
      { brand: { contains: q } },
      { model: { contains: q } },
      { description: { contains: q } },
      { shortDescription: { contains: q } },
      { location: { contains: q } },
      { year: { equals: Number(q) || -1 } },
      { category: { is: { name: { contains: q } } } },
    ];
  }

  return where;
}

const SORT_MAP: Record<string, Prisma.VehicleOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ price: { sort: "asc", nulls: "last" } as never }, { createdAt: "desc" }],
  "price-desc": [{ price: { sort: "desc", nulls: "last" } as never }, { createdAt: "desc" }],
  "year-desc": [{ year: "desc" }, { createdAt: "desc" }],
  "title-asc": [{ title: "asc" }],
};

export const vehicleInclude = {
  category: true,
  media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.VehicleInclude;

export async function queryVehicles(params: VehicleListParams): Promise<Paginated<VehicleWithRelations>> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(60, Math.max(1, params.limit ?? 12));
  const where = buildVehicleWhere(params);

  const [items, total] = await Promise.all([
    db.vehicle.findMany({
      where,
      include: vehicleInclude,
      orderBy: SORT_MAP[params.sort ?? "newest"] ?? SORT_MAP.newest,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.vehicle.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

// ------------------------------------------------------------
// Public vehicle sanitizer — the dealership does NOT publish
// price or technical details; customers are asked to make an
// enquiry. Only title, category, availability and media are
// exposed on public endpoints.
// ------------------------------------------------------------
export type PublicVehicle = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  media: VehicleWithRelations["media"];
  createdAt: Date;
};

export function toPublicVehicle(vehicle: VehicleWithRelations): PublicVehicle {
  return {
    id: vehicle.id,
    title: vehicle.title,
    slug: vehicle.slug,
    status: vehicle.status,
    isFeatured: vehicle.isFeatured,
    category: {
      id: vehicle.category.id,
      name: vehicle.category.name,
      slug: vehicle.category.slug,
    },
    media: vehicle.media,
    createdAt: vehicle.createdAt,
  };
}

export function primaryImageOf(vehicle: VehicleWithRelations): string | null {
  const primary = vehicle.media.find((m) => m.isPrimary && m.type === "IMAGE") ?? vehicle.media.find((m) => m.type === "IMAGE");
  return primary?.url ?? null;
}

// ------------------------------------------------------------
// Category-level media — uploads attached to a category itself.
// These appear on the public category page gallery and as the
// category card cover; vehicle posts without their own photos
// fall back to them.
// ------------------------------------------------------------
export const categoryMediaOrderBy = [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] as const;

export function categoryImageOf(
  category: { image?: string | null; media?: { url: string; type: string; isPrimary: boolean }[] },
): string | null {
  if (category.image) return publicMediaUrl(category.image);
  const images = (category.media ?? []).filter((m) => m.type === "IMAGE");
  return publicMediaUrl(images.find((m) => m.isPrimary)?.url ?? images[0]?.url);
}
