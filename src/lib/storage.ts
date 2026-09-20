// ============================================================
// C-SPEK MOTORS LTD — Media storage
// Vercel Blob is used when BLOB_READ_WRITE_TOKEN is configured. Local
// filesystem storage remains available for development and persistent hosts.
// ============================================================
import { del, put } from "@vercel/blob";
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getUploadRoot } from "@/lib/upload-root";

export interface StorageUpload {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folder?: string; // e.g. "vehicles" | "categories" | "enquiries" | "site"
  multipart?: boolean;
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

async function prepareUpload({ buffer, filename, mimeType }: StorageUpload): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  let outBuffer = buffer;
  let finalName = uniqueFilename(filename);
  let storedMimeType = mimeType;

  if (mimeType.startsWith("image/")) {
    const optimized = await optimizeImage(buffer);
    outBuffer = optimized.buffer;
    if (optimized.ext) {
      const ext = path.extname(finalName);
      finalName = `${path.basename(finalName, ext)}${optimized.ext}`;
      storedMimeType = "image/jpeg";
    }
  }

  return { buffer: outBuffer, filename: finalName, mimeType: storedMimeType };
}

// ------------------------------------------------------------
// Local provider — writes to <project>/uploads, served by /api/files/*
// Override the location with UPLOAD_DIR if you ever need to.
// ------------------------------------------------------------
const UPLOAD_ROOT = getUploadRoot();

const localProvider: StorageProvider = {
  name: "local",
  async upload(input) {
    const { buffer: outBuffer, filename: finalName, mimeType } = await prepareUpload(input);
    const safeFolder = (input.folder ?? "misc").replace(/[^a-z0-9_-]/gi, "") || "misc";
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

const blobProvider: StorageProvider = {
  name: "vercel-blob",
  async upload(input) {
    const { buffer, filename, mimeType } = await prepareUpload(input);
    const safeFolder = (input.folder ?? "misc").replace(/[^a-z0-9_-]/gi, "") || "misc";
    const blob = await put(`${safeFolder}/${filename}`, buffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
      multipart: input.multipart,
    });

    return {
      url: blob.url,
      filename,
      size: buffer.length,
      mimeType,
    };
  },
  async delete(url) {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) return;
      await del(url);
    } catch {
      return;
    }
  },
};

export function getStorageProvider(): StorageProvider {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobProvider;

  const isServerless = process.env.VERCEL === "1"
    || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
    || process.cwd().startsWith("/var/task");
  if (isServerless) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for uploads on serverless deployments.");
  }

  return localProvider;
}
