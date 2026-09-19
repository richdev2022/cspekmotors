import { getSiteSettings } from "@/lib/settings";
import { toPublicSettings } from "@/types";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { FloatingWhatsApp } from "@/components/site/floating-whatsapp";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = toPublicSettings(await getSiteSettings());

  return (
    <div className="site-shell flex min-h-screen flex-col">
      <Navbar
        settings={{
          companyName: settings.companyName,
          phone: settings.phone,
          logoLight: settings.logoLight,
          logoDark: settings.logoDark,
        }}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <FloatingWhatsApp settingsWhatsApp={settings.whatsapp} />
    </div>
  );
}
