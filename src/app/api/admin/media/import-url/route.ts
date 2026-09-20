import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { mediaKindFromFile, mediaMimeType, mediaTypeFromMime, validateUpload } from "@/lib/media";
import { getStorageProvider } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 120;
const MAX_REMOTE_BYTES = 200 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json();
    const sourceUrl = typeof body.url === "string" ? body.url.trim() : "";
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : null;
    const categoryId = typeof body.categoryId === "string" ? body.categoryId : null;
    const unlinked = body.unlinked === true;
    const purpose = typeof body.purpose === "string" ? body.purpose : "site";
    if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) return jsonError("Enter a valid http(s) media URL.", 422);
    if (vehicleId && categoryId || (!vehicleId && !categoryId && !unlinked)) return jsonError("Choose a vehicle, category, or site asset destination.", 422);
    const parsed = new URL(sourceUrl);
    if (parsed.username || parsed.password) return jsonError(" URLs with credentials are not allowed.", 422);
    const response = await fetch(parsed, { redirect: "follow", signal: AbortSignal.timeout(90_000) });
    if (!response.ok) return jsonError(`The source URL returned ${response.status}.`, 422);
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_REMOTE_BYTES) return jsonError("Remote media is larger than 200 MB.", 413);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_REMOTE_BYTES) return jsonError("Remote media is larger than 200 MB.", 413);
    const pathname = new URL(response.url).pathname;
    const filename = pathname.split("/").pop() || `${purpose}-${Date.now()}`;
    const mime = response.headers.get("content-type")?.split(";")[0] || undefined;
    const file = new File([buffer], filename, { type: mime || "application/octet-stream" });
    const kind = mediaKindFromFile(file);
    if (!kind) return jsonError("The URL must point to a supported image or video.", 422);
    const validation = validateUpload({ size: file.size, type: mediaMimeType(file), name: file.name }, kind);
    if (!validation.ok) return jsonError(validation.error ?? "Unsupported media.", 422);
    const result = await getStorageProvider().upload({ buffer, filename: file.name, mimeType: mediaMimeType(file), folder: unlinked ? "site" : vehicleId ? "vehicles" : "categories", multipart: kind === "video" });
    if (!unlinked) {
      await db.media.create({ data: { vehicleId, categoryId, type: mediaTypeFromMime(result.mimeType), url: result.url, filename: result.filename, mimeType: result.mimeType, fileSize: result.size, sortOrder: 99, isPrimary: false } });
    }
    await logAudit({ adminId: admin.id, adminName: admin.name, action: "UPLOAD", resource: unlinked ? "SETTINGS" : "MEDIA", resourceId: vehicleId ?? categoryId ?? "site-assets", details: `Imported ${purpose} from URL` });
    return jsonOk({ url: result.url, filename: result.filename, type: mediaTypeFromMime(result.mimeType) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
