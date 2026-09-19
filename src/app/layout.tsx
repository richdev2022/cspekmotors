import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/settings";
import { AutoDealerJsonLd } from "@/components/site/json-ld";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  let title = "C-SPEK MOTORS LTD — Quality Vehicles. Trusted Deals.";
  let description =
    "C-SPEK MOTORS LTD is a trusted Nigerian automobile dealership offering quality cars, SUVs, trucks, trailers, buses and vans. Browse verified inventory and enquire directly on WhatsApp.";
  let image: string | null = "/og-image.png";

  try {
    const settings = await getSiteSettings();
    title = settings.websiteTitle || title;
    description = settings.websiteDescription || description;
    image = settings.socialSharingImage || image;
  } catch {
    // DB may not be ready — fall back to defaults
  }

  return {
    metadataBase: new URL(appUrl),
    title: {
      default: title,
      template: "%s | C-SPEK MOTORS LTD",
    },
    description,
    keywords: [
      "C-SPEK MOTORS", "cars for sale Nigeria", "Lagos car dealership", "SUVs for sale",
      "trucks for sale Nigeria", "Toyota dealer Lagos", "vehicle dealer Nigeria", "buy cars Lagos",
    ],
    applicationName: "C-SPEK MOTORS LTD",
    authors: [{ name: "C-SPEK MOTORS LTD" }],
    icons: {
      icon: [
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: "/apple-touch-icon.png",
    },
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: "/",
      siteName: "C-SPEK MOTORS LTD",
      type: "website",
      locale: "en_NG",
      ...(image && { images: [{ url: image, width: 1200, height: 630, alt: "C-SPEK MOTORS LTD — Quality Vehicles. Trusted Deals." }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (translate/grabber tools) inject
          attributes like bis_skin_checked onto <body>, which would otherwise trigger
          a false-positive hydration mismatch warning. */}
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AutoDealerJsonLd />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
