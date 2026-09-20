"use client";

import { upload as uploadBlob } from "@vercel/blob/client";
import { api, ApiResult } from "@/lib/api-client";
import { mediaKindFromFile, mediaMimeType, validateUpload } from "@/lib/media";

// ------------------------------------------------------------
// Capability cache — avoids repeated GETs to the config endpoint
// ------------------------------------------------------------
let blobCapability: boolean | null = null;
let blobCapabilityPromise: Promise<boolean> | null = null;

/**
 * Checks whether the server has Vercel Blob direct upload enabled.
 * Caches the result for the session.
 */
export async function isBlobUploadEnabled(): Promise<boolean> {
  if (blobCapability !== null) return blobCapability;
  if (blobCapabilityPromise) return blobCapabilityPromise;

  blobCapabilityPromise = (async () => {
    try {
      const res = await api.get<{ blobEnabled: boolean }>("/api/admin/media/upload-client");
      const enabled = Boolean(res.ok && res.data?.blobEnabled);
      blobCapability = enabled;
      return enabled;
    } catch {
      blobCapability = false;
      return false;
    }
  })();
  return blobCapabilityPromise;
}

export interface UploadOptions {
  /** Vehicle ID to attach the media to (optional). */
  vehicleId?: string;
  /** Category ID to attach the media to (optional). */
  categoryId?: string;
  /** Site asset (logo, hero image, etc.) — no DB record. */
  unlinked?: boolean;
  /** Site asset purpose (e.g. "logoLight", "hero", "share"). */
  purpose?: string;
  /** Called with progress 0–100. */
  onProgress?: (pct: number) => void;
}

export interface UploadResult {
  url: string;
  filename?: string;
  contentType?: string;
  size?: number;
}

/**
 * Universal upload helper — handles both Vercel Blob and local storage modes.
 *
 * **Vercel Blob mode** (`BLOB_READ_WRITE_TOKEN` is set on the server):
 *   1. Uses `@vercel/blob/client`'s `upload()` to upload the file DIRECTLY to
 *      Vercel Blob (bypasses the Vercel Function body size limit of 4.5MB).
 *   2. After the Blob upload succeeds, sends a small JSON "register" request
 *      to `/api/admin/media/upload-client` to create the DB record. This is
 *      more reliable than relying on the `onUploadCompleted` callback (which
 *      requires `VERCEL_BLOB_CALLBACK_URL` to be set and publicly reachable).
 *
 * **Local mode** (no Blob token — local dev / VPS / persistent disk):
 *   Sends a regular multipart request to the same endpoint, which stores the
 *      file via the configured storage provider and creates the DB record.
 *
 * Either way, the caller receives `{ url }` and the DB record is created.
 */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  // Client-side validation — fail fast before any network call
  const kind = mediaKindFromFile(file);
  if (!kind) {
    throw new Error("Unsupported media format. Allowed: JPG, PNG, WEBP, MP4, WEBM, MOV.");
  }
  const mimeType = mediaMimeType(file);
  const validation = validateUpload({ size: file.size, type: mimeType, name: file.name }, kind);
  if (!validation.ok) {
    throw new Error(validation.error ?? "Unsupported file.");
  }

  const useBlob = await isBlobUploadEnabled();

  if (useBlob) {
    // Direct-to-Blob upload — bypasses the Vercel Function body size limit
    const clientPayload = JSON.stringify({
      vehicleId: options.vehicleId,
      categoryId: options.categoryId,
      unlinked: options.unlinked === true,
      purpose: options.purpose,
      fileSize: file.size,
      fileType: file.type,
    });
    const path = options.unlinked
      ? `site/${options.purpose ?? "asset"}-${crypto.randomUUID()}-${file.name}`
      : `${options.vehicleId ? "vehicles" : "categories"}/${crypto.randomUUID()}-${file.name}`;
    const blob = await uploadBlob(path, file, {
      access: "public",
      multipart: kind === "video",
      handleUploadUrl: "/api/admin/media/upload-client",
      clientPayload,
      onUploadProgress: ({ percentage }) => options.onProgress?.(Math.round(percentage)),
    });

    // Register the upload in the DB — small JSON request, never hits body size limit
    if (!options.unlinked) {
      try {
        const regRes = await api.post<{ ok: boolean }>("/api/admin/media/upload-client", {
          action: "register",
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          fileSize: file.size,
          vehicleId: options.vehicleId,
          categoryId: options.categoryId,
        });
        if (!regRes.ok) {
          // Don't throw — the file is uploaded to Blob successfully;
          // the admin can re-link it from the media library if needed.
          console.warn("[upload] DB register failed:", regRes.error);
        }
      } catch (err) {
        console.warn("[upload] DB register error:", err);
      }
    }

    return {
      url: blob.url,
      filename: blob.pathname.split("/").pop(),
      contentType: blob.contentType,
      size: file.size,
    };
  }

  // Local multipart upload — works for any file size up to the server's limit
  const fd = new FormData();
  fd.append("file", file);
  if (options.vehicleId) fd.append("vehicleId", options.vehicleId);
  if (options.categoryId) fd.append("categoryId", options.categoryId);
  if (options.unlinked) fd.append("unlinked", "true");
  if (options.purpose) fd.append("purpose", options.purpose);

  const res: ApiResult<UploadResult> = await api.upload<UploadResult>(
    "/api/admin/media/upload-client",
    fd,
    options.onProgress,
  );
  if (!res.ok || !res.data?.url) {
    throw new Error(res.error ?? "Upload failed. Please try again.");
  }
  return res.data;
}

/**
 * Convenience helper to upload multiple files in parallel.
 * Returns per-file results so partial failures don't lose successes.
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions = {},
): Promise<{ file: File; result?: UploadResult; error?: string }[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const result = await uploadFile(file, options);
        return { file, result };
      } catch (err) {
        return { file, error: err instanceof Error ? err.message : "Upload failed." };
      }
    }),
  );
  return results;
}
