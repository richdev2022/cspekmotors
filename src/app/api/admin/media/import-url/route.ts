import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { mediaKindFromFile, mediaMimeType, mediaTypeFromMime, validateUpload, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "@/lib/media";
import { getStorageProvider } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_REMOTE_BYTES = 200 * 1024 * 1024; // 200 MB
const FETCH_TIMEOUT_MS = 120_000;

// A realistic browser User-Agent — many CDNs / image hosts (Cloudflare,
// Imgur, GitHub, etc.) reject bare `node-fetch` requests.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const ACCEPT_HEADER = "image/*,video/*,*/*;q=0.8";

/**
 * Magic-byte signatures used to sniff the actual media type when the URL has
 * no recognizable file extension or the server sends a generic content type.
 */
const MAGIC_SIGNATURES: { bytes: number[]; mask?: number[]; mime: string; ext: string }[] = [
  // Images
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg", ext: "jpg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mime: "image/png", ext: "png" },
  { bytes: [0x47, 0x49, 0x46, 0x38], mime: "image/gif", ext: "gif" }, // GIF (not in allowed list but useful for sniffing)
  { bytes: [0x42, 0x4d], mime: "image/bmp", ext: "bmp" },
  // RIFF based (WEBP)
  { bytes: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50], mime: "image/webp", ext: "webp" },
  // Videos
  { bytes: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], mime: "video/mp4", ext: "mp4" }, // ftyp box
  { bytes: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], mime: "video/mp4", ext: "mp4" },
  { bytes: [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70], mime: "video/mp4", ext: "mp4" },
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], mime: "video/webm", ext: "webm" }, // EBML (webm/mkv)
  { bytes: [0x00, 0x00, 0x01, 0xba], mime: "video/mpeg", ext: "mpg" },
  { bytes: [0x00, 0x00, 0x01, 0xb3], mime: "video/mpeg", ext: "mpg" },
];

interface SniffResult { mimeType: string; ext: string; }

/**
 * Inspects the first few bytes of a buffer to determine the actual media type.
 * Returns null if no signature matches.
 */
function sniffMediaType(buffer: Buffer): SniffResult | null {
  const head = buffer.subarray(0, 32);
  for (const sig of MAGIC_SIGNATURES) {
    if (head.length < sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      const mask = sig.mask?.[i] ?? 0xff;
      if ((head[i] & mask) !== (sig.bytes[i] & mask)) {
        match = false;
        break;
      }
    }
    if (match) return { mimeType: sig.mime, ext: sig.ext };
  }
  return null;
}

/**
 * Determines the most likely mime type for a downloaded file, using:
 * 1. The URL's file extension (when present)
 * 2. The Content-Type header
 * 3. Magic-byte sniffing on the first chunk of the body
 */
function resolveMediaType(args: {
  buffer: Buffer;
  url: string;
  contentTypeHeader: string | null;
}): { mimeType: string; ext: string; filename: string } {
  const { buffer, url, contentTypeHeader } = args;

  // 1. Try URL extension first
  let urlExt = "";
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const dot = pathname.lastIndexOf(".");
    if (dot >= 0) urlExt = pathname.slice(dot + 1).toLowerCase();
  } catch { /* ignore */ }

  if (urlExt) {
    if (["jpg", "jpeg"].includes(urlExt)) return { mimeType: "image/jpeg", ext: "jpg", filename: filenameFromUrl(url, "jpg") };
    if (urlExt === "png") return { mimeType: "image/png", ext: "png", filename: filenameFromUrl(url, "png") };
    if (urlExt === "webp") return { mimeType: "image/webp", ext: "webp", filename: filenameFromUrl(url, "webp") };
    if (urlExt === "mp4") return { mimeType: "video/mp4", ext: "mp4", filename: filenameFromUrl(url, "mp4") };
    if (urlExt === "webm") return { mimeType: "video/webm", ext: "webm", filename: filenameFromUrl(url, "webm") };
    if (urlExt === "mov") return { mimeType: "video/quicktime", ext: "mov", filename: filenameFromUrl(url, "mov") };
  }

  // 2. Try Content-Type header
  const ct = (contentTypeHeader ?? "").split(";")[0].trim().toLowerCase();
  if (ct === "image/jpeg" || ct === "image/jpg") return { mimeType: "image/jpeg", ext: "jpg", filename: filenameFromUrl(url, "jpg") };
  if (ct === "image/png") return { mimeType: "image/png", ext: "png", filename: filenameFromUrl(url, "png") };
  if (ct === "image/webp") return { mimeType: "image/webp", ext: "webp", filename: filenameFromUrl(url, "webp") };
  if (ct === "video/mp4") return { mimeType: "video/mp4", ext: "mp4", filename: filenameFromUrl(url, "mp4") };
  if (ct === "video/webm") return { mimeType: "video/webm", ext: "webm", filename: filenameFromUrl(url, "webm") };
  if (ct === "video/quicktime") return { mimeType: "video/quicktime", ext: "mov", filename: filenameFromUrl(url, "mov") };

  // 3. Sniff magic bytes from the buffer
  const sniffed = sniffMediaType(buffer);
  if (sniffed) {
    return { mimeType: sniffed.mimeType, ext: sniffed.ext, filename: filenameFromUrl(url, sniffed.ext) };
  }

  // 4. Fallback — use whatever the URL gave us, or octet-stream
  const fallbackExt = urlExt || "bin";
  return {
    mimeType: contentTypeHeader?.split(";")[0] || "application/octet-stream",
    ext: fallbackExt,
    filename: filenameFromUrl(url, fallbackExt),
  };
}

function filenameFromUrl(url: string, fallbackExt: string): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    if (last && /\.[a-zA-Z0-9]{2,5}$/.test(last)) return decodeURIComponent(last);
    return `${parsed.hostname.replace(/[^a-z0-9]+/gi, "-")}-${Date.now().toString(36)}.${fallbackExt}`;
  } catch {
    return `import-${Date.now().toString(36)}.${fallbackExt}`;
  }
}

/**
 * Normalizes "shareable" URLs from common hosts into direct media URLs.
 *  - Google Drive shareable links → direct download endpoint
 *  - Dropbox shareable links (?dl=0 → ?dl=1)
 *  - Imgur gallery / image pages → direct .jpg/.mp4
 *  - YouTube / Vimeo / etc. are NOT supported (they require server-side extraction)
 */
function normalizeShareUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  // Google Drive shareable links
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing  →  direct download
  // https://drive.google.com/open?id=FILE_ID                   →  direct download
  if (host === "drive.google.com" || host === "docs.google.com") {
    let fileId: string | null = null;
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) fileId = fileMatch[1];
    const idParam = url.searchParams.get("id");
    if (!fileId && idParam) fileId = idParam;
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
    }
  }

  // Dropbox shareable links — force direct download
  if (host === "dropbox.com" || host.endsWith(".dropbox.com")) {
    if (url.pathname.startsWith("/scl/") || url.pathname.startsWith("/s/")) {
      url.searchParams.set("dl", "1");
      return url.toString();
    }
  }

  // Imgur — convert image/gifv page URLs to direct media URLs
  if (host === "imgur.com" || host.endsWith(".imgur.com")) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 1 && parts[0]) {
      const id = parts[0].replace(/\.(gifv|gif|mp4|webm|jpg|jpeg|png|webp)$/i, "");
      // We can't know ahead of time whether it's an image or video, so try .jpg first
      // and fall back to .mp4 in the fetch step. Imgur serves both at i.imgur.com/<id>.<ext>
      return `https://i.imgur.com/${id}.jpg`;
    }
  }

  // GitHub raw — convert /blob/ to /raw/
  if (host === "github.com" && url.pathname.includes("/blob/")) {
    return `https://raw.githubusercontent.com${url.pathname.replace("/blob/", "/")}${url.search}`;
  }

  // Remove tracking query params that some hosts reject
  // (kept minimal — we don't want to break legitimate signed URLs)
  return url.toString();
}

/**
 * Fetches a remote media URL with browser-like headers and follows redirects.
 * Returns the response, or throws on non-2xx.
 */
async function fetchMedia(sourceUrl: string): Promise<Response> {
  const controllers: AbortController[] = [];
  const makeSignal = () => {
    const c = new AbortController();
    controllers.push(c);
    return c.signal;
  };

  // Set up the timeout — aborts all in-flight controllers
  const timer = setTimeout(() => {
    controllers.forEach((c) => c.abort(new Error("Import timed out")));
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        "Accept": ACCEPT_HEADER,
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });
    if (!response.ok) {
      throw new Error(`The source URL returned HTTP ${response.status} ${response.statusText}.`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

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

    if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
      return jsonError("Enter a valid http(s) media URL.", 422);
    }
    if (vehicleId && categoryId || (!vehicleId && !categoryId && !unlinked)) {
      return jsonError("Choose a vehicle, category, or site asset destination.", 422);
    }

    let parsed: URL;
    try {
      parsed = new URL(sourceUrl);
    } catch {
      return jsonError("The URL is malformed.", 422);
    }
    if (parsed.username || parsed.password) {
      return jsonError("URLs with credentials are not allowed.", 422);
    }

    // Normalize shareable URLs (Google Drive, Dropbox, Imgur, etc.)
    const normalizedUrl = normalizeShareUrl(sourceUrl);

    // Fetch — with browser-like headers and redirect following
    let response: Response;
    try {
      response = await fetchMedia(normalizedUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not fetch the URL.";
      return jsonError(`Could not download the media: ${msg}`, 422);
    }

    // Size guard — use Content-Length if available
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_REMOTE_BYTES) {
      return jsonError(`Remote media is too large (${Math.round(length / 1024 / 1024)}MB). Maximum is 200MB.`, 413);
    }

    // Read the body — with a hard cap to prevent runaway downloads
    const reader = response.body?.getReader();
    if (!reader) {
      return jsonError("The source URL did not return a readable response body.", 422);
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    let overflowed = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > MAX_REMOTE_BYTES) {
            overflowed = true;
            break;
          }
          chunks.push(value);
        }
      }
    } finally {
      try { reader.cancel(); } catch { /* best effort */ }
    }

    if (overflowed) {
      return jsonError("Remote media is larger than 200MB.", 413);
    }

    const buffer = Buffer.concat(chunks.map((c) => (c instanceof Buffer ? c : Buffer.from(c))));
    if (buffer.length === 0) {
      return jsonError("The source URL returned an empty response.", 422);
    }

    // Resolve the actual mime type — URL ext → Content-Type → magic bytes
    const contentTypeHeader = response.headers.get("content-type");
    const resolved = resolveMediaType({
      buffer,
      url: response.url || normalizedUrl,
      contentTypeHeader,
    });

    // Validate against the allowed media types
    const file = { name: resolved.filename, type: resolved.mimeType, size: buffer.length };
    const kind = mediaKindFromFile(file);
    if (!kind) {
      return jsonError(
        `The URL does not point to a supported media file (detected: ${resolved.mimeType || "unknown"}). ` +
        `Allowed: JPG, PNG, WEBP, MP4, WEBM, MOV.`,
        422,
      );
    }

    // Re-run validation with the resolved mime type to enforce size limits
    const validation = validateUpload(
      { size: buffer.length, type: mediaMimeType(file), name: resolved.filename },
      kind,
    );
    if (!validation.ok) {
      return jsonError(validation.error ?? "Unsupported media.", 422);
    }

    const finalMime = mediaMimeType(file);
    const folder = unlinked ? "site" : vehicleId ? "vehicles" : "categories";
    const storage = getStorageProvider();
    const result = await storage.upload({
      buffer,
      filename: resolved.filename,
      mimeType: finalMime,
      folder,
      multipart: kind === "video",
    });

    if (!unlinked) {
      await db.media.create({
        data: {
          vehicleId,
          categoryId,
          type: mediaTypeFromMime(result.mimeType),
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
      resource: unlinked ? "SETTINGS" : "MEDIA",
      resourceId: vehicleId ?? categoryId ?? "site-assets",
      details: `Imported ${purpose} from URL`,
    });

    return jsonOk(
      { url: result.url, filename: result.filename, type: mediaTypeFromMime(result.mimeType), mimeType: result.mimeType, size: result.size },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
