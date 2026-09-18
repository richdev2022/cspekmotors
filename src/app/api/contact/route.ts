import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { assertSameOrigin, handleApiError, rateLimit } from "@/lib/api-utils";
import { jsonError, jsonOk } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    rateLimit(req, "contact", 6, 10 * 60 * 1000); // 6 submissions / 10 min / IP

    const body = await req.json().catch(() => null);
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return handleApiError(parsed.error);

    const { name, email, phone, subject, message } = parsed.data;
    await db.contactMessage.create({ data: { name, email, phone: phone || null, subject: subject || null, message } });

    return jsonOk({ received: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
