import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { enquirySchema } from "@/lib/validation";
import { assertSameOrigin, handleApiError, jsonError, jsonOk, rateLimit } from "@/lib/api-utils";
import { getSiteSettings } from "@/lib/settings";
import { generateWhatsAppEnquiry } from "@/lib/whatsapp";
import { getStorageProvider } from "@/lib/storage";
import { validateUpload } from "@/lib/media";

export const runtime = "nodejs";

/**
 * POST /api/enquiries — public enquiry submission (multipart/form-data).
 * Saves the enquiry + attachments, then returns a generated WhatsApp
 * deep link prefilled with the enquiry details.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    rateLimit(req, "enquiry", 6, 10 * 60 * 1000); // 6 submissions / 10 min / IP

    const form = await req.formData().catch(() => null);
    if (!form) return jsonError("Invalid form submission.", 400);

    const parsed = enquirySchema.safeParse({
      vehicleId: form.get("vehicleId")?.toString() ?? "",
      customerName: form.get("customerName")?.toString() ?? "",
      email: form.get("email")?.toString() ?? "",
      phone: form.get("phone")?.toString() ?? "",
      message: form.get("message")?.toString() ?? "",
    });
    if (!parsed.success) return handleApiError(parsed.error);

    const { vehicleId, customerName, email, phone, message } = parsed.data;

    const vehicle = await db.vehicle.findFirst({
      where: { id: vehicleId, isPublished: true, status: { not: "HIDDEN" } },
      include: { category: true },
    });
    if (!vehicle) return jsonError("This vehicle is no longer available. Please browse our current stock.", 404);

    // ---- Handle optional attachments (max 4) ----
    const settings = await getSiteSettings();
    const storage = getStorageProvider();
    const attachmentUrls: string[] = [];
    const attachmentsData: { fileUrl: string; fileName: string; fileType: string | null }[] = [];

    const files = form.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 4);
    for (const file of files) {
      const validation = validateUpload({ size: file.size, type: file.type, name: file.name }, "attachment");
      if (!validation.ok) return jsonError(validation.error ?? "Unsupported attachment.", 422);
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await storage.upload({ buffer, filename: file.name, mimeType: file.type || "application/octet-stream", folder: "enquiries" });
        attachmentUrls.push(result.url);
        attachmentsData.push({ fileUrl: result.url, fileName: file.name, fileType: file.type || null });
      } catch (err) {
        console.error("[ENQUIRY] Attachment upload failed:", err);
        return jsonError("We could not upload one of your attachments. Please try a smaller file or submit without attachments.", 500);
      }
    }

    // ---- Save enquiry ----
    const enquiry = await db.enquiry.create({
      data: {
        vehicleId: vehicle.id,
        vehicleName: vehicle.title,
        vehicleCategory: vehicle.category.name,
        customerName,
        email,
        phone,
        message,
        status: "NEW",
        ...(attachmentsData.length ? { attachments: { create: attachmentsData } } : {}),
      },
      include: { attachments: true },
    });

    // ---- Generate WhatsApp deep link ----
    const appUrl = process.env.APP_URL || req.nextUrl.origin;
    const vehicleUrl = `${appUrl.replace(/\/$/, "")}/vehicles/${vehicle.slug}`;
    const whatsappUrl = generateWhatsAppEnquiry(
      {
        vehicleName: vehicle.title,
        vehicleCategory: vehicle.category.name,
        vehicleUrl,
        customerName,
        email,
        phone,
        message,
        attachmentUrls,
      },
      settings.whatsapp
    );

    await db.enquiry.update({ where: { id: enquiry.id }, data: { whatsappUrl } });

    return jsonOk(
      {
        enquiry: {
          id: enquiry.id,
          vehicleName: vehicle.title,
          vehicleSlug: vehicle.slug,
          customerName,
          createdAt: enquiry.createdAt,
          attachments: enquiry.attachments,
        },
        whatsappUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
