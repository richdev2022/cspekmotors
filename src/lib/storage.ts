// ============================================================
// C-SPEK MOTORS LTD — Media storage
// All uploads (admin uploads, enquiry attachments, site assets)
// are written to the local `uploads/` folder in the project root:
//
//   uploads/
//     vehicles/    <- vehicle photos & videos
//     categories/  <- category media
//     enquiries/   <- customer enquiry attachments
//     site/        <- logos, social sharing image, misc assets
//     seed/        <- demo images used by the seed script
//
// Files are served back through GET /api/files/<folder>/<filename>
// (with HTTP range support for video seeking). The folder is part
// of the repository, so anything admins upload is committed along
// with the code when you push to GitHub and stays available.
// ============================================================
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getUploadRoot } from "@/lib/upload-root";

export interface StorageUpload {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folder?: string; // e.g. "vehicles" | "categories" | "enquiries" | "site"
}

export interface StorageResult {
  url: string;          // public URL of the stored file
  filename: string;     // stored filename
  size: number;         // bytes after any optimization
  mimeType: string;
}

export interface StorageProvider {
  readonly name: string;
  upload(input: StorageUpload): Promise<StorageResult>;
  delete(url: string): Promise<void>;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function slugifyFilename(name: string): string {
  const ext = path.extname(name).toLowerCase() || "";
  const base = path
    .basename(name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
  return `${base}${ext}`;
}

function uniqueFilename(original: string): string {
  const clean = slugifyFilename(original);
  const ext = path.extname(clean);
  const base = path.basename(clean, ext);
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${stamp}${rand}${ext}`;
}

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

export function mimeTypeFromFilename(filename: string): string {
  return MIME_BY_EXT[path.extname(filename).toLowerCase()] || "application/octet-stream";
}

async function optimizeImage(buffer: Buffer): Promise<{ buffer: Buffer; ext: string }> {
  try {
    const image = sharp(buffer);
    const meta = await image.metadata();
    // Resize oversized images, keep original format for predictable URLs
    if ((meta.width ?? 0) > 1920) {
      const out = await image.resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
      return { buffer: out, ext: ".jpg" };
    }
    // Re-encode large JPEG/PNG to strip metadata + compress when it meaningfully helps
    if (buffer.length > 400 * 1024 && ["image/jpeg", "image/png"].includes(meta.format ? `image/${meta.format}` : "")) {
      const out = await image.jpeg({ quality: 82 }).toBuffer();
      if (out.length < buffer.length) return { buffer: out, ext: ".jpg" };
    }
    return { buffer, ext: "" };
  } catch {
    return { buffer, ext: "" }; // if sharp fails, store original
  }
}

// ------------------------------------------------------------
// Local provider — writes to <project>/uploads, served by /api/files/*
// Override the location with UPLOAD_DIR if you ever need to.
// ------------------------------------------------------------
const UPLOAD_ROOT = getUploadRoot();

const localProvider: StorageProvider = {
  name: "local",
  async upload({ buffer, filename, mimeType, folder = "misc" }) {
    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "") || "misc";
    let outBuffer = buffer;
    let finalName = uniqueFilename(filename);

    if (mimeType.startsWith("image/")) {
      const optimized = await optimizeImage(buffer);
      outBuffer = optimized.buffer;
      if (optimized.ext) {
        const ext = path.extname(finalName);
        finalName = `${path.basename(finalName, ext)}${optimized.ext}`;
      }
    }

    const dir = path.join(UPLOAD_ROOT, safeFolder);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, finalName), outBuffer);

    return {
      url: `/api/files/${safeFolder}/${finalName}`,
      filename: finalName,
      size: outBuffer.length,
      mimeType,
    };
  },
  async delete(url) {
    // url like /api/files/<folder>/<file>
    const match = url.match(/^\/api\/files\/([a-z0-9_-]+)\/([a-zA-Z0-9._-]+)$/);
    if (!match) return;
    const full = path.join(UPLOAD_ROOT, match[1], match[2]);
    if (existsSync(full)) {
      try { unlinkSync(full); } catch { /* best effort */ }
    }
  },
};

export function getStorageProvider(): StorageProvider {
  return localProvider;
}
