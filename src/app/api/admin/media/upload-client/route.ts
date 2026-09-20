import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json();
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
        if (!payload.unlinked && !vehicle && !category) throw new Error("A valid vehicle or category is required for video uploads.");
        const isSiteImage = payload.unlinked === true;
        if (isSiteImage && !/\.(jpg|jpeg|png|webp)$/i.test(pathname)) throw new Error("Only JPG, PNG and WEBP images are supported.");
        if (!isSiteImage && !/\.(mp4|webm|mov)$/i.test(pathname)) throw new Error("Only MP4, WEBM and MOV videos are supported.");
        return {
          allowedContentTypes: isSiteImage ? ["image/jpeg", "image/png", "image/webp"] : ["video/mp4", "video/webm", "video/quicktime"],
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ...payload, adminId: admin.id, adminName: admin.name, vehicleTitle: vehicle?.title ?? category?.name }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parsePayload(tokenPayload);
        const filename = blob.pathname.split("/").pop() || blob.pathname;
        if (payload.unlinked) {
          await logAudit({ adminId: payload.adminId ?? admin.id, adminName: payload.adminName ?? admin.name, action: "UPLOAD", resource: "SETTINGS", resourceId: "site-assets", details: `Uploaded ${payload.purpose ?? "site"} image` });
          return;
        }
        await db.media.create({
          data: {
            vehicleId: payload.vehicleId ?? null,
            categoryId: payload.categoryId ?? null,
            type: "VIDEO",
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
          details: `Uploaded video for ${payload.vehicleTitle}`,
        });
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

function parsePayload(value: string | null | undefined): { vehicleId?: string; categoryId?: string; purpose?: string; unlinked?: boolean; fileSize?: number; fileType?: string; adminId?: string; adminName?: string; vehicleTitle?: string } {
  const payload = value ? JSON.parse(value) : null;
  if (!payload || (!payload.unlinked && typeof payload.vehicleId !== "string" && typeof payload.categoryId !== "string")) {
    throw new Error("A vehicle or category is required for video uploads.");
  }
  return payload;
}
