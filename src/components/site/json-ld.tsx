import { getSiteSettings } from "@/lib/settings";

/**
 * Site-wide Schema.org structured data (AutoDealer + Organization).
 */
export async function AutoDealerJsonLd() {
  let settings;
  try {
    settings = await getSiteSettings();
  } catch {
    return null;
  }
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

  const data = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${appUrl}/#organization`,
    name: settings.companyName,
    url: appUrl,
    description: settings.websiteDescription,
    telephone: (() => {
      const lines = [settings.phone, settings.phoneSecondary].filter(Boolean) as string[];
      if (lines.length === 0) return undefined;
      if (lines.length === 1) return lines[0];
      return lines;
    })(),
    email: settings.email || undefined,
    address: settings.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.address,
          addressCountry: "NG",
        }
      : undefined,
    openingHours: (() => {
      try {
        const rows = JSON.parse(settings.businessHours || "[]");
        return Array.isArray(rows) ? rows.map((r: { days: string; hours: string }) => `${r.days} ${r.hours}`).join(", ") : undefined;
      } catch { return undefined; }
    })(),
    sameAs: [
      settings.facebook,
      settings.instagram,
      settings.tiktok,
      settings.twitter,
      settings.youtube,
    ].filter(Boolean),
    // Square emblem on white — required logo format for Google Organization/AutoDealer rich results
    logo: `${appUrl}/brand/emblem-square.png`,
    image: [`${appUrl}/brand/emblem-square.png`, `${appUrl}/brand/logo-light-bg.png`],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
