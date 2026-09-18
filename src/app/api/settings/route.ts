import { getSiteSettings, parseBusinessHours } from "@/lib/settings";
import { toPublicSettings } from "@/types";
import { handleApiError, jsonOk } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return jsonOk({ ...toPublicSettings(settings), businessHoursRows: parseBusinessHours(settings.businessHours) });
  } catch (err) {
    return handleApiError(err);
  }
}
