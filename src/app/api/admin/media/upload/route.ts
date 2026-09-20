import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { validateUpload, mediaKindFromFile, mediaMimeType, mediaTypeFromMime } from "@/lib/media";
import { getStorageProvider } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILES_PER_REQUEST = 100;

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

    const vehicleId = form.get("vehicleId")?.toString().trim() || null;
    const categoryId = form.get("categoryId")?.toString().trim() || null;
    const caption = form.get("caption")?.toString() || null;
    const isPrimary = form.get("isPrimary")?.toString() === "true";
    const unlinked = form.get("unlinked")?.toString() === "true"; // site assets (logo, sharing image) — no DB record

    let vehicle: { title: string; categoryId: string } | null = null;
    if (vehicleId && categoryId) return jsonError("Attach the files to a vehicle OR a category — not both.", 422);
    if (!vehicleId && !categoryId && !unlinked) return jsonError("Choose a vehicle or a category to attach the files to.", 422);
    if (vehicleId) {
      vehicle = await db.vehicle.findUnique({ where: { id: vehicleId }, select: { title: true, categoryId: true } });
      if (!vehicle) return jsonError("Selected vehicle not found.", 404);
    }
    if (categoryId && !unlinked) {
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (!category) return jsonError("Selected category not found.", 404);
    }
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return jsonError("Please choose at least one file to upload.", 422);
    if (files.length > MAX_FILES_PER_REQUEST) return jsonError(`Too many files at once — upload up to ${MAX_FILES_PER_REQUEST} per request.`, 422);

    const storage = getStorageProvider();
    const saved: { id: string; url: string; filename: string; type: string; mimeType: string | null; fileSize: number | null; caption: string | null; isPrimary: boolean; sortOrder: number; vehicleId: string | null; createdAt: Date }[] = [];
    const failed: { filename: string; error: string }[] = [];
    let primaryUsed = false;

    // If uploading for a vehicle that has no primary image yet, first image becomes primary
    let autoPrimary = false;
    if (vehicleId && files.length > 0) {
      const primaryCount = await db.media.count({ where: { vehicleId, isPrimary: true } });
      autoPrimary = primaryCount === 0;
    }

    for (const file of files) {
      const kind = mediaKindFromFile(file);
      if (!kind) {
        failed.push({ filename: file.name, error: "Unsupported media format. Allowed: JPG, PNG, WEBP, MP4, WEBM, MOV." });
        continue;
      }
      const mimeType = mediaMimeType(file);
      const isVideo = kind === "video";
      const validation = validateUpload({ size: file.size, type: mimeType, name: file.name }, kind);
      if (!validation.ok) {
        failed.push({ filename: file.name, error: validation.error ?? "Unsupported file." });
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await storage.upload({
          buffer,
          filename: file.name,
          mimeType,
          folder: vehicleId ? "vehicles" : categoryId ? "categories" : "site",
        });

        if (unlinked) {
        // Site asset (logo, sharing image, etc.) — store file only, no DB record
        saved.push({
          id: "", url: result.url, filename: result.filename,
          type: mediaTypeFromMime(result.mimeType), mimeType: result.mimeType, fileSize: result.size,
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
          type: mediaTypeFromMime(mimeType),
          url: result.url,
          filename: result.filename,
          mimeType: result.mimeType,
          fileSize: result.size,
          caption: caption || null,
          sortOrder: 99, // new uploads go to the end; admin can reorder
          isPrimary: makePrimary,
        },
      });
        saved.push(media);
      } catch (err) {
        failed.push({ filename: file.name, error: err instanceof Error && err.message ? err.message : "Storage failed for this file." });
      }
    }

    if (saved.length === 0) {
      const first = failed[0];
      return jsonError(first ? `"${first.filename}": ${first.error}` : "No files were uploaded.", 422);
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
      resourceId: vehicleId ?? categoryId, details: `Uploaded ${saved.length} file(s)${vehicle ? ` for ${vehicle.title}` : ""}${failed.length ? ` (${failed.length} failed)` : ""}`,
    });

    return jsonOk(unlinked ? saved : { saved, failed, count: saved.length }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
