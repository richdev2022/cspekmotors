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
        const vehicle = await db.vehicle.findUnique({ where: { id: payload.vehicleId }, select: { id: true, title: true } });
        if (!vehicle) throw new Error("Selected vehicle not found.");
        if (!/\.(mp4|webm|mov)$/i.test(pathname)) throw new Error("Only MP4, WEBM and MOV videos are supported.");
        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime"],
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ...payload, adminId: admin.id, adminName: admin.name, vehicleTitle: vehicle.title }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parsePayload(tokenPayload);
        const filename = blob.pathname.split("/").pop() || blob.pathname;
        await db.media.create({
          data: {
            vehicleId: payload.vehicleId,
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
          resourceId: payload.vehicleId,
          details: `Uploaded video for ${payload.vehicleTitle}`,
        });
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

function parsePayload(value: string | null | undefined): { vehicleId: string; fileSize?: number; fileType?: string; adminId?: string; adminName?: string; vehicleTitle?: string } {
  const payload = value ? JSON.parse(value) : null;
  if (!payload?.vehicleId || typeof payload.vehicleId !== "string") throw new Error("A vehicle is required for video uploads.");
  return payload;
}
