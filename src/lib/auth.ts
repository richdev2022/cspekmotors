import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { AdminUser } from "@prisma/client";

const COOKIE_NAME = "cspek_admin_token";
const encoder = new TextEncoder();

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    // Dev fallback keeps the app running, but JWT_SECRET should always be set.
    return encoder.encode("cspek-motors-development-secret-fallback");
  }
  return encoder.encode(secret);
}

function getExpiresInDays(): number {
  const days = Number(process.env.JWT_EXPIRES_IN_DAYS);
  return Number.isFinite(days) && days > 0 ? days : 7;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(admin: Pick<AdminUser, "id" | "email" | "role">): Promise<string> {
  return new SignJWT({ sub: admin.id, email: admin.email, role: admin.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${getExpiresInDays()}d`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<{ sub: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.role !== "string") return null;
    return { sub: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getExpiresInDays() * 24 * 60 * 60,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

/** Returns the authenticated admin from the auth cookie, or null. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const admin = await db.adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin || !admin.isActive) return null;
  return admin;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Throws AuthError if the caller is not an authenticated admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AuthError("Authentication required. Please sign in.", 401);
  return admin;
}

/** Throws AuthError if the caller is not a SUPER_ADMIN. */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") throw new AuthError("Super admin privileges required.", 403);
  return admin;
}
