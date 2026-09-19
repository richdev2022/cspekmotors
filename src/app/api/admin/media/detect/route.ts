import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { maxImageBytes, maxVideoBytes, validateUpload } from "@/lib/media";
import { classifyVehicleMedia, extractVideoFrame, matchCategoryToDb, matchDetectedVehicle } from "@/lib/ai-detect";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/admin/media/detect — AI auto-categorization for one file.
 * Multipart form field: file (image or video).
 * Images are classified directly; a representative frame is extracted
 * from videos with ffmpeg before classification.
 * Always answers 200 with `detected:false` + reason when the AI can't
 * help — the wizard UI falls back to manual selection in that case.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    await requireAdmin();

    const form = await req.formData().catch(() => null);
    if (!form) return jsonError("Invalid detection request.", 400);

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("Please provide a file to analyze.", 422);
    }

    const isVideo = file.type.startsWith("video/");
    const kind = isVideo ? "video" : "image";
    const validation = validateUpload({ size: file.size, type: file.type, name: file.name }, kind);
    if (!validation.ok) return jsonError(`"${file.name}": ${validation.error}`, 422);

    const sizeLimit = isVideo ? maxVideoBytes() : maxImageBytes();
    if (file.size > sizeLimit) {
      return jsonError(`"${file.name}" is too large for AI analysis (max ${Math.round(sizeLimit / 1024 / 1024)}MB). Assign it manually.`, 422);
    }

    const [categories, vehicles] = await Promise.all([
      db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      db.vehicle.findMany({ select: { id: true, title: true, brand: true, model: true, year: true } }),
    ]);
    if (categories.length === 0) {
      return jsonOk({ detected: false, reason: "No categories configured yet." });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let analysisBuffer: Buffer = buffer;
    if (isVideo) {
      let frame: Buffer | null = null;
      try {
        frame = await extractVideoFrame(buffer);
      } catch (err) {
        return jsonOk({
          detected: false,
          reason: err instanceof Error && err.message ? err.message : "Could not read a frame from this video. Assign it manually.",
        });
      }
      if (!frame) {
        return jsonOk({
          detected: false,
          reason: "Could not read a frame from this video. Assign it manually.",
        });
      }
      analysisBuffer = frame;
    }

    let guess;
    try {
      guess = await classifyVehicleMedia(
        analysisBuffer,
        isVideo ? "image/jpeg" : file.type,
        categories.map((c) => c.name),
        vehicles.map((v) => `${v.title} (${v.brand} ${v.model} ${v.year})`),
      );
    } catch (err) {
      console.error("[MEDIA_DETECT] Vision classification failed:", err);
      return jsonOk({
        detected: false,
        reason: err instanceof Error && err.message
          ? err.message
          : "The AI vision service is unavailable right now. Assign this file manually.",
      });
    }

    const match = matchCategoryToDb(guess.category, categories);
    const vehicleMatch = matchDetectedVehicle(guess, vehicles);
    if (!match && !vehicleMatch) {
      return jsonOk({
        detected: false,
        reason: `AI saw: ${guess.description || guess.category} — but no existing vehicle or category matched. Assign it manually.`,
      });
    }

    return jsonOk({
      detected: true,
      categoryId: match?.id,
      categoryName: match?.name,
      vehicleId: vehicleMatch?.id,
      vehicleTitle: vehicleMatch?.title,
      matchConfidence: vehicleMatch ? Math.round(vehicleMatch.confidence * 100) / 100 : undefined,
      brand: guess.brand,
      model: guess.model,
      name: guess.name,
      year: guess.year,
      confidence: Math.round(guess.confidence * 100) / 100,
      description: guess.description,
      analyzed: isVideo ? "video-frame" : "image",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
