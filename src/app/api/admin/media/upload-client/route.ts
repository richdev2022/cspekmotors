import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";
import { getStorageProvider } from "@/lib/storage";
import { mediaKindFromFile, mediaMimeType, mediaTypeFromMime, validateUpload } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Hybrid upload endpoint that supports two protocols:
 *
 * 1. **Vercel Blob direct upload** (when `BLOB_READ_WRITE_TOKEN` is set)
 *    - Client uses `@vercel/blob/client`'s `upload()` helper.
 *    - First request is JSON to obtain a token, then the client uploads
 *      directly to Vercel Blob storage.
 *
 * 2. **Local multipart upload** (no Blob token — local dev / VPS / persistent disk)
 *    - Client sends a regular multipart form-data request with the file.
 *    - The route stores the file via the configured storage provider
 *      (local filesystem by default) and returns a Blob-like response so
 *      the client shape stays compatible.
 *
 * The route detects the protocol by inspecting the `Content-Type` header.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();

    const contentType = req.headers.get("content-type") ?? "";

    // ------------------------------------------------------------------
    // Vercel Blob path — JSON body
    // ------------------------------------------------------------------
    if (contentType.includes("application/json")) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return jsonError("Direct Blob upload is not available — please use multipart upload instead.", 400);
      }

      const body = await req.json().catch(() => null);
      if (!body) return jsonError("Invalid upload request body.", 400);

      // ----------------------------------------------------------------
      // Register action — create DB record after a successful Blob upload
      // ----------------------------------------------------------------
      // The client calls this after `@vercel/blob/client`'s `upload()`
      // returns, because the `onUploadCompleted` callback requires
      // `VERCEL_BLOB_CALLBACK_URL` to be set (and publicly reachable),
      // which is not always practical. The register action is a simpler,
      // more reliable way to ensure the DB record is created.
      if (body.action === "register") {
        const url = typeof body.url === "string" ? body.url : "";
        const pathname = typeof body.pathname === "string" ? body.pathname : "";
        const contentTypeStr = typeof body.contentType === "string" ? body.contentType : "application/octet-stream";
        const fileSize = typeof body.fileSize === "number" ? body.fileSize : null;
        const vehicleId = typeof body.vehicleId === "string" && body.vehicleId ? body.vehicleId : null;
        const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null;

        if (!url) return jsonError("Missing blob URL.", 422);
        if (!vehicleId && !categoryId) {
          // Site asset — no DB record needed, just log the audit
          await logAudit({
            adminId: admin.id,
            adminName: admin.name,
            action: "UPLOAD",
            resource: "SETTINGS",
            resourceId: "site-assets",
            details: `Registered site asset upload`,
          });
          return jsonOk({ ok: true });
        }

        // Verify vehicle/category exist
        if (vehicleId) {
          const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId }, select: { title: true, categoryId: true } });
          if (!vehicle) return jsonError("Selected vehicle not found.", 404);
        }
        if (categoryId) {
          const category = await db.category.findUnique({ where: { id: categoryId }, select: { name: true } });
          if (!category) return jsonError("Selected category not found.", 404);
        }

        const filename = pathname.split("/").pop() || pathname || url.split("/").pop() || "upload";
        const type = contentTypeStr.startsWith("video/") ? "VIDEO" : "IMAGE";

        // Avoid duplicate DB records if the client retries the register call
        const existing = await db.media.findFirst({
          where: { url },
          select: { id: true },
        });
        if (existing) {
          return jsonOk({ ok: true, id: existing.id, duplicate: true });
        }

        const media = await db.media.create({
          data: {
            vehicleId,
            categoryId,
            type,
            url,
            filename,
            mimeType: contentTypeStr,
            fileSize,
            sortOrder: 99,
            isPrimary: false,
          },
        });

        await logAudit({
          adminId: admin.id,
          adminName: admin.name,
          action: "UPLOAD",
          resource: "MEDIA",
          resourceId: vehicleId ?? categoryId ?? "media-assets",
          details: `Registered ${type.toLowerCase()} upload from Blob`,
        });

        return jsonOk({ ok: true, id: media.id });
      }

      // ----------------------------------------------------------------
      // Default: handle the @vercel/blob/client token request flow
      // ----------------------------------------------------------------
      const result = await handleUpload({
        request: req,
        body,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const payload = parsePayload(clientPayload);
          const vehicle = payload.vehicleId
            ? await db.vehicle.findUnique({ where: { id: payload.vehicleId }, select: { id: true, title: true, categoryId: true } })
            : null;
          const category = payload.categoryId
            ? await db.category.findUnique({ where: { id: payload.categoryId }, select: { id: true, name: true } })
            : null;
          if (!payload.unlinked && !vehicle && !category) throw new Error("A valid vehicle or category is required for uploads.");
          const isSiteAsset = payload.unlinked === true;
          const allowed = isSiteAsset
            ? /\.(jpg|jpeg|png|webp)$/i
            : /\.(mp4|webm|mov|jpg|jpeg|png|webp)$/i;
          if (!allowed.test(pathname)) {
            throw new Error(isSiteAsset
              ? "Only JPG, PNG and WEBP images are supported."
              : "Only MP4, WEBM, MOV, JPG, PNG and WEBP files are supported.");
          }
          return {
            allowedContentTypes: isSiteAsset
              ? ["image/jpeg", "image/png", "image/webp"]
              : ["video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png", "image/webp"],
            maximumSizeInBytes: 200 * 1024 * 1024,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({
              ...payload,
              adminId: admin.id,
              adminName: admin.name,
              vehicleTitle: vehicle?.title ?? category?.name,
            }),
            // callbackUrl is required for onUploadCompleted to fire.
            // We use the register action (above) as a more reliable fallback,
            // but still set a callback URL in case VERCEL_BLOB_CALLBACK_URL
            // is configured on the deployment.
            ...(process.env.APP_URL ? {
              callbackUrl: `${process.env.APP_URL.replace(/\/$/, "")}/api/admin/media/upload-client`,
            } : {}),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          const payload = parsePayload(tokenPayload);
          const filename = blob.pathname.split("/").pop() || blob.pathname;
          if (payload.unlinked) {
            await logAudit({
              adminId: payload.adminId ?? admin.id,
              adminName: payload.adminName ?? admin.name,
              action: "UPLOAD",
              resource: "SETTINGS",
              resourceId: "site-assets",
              details: `Uploaded ${payload.purpose ?? "site"} asset`,
            });
            return;
          }
          const type = blob.contentType?.startsWith("video/") ? "VIDEO" : "IMAGE";
          // Avoid duplicates — the client may also call the register action
          const existing = await db.media.findFirst({ where: { url: blob.url }, select: { id: true } });
          if (existing) return;
          await db.media.create({
            data: {
              vehicleId: payload.vehicleId ?? null,
              categoryId: payload.categoryId ?? null,
              type,
              url: blob.url,
              filename,
              mimeType: blob.contentType,
              fileSize: payload.fileSize ?? null,
              sortOrder: 99,
              isPrimary: false,
            },
          });
          await logAudit({
            adminId: payload.adminId ?? null,
            adminName: payload.adminName ?? "Admin",
            action: "UPLOAD",
            resource: "MEDIA",
            resourceId: payload.vehicleId ?? payload.categoryId ?? "media-assets",
            details: `Uploaded ${type.toLowerCase()} for ${payload.vehicleTitle ?? "category"}`,
          });
        },
      });
      return NextResponse.json(result);
    }

    // ------------------------------------------------------------------
    // Local multipart path — direct file upload via storage provider
    // ------------------------------------------------------------------
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData().catch(() => null);
      if (!form) return jsonError("Invalid upload request — expected multipart form data.", 400);

      // Support two payload shapes:
      // 1. JSON string in a `clientPayload` field (matches Vercel Blob shape)
      // 2. Individual form fields: vehicleId, categoryId, unlinked, purpose
      let payload: UploadPayload = { unlinked: false };
      const rawPayload = form.get("clientPayload")?.toString();
      if (rawPayload) {
        try {
          payload = parsePayload(rawPayload);
        } catch {
          return jsonError("Invalid client payload.", 400);
        }
      } else {
        payload = {
          vehicleId: form.get("vehicleId")?.toString().trim() || undefined,
          categoryId: form.get("categoryId")?.toString().trim() || undefined,
          unlinked: form.get("unlinked")?.toString() === "true",
          purpose: form.get("purpose")?.toString() || undefined,
        };
      }

      if (!payload.unlinked && !payload.vehicleId && !payload.categoryId) {
        return jsonError("A vehicle or category is required for uploads.", 422);
      }

      // Verify vehicle/category exist
      let vehicleTitle: string | undefined;
      let categoryName: string | undefined;
      if (payload.vehicleId) {
        const vehicle = await db.vehicle.findUnique({ where: { id: payload.vehicleId }, select: { title: true, categoryId: true } });
        if (!vehicle) return jsonError("Selected vehicle not found.", 404);
        vehicleTitle = vehicle.title;
      }
      if (payload.categoryId) {
        const category = await db.category.findUnique({ where: { id: payload.categoryId }, select: { name: true } });
        if (!category) return jsonError("Selected category not found.", 404);
        categoryName = category.name;
      }

      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return jsonError("No file received. Please choose a file to upload.", 422);
      }

      const kind = mediaKindFromFile(file);
      if (!kind) {
        return jsonError("Unsupported media format. Allowed: JPG, PNG, WEBP, MP4, WEBM, MOV.", 422);
      }
      const mimeType = mediaMimeType(file);
      const validation = validateUpload({ size: file.size, type: mimeType, name: file.name }, kind);
      if (!validation.ok) {
        return jsonError(validation.error ?? "Unsupported file.", 422);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const storage = getStorageProvider();
      const result = await storage.upload({
        buffer,
        filename: file.name,
        mimeType,
        folder: payload.unlinked ? "site" : payload.vehicleId ? "vehicles" : "categories",
        multipart: kind === "video",
      });

      const type = mediaTypeFromMime(result.mimeType);

      if (!payload.unlinked) {
        await db.media.create({
          data: {
            vehicleId: payload.vehicleId ?? null,
            categoryId: payload.categoryId ?? null,
            type,
            url: result.url,
            filename: result.filename,
            mimeType: result.mimeType,
            fileSize: result.size,
            sortOrder: 99,
            isPrimary: false,
          },
        });
      }

      await logAudit({
        adminId: admin.id,
        adminName: admin.name,
        action: "UPLOAD",
        resource: payload.unlinked ? "SETTINGS" : "MEDIA",
        resourceId: payload.vehicleId ?? payload.categoryId ?? "site-assets",
        details: `Uploaded ${kind} ${payload.unlinked ? "site asset" : `for ${vehicleTitle ?? categoryName ?? ""}`}`.trim(),
      });

      // Return a Blob-like response so the client shape stays compatible
      return NextResponse.json({
        url: result.url,
        pathname: `${payload.unlinked ? "site" : payload.vehicleId ? "vehicles" : "categories"}/${result.filename}`,
        contentType: result.mimeType,
        contentDisposition: `inline; filename="${result.filename}"`,
        size: result.size,
        uploadedAt: new Date().toISOString(),
      });
    }

    return jsonError("Unsupported request — expected JSON or multipart form data.", 415);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * GET /api/admin/media/upload-client — quick capability check.
 * Returns whether Vercel Blob direct upload is available.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: { blobEnabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
  });
}

interface UploadPayload {
  vehicleId?: string;
  categoryId?: string;
  purpose?: string;
  unlinked?: boolean;
  fileSize?: number;
  fileType?: string;
  adminId?: string;
  adminName?: string;
  vehicleTitle?: string;
}

function parsePayload(value: string | null | undefined): UploadPayload {
  const payload = value ? JSON.parse(value) : null;
  if (!payload || (!payload.unlinked && typeof payload.vehicleId !== "string" && typeof payload.categoryId !== "string")) {
    throw new Error("A vehicle or category is required for uploads.");
  }
  return payload;
}
