import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { validateUpload, mediaTypeFromMime } from "@/lib/media";
import { getStorageProvider } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * POST /api/admin/media/upload — multipart upload of one or more files.
 * Form fields: files[] (File), vehicleId?, categoryId?, captions?
 * A single-file upload may also include isPrimary=true and caption.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const form = await req.formData().catch(() => null);
    if (!form) return jsonError("Invalid upload request.", 400);

    const vehicleId = form.get("vehicleId")?.toString() || null;
    const categoryId = form.get("categoryId")?.toString() || null;
    const caption = form.get("caption")?.toString() || null;
    const isPrimary = form.get("isPrimary")?.toString() === "true";
    const unlinked = form.get("unlinked")?.toString() === "true"; // site assets (logo, sharing image) — no DB record

    let vehicle: { title: string; categoryId: string } | null = null;
    if (vehicleId) {
      vehicle = await db.vehicle.findUnique({ where: { id: vehicleId }, select: { title: true, categoryId: true } });
      if (!vehicle) return jsonError("Selected vehicle not found.", 404);
    }
    if (categoryId && !unlinked) {
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (!category) return jsonError("Selected category not found.", 404);
    }
    if (!vehicleId && !categoryId && !unlinked) {
      return jsonError("Media must be attached to a vehicle or a category.", 422);
    }

    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return jsonError("Please choose at least one file to upload.", 422);

    const storage = getStorageProvider();
    const saved: { id: string; url: string; filename: string; type: string; mimeType: string | null; fileSize: number | null; caption: string | null; isPrimary: boolean; sortOrder: number; vehicleId: string | null; createdAt: Date }[] = [];
    let primaryUsed = false;

    // If uploading for a vehicle that has no primary image yet, first image becomes primary
    let autoPrimary = false;
    if (vehicleId && files.length > 0) {
      const primaryCount = await db.media.count({ where: { vehicleId, isPrimary: true } });
      autoPrimary = primaryCount === 0;
    }

    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const kind = isVideo ? "video" : "image";
      const validation = validateUpload({ size: file.size, type: file.type, name: file.name }, kind);
      if (!validation.ok) {
        return jsonError(`"${file.name}": ${validation.error}`, 422);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await storage.upload({ buffer, filename: file.name, mimeType: file.type, folder: "vehicles" });

      if (unlinked) {
        // Site asset (logo, sharing image, etc.) — store file only, no DB record
        saved.push({
          id: "", url: result.url, filename: result.filename,
          type: mediaTypeFromMime(file.type), mimeType: file.type, fileSize: result.size,
          caption: null, isPrimary: false, sortOrder: 0, vehicleId: null, createdAt: new Date(),
        });
        continue;
      }

      const makePrimary = (isPrimary && !primaryUsed && !isVideo) || (autoPrimary && !isVideo && !primaryUsed && saved.length === 0);
      if (makePrimary) primaryUsed = true;

      const media = await db.media.create({
        data: {
          vehicleId,
          categoryId: categoryId ?? vehicle?.categoryId ?? null,
          type: mediaTypeFromMime(file.type),
          url: result.url,
          filename: result.filename,
          mimeType: file.type,
          fileSize: result.size,
          caption: caption || null,
          sortOrder: 99, // new uploads go to the end; admin can reorder
          isPrimary: makePrimary,
        },
      });
      saved.push(media);
    }

    // Ensure exactly one primary for the vehicle
    if (vehicleId && primaryUsed) {
      const primary = saved.find((m) => m.isPrimary);
      if (primary) {
        await db.media.updateMany({ where: { vehicleId, isPrimary: true, id: { not: primary.id } }, data: { isPrimary: false } });
      }
    }

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "UPLOAD", resource: "MEDIA",
      resourceId: vehicleId ?? categoryId, details: `Uploaded ${saved.length} file(s)${vehicle ? ` for ${vehicle.title}` : ""}`,
    });

    return jsonOk(saved, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
