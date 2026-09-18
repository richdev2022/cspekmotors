import { NextRequest, NextResponse } from "next/server";
import { existsSync, statSync, createReadStream } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

/**
 * Serves locally-stored media files: /api/files/<folder>/<filename>
 * Used by the local storage provider (development fallback).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;

  // Sanitize — no traversal, exactly [folder, filename]
  if (!segments || segments.length !== 2 || segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const [folder, filename] = segments;
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
  const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "");
  const full = path.join(UPLOAD_ROOT, safeFolder, safeName);

  if (!full.startsWith(UPLOAD_ROOT) || !existsSync(full)) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const stat = statSync(full);
  const ext = path.extname(full).toLowerCase();
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";
  const range = req.headers.get("range");

  // Support range requests (video seeking)
  if (range) {
    const match = range.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const stream = createReadStream(full, { start, end });
      return new NextResponse(stream as unknown as ReadableStream, {
        status: 206,
        headers: {
          "Content-Type": mime,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  const stream = createReadStream(full);
  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
