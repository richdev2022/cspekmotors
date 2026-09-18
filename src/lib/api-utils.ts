import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details: details ?? undefined }, { status });
}

/**
 * Central API error handler — never leaks raw server/database errors to clients.
 */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first?.path?.length ? `${first.path.join(".")}: ` : "";
    return jsonError(`${field}${first?.message ?? "Invalid input."}`, 422, err.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }
  // Prisma known errors
  const e = err as { code?: string; message?: string };
  if (e?.code === "P2002") return jsonError("A record with this value already exists (must be unique).", 409);
  if (e?.code === "P2025") return jsonError("The requested record was not found.", 404);
  if (e?.code === "P2003") return jsonError("This record is referenced by other records and cannot be deleted.", 409);

  console.error("[API_ERROR]", err);
  return jsonError("Something went wrong on our end. Please try again later.", 500);
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function hostCandidates(req: NextRequest): Set<string> {
  const candidates = new Set<string>();
  const add = (raw?: string | null) => {
    if (!raw) return;
    for (const part of raw.split(",")) {
      const v = part.trim().toLowerCase();
      if (v) candidates.add(v);
    }
  };
  add(req.headers.get("host"));
  add(req.headers.get("x-forwarded-host"));
  if (process.env.APP_URL) {
    try { candidates.add(new URL(process.env.APP_URL).host.toLowerCase()); } catch { /* ignore */ }
  }
  // Optional extra origins (comma-separated, e.g. "https://cspekmotors.com,https://www.cspekmotors.com")
  add(process.env.ALLOWED_ORIGINS);
  return candidates;
}

/**
 * CSRF guard for mutating requests.
 *
 * Browsers always attach Sec-Fetch-Site and it cannot be forged by JavaScript
 * (it is a forbidden header name controlled by the browser). When it says the
 * request was initiated from the same site, we allow it — this keeps the app
 * working behind reverse proxies / preview tunnels where the Host header seen
 * by the server differs from the public Origin.
 *
 * For older browsers (no Sec-Fetch headers) we fall back to comparing the
 * Origin host against Host / X-Forwarded-Host / APP_URL / ALLOWED_ORIGINS.
 * Non-browser clients (curl, server-to-server) send no Origin and pass.
 */
export function assertSameOrigin(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser client (curl, server-to-server)

  const fetchSite = req.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none") return;

  let originHost = "";
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return; // malformed Origin — ignore, cannot be a reliable CSRF vector
  }

  const candidates = hostCandidates(req);
  if (candidates.has(originHost)) return;

  // Only reject when the browser explicitly declared a cross-site request,
  // or when we have usable host info that clearly contradicts the Origin.
  if (fetchSite === "cross-site" || candidates.size > 0) {
    throw new AuthError("Cross-origin request rejected.", 403);
  }
}

// ------------------------------------------------------------
// In-memory rate limiter (per IP + bucket)
// ------------------------------------------------------------
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(req: NextRequest, bucket: string, limit: number, windowMs: number): void {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  existing.count += 1;
  if (existing.count > limit) {
    const retrySec = Math.ceil((existing.resetAt - now) / 1000);
    throw new RateLimitError(`Too many requests. Please try again in ${retrySec}s.`);
  }

  // Opportunistic cleanup to keep memory bounded
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
}

export class RateLimitError extends Error {}

export function parseIntParam(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
