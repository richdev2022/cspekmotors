// ============================================================
// File upload validation — types and sizes
// ============================================================

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
] as const;

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];

export function mediaKindFromFile(file: { type: string; name: string }): "image" | "video" | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("video/") || VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (file.type.startsWith("image/") || IMAGE_EXTENSIONS.includes(ext)) return "image";
  return null;
}

export function mediaMimeType(file: { type: string; name: string }): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  return file.type || "application/octet-stream";
}

export function publicMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/api/files/")) return parsed.pathname;
    } catch {
      return null;
    }
    return url;
  }

  return url.startsWith("/") ? url : `/${url}`;
}


function maxMb(kind: "image" | "video"): number {
  const fallback = kind === "image" ? 20 : 200;
  const val = Number(process.env[kind === "image" ? "MEDIA_MAX_IMAGE_MB" : "MEDIA_MAX_VIDEO_MB"]);
  return Number.isFinite(val) && val > 0 ? val : fallback;
}

export function maxImageBytes() { return maxMb("image") * 1024 * 1024; }
export function maxVideoBytes() { return maxMb("video") * 1024 * 1024; }

export interface FileValidation {
  ok: boolean;
  error?: string;
}

export function validateUpload(file: { size: number; type: string; name: string }, kind: "image" | "video" | "attachment"): FileValidation {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (kind === "image") {
    if ((!file.type || !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) && !IMAGE_EXTENSIONS.includes(ext)) {
      return { ok: false, error: `Unsupported image format. Allowed: JPG, JPEG, PNG, WEBP.` };
    }
    if (file.size > maxImageBytes()) {
      return { ok: false, error: `Image is too large. Maximum size is ${maxMb("image")}MB.` };
    }
    return { ok: true };
  }

  if (kind === "video") {
    if ((!file.type || !ALLOWED_VIDEO_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_TYPES)[number])) && !VIDEO_EXTENSIONS.includes(ext)) {
      return { ok: false, error: `Unsupported video format. Allowed: MP4, WEBM, MOV.` };
    }
    if (file.size > maxVideoBytes()) {
      return { ok: false, error: `Video is too large. Maximum size is ${maxMb("video")}MB.` };
    }
    return { ok: true };
  }

  // Customer enquiry attachments — images & PDFs only, small size
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type as (typeof ALLOWED_ATTACHMENT_TYPES)[number]) && !["jpg", "jpeg", "png", "webp", "pdf"].includes(ext)) {
    return { ok: false, error: `Unsupported attachment format. Allowed: JPG, PNG, WEBP, PDF.` };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: `Attachment is too large. Maximum size is 10MB.` };
  }
  return { ok: true };
}

export function mediaTypeFromMime(mimeType: string): "IMAGE" | "VIDEO" {
  return mimeType.startsWith("video/") ? "VIDEO" : "IMAGE";
}
