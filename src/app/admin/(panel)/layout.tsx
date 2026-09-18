import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProviders } from "@/components/admin/providers";
import { toSafeAdmin } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <AdminProviders>
      <AdminShell admin={toSafeAdmin(admin)}>{children}</AdminShell>
    </AdminProviders>
  );
}
