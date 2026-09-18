// ============================================================
// WhatsApp service — single source of truth for all WhatsApp
// deep links. The company number comes from SiteSettings
// (admin-editable) with the COMPANY_WHATSAPP_NUMBER env var
// as fallback. Never hardcode the number elsewhere.
// ============================================================

export interface WhatsAppEnquiryInput {
  vehicleName: string;
  vehicleCategory?: string | null;
  vehicleUrl?: string;
  customerName: string;
  email: string;
  phone: string;
  message: string;
  attachmentUrls?: string[];
}

function normalizeNumber(raw?: string | null): string {
  if (!raw) return "";
  return raw.replace(/[^\d]/g, "");
}

export function getCompanyWhatsAppNumber(settingsWhatsApp?: string | null): string {
  return normalizeNumber(settingsWhatsApp) || normalizeNumber(process.env.COMPANY_WHATSAPP_NUMBER);
}

function buildUrl(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Full enquiry message — used after a customer submits the enquiry form. */
export function generateWhatsAppEnquiry(input: WhatsAppEnquiryInput, settingsWhatsApp?: string | null): string {
  const number = getCompanyWhatsAppNumber(settingsWhatsApp);
  const lines: string[] = [];
  lines.push("C-SPEK MOTORS LTD – VEHICLE ENQUIRY");
  lines.push("");
  lines.push(`Vehicle: ${input.vehicleName}`);
  if (input.vehicleCategory) lines.push(`Category: ${input.vehicleCategory}`);
  lines.push("");
  lines.push(`Customer Name: ${input.customerName}`);
  lines.push(`Email: ${input.email}`);
  lines.push(`Phone: ${input.phone}`);
  lines.push("");
  lines.push(`Message: ${input.message || "(no message provided)"}`);
  if (input.attachmentUrls && input.attachmentUrls.length > 0) {
    lines.push("");
    lines.push("Attachments:");
    for (const a of input.attachmentUrls) lines.push(a);
  }
  if (input.vehicleUrl) {
    lines.push("");
    lines.push(`Vehicle Link: ${input.vehicleUrl}`);
  }
  if (!number) return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
  return buildUrl(number, lines.join("\n"));
}

/** Quick "Chat on WhatsApp" link from a vehicle page (no form). */
export function generateWhatsAppVehicleLink(vehicleName: string, vehicleUrl?: string, settingsWhatsApp?: string | null): string {
  const number = getCompanyWhatsAppNumber(settingsWhatsApp);
  const text = [
    "Hello C-SPEK MOTORS LTD,",
    "",
    `I am interested in the ${vehicleName} listed on your website.`,
    vehicleUrl ? `Vehicle Link: ${vehicleUrl}` : "",
    "",
    "Please share availability and best price. Thank you.",
  ].filter(Boolean).join("\n");
  if (!number) return `https://wa.me/?text=${encodeURIComponent(text)}`;
  return buildUrl(number, text);
}

/** Generic contact link (floating button, contact page, footer). */
export function generateWhatsAppGeneralLink(settingsWhatsApp?: string | null, greeting?: string): string {
  const number = getCompanyWhatsAppNumber(settingsWhatsApp);
  const text = greeting || "Hello C-SPEK MOTORS LTD, I would like to make an enquiry about your vehicles.";
  if (!number) return `https://wa.me/?text=${encodeURIComponent(text)}`;
  return buildUrl(number, text);
}

export function isValidWhatsAppNumber(raw?: string | null): boolean {
  const n = normalizeNumber(raw);
  return n.length >= 7 && n.length <= 15;
}
