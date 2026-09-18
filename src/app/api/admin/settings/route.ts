import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handleApiError, jsonOk } from "@/lib/api-utils";
import { settingsUpdateSchema } from "@/lib/validation";
import { getSiteSettings, parseBusinessHours } from "@/lib/settings";
import { toPublicSettings } from "@/types";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getSiteSettings();
    return jsonOk({ ...settings, businessHoursRows: parseBusinessHours(settings.businessHours) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    await getSiteSettings(); // ensure row exists
    const d = parsed.data;

    const settings = await db.siteSettings.update({
      where: { id: "main" },
      data: {
        ...(d.companyName !== undefined && { companyName: d.companyName }),
        ...(d.logo !== undefined && { logo: d.logo || null }),
        ...(d.logoLight !== undefined && { logoLight: d.logoLight || null }),
        ...(d.logoDark !== undefined && { logoDark: d.logoDark || null }),
        ...(d.tagline !== undefined && { tagline: d.tagline }),
        ...(d.phone !== undefined && { phone: d.phone || null }),
        ...(d.phoneSecondary !== undefined && { phoneSecondary: d.phoneSecondary || null }),
        ...(d.whatsapp !== undefined && { whatsapp: d.whatsapp || null }),
        ...(d.email !== undefined && { email: d.email || null }),
        ...(d.address !== undefined && { address: d.address || null }),
        ...(d.businessHours !== undefined && { businessHours: JSON.stringify(d.businessHours) }),
        ...(d.mapUrl !== undefined && { mapUrl: d.mapUrl || null }),
        ...(d.facebook !== undefined && { facebook: d.facebook || null }),
        ...(d.instagram !== undefined && { instagram: d.instagram || null }),
        ...(d.tiktok !== undefined && { tiktok: d.tiktok || null }),
        ...(d.twitter !== undefined && { twitter: d.twitter || null }),
        ...(d.youtube !== undefined && { youtube: d.youtube || null }),
        ...(d.websiteTitle !== undefined && { websiteTitle: d.websiteTitle }),
        ...(d.websiteDescription !== undefined && { websiteDescription: d.websiteDescription }),
        ...(d.seoDefaultTitle !== undefined && { seoDefaultTitle: d.seoDefaultTitle || null }),
        ...(d.seoDefaultDescription !== undefined && { seoDefaultDescription: d.seoDefaultDescription || null }),
        ...(d.socialSharingImage !== undefined && { socialSharingImage: d.socialSharingImage || null }),
      },
    });

    await logAudit({
      adminId: admin.id, adminName: admin.name, action: "UPDATE", resource: "SETTINGS",
      resourceId: "main", details: "Updated website settings",
    });

    return jsonOk({ ...settings, businessHoursRows: parseBusinessHours(settings.businessHours) });
  } catch (err) {
    return handleApiError(err);
  }
}
