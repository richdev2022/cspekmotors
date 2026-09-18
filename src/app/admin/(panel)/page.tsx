"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Car, Shapes, MessagesSquare, Inbox, Images, PlusCircle, ArrowRight, Loader2, CircleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalVehicles: number; availableVehicles: number; soldVehicles: number; reservedVehicles: number;
    categories: number; totalEnquiries: number; newEnquiries: number; inProgressEnquiries: number; totalMedia: number;
  };
  recentVehicles: { id: string; title: string; slug: string; status: string; price: number | null; currency: string; createdAt: string; category: { name: string }; media: { url: string; isPrimary: boolean }[] }[];
  recentEnquiries: { id: string; customerName: string; vehicleName: string; status: string; createdAt: string }[];
  recentMedia: { id: string; url: string; type: string; filename: string; createdAt: string; vehicle: { title: string; slug: string } | null }[];
  vehiclesByCategory: { name: string; count: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  RESERVED: "bg-amber-100 text-amber-700",
  SOLD: "bg-red-100 text-red-700",
  HIDDEN: "bg-zinc-200 text-zinc-600",
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-violet-100 text-violet-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-zinc-200 text-zinc-600",
};

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<DashboardData>("/api/admin/dashboard");
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load dashboard");
      return res.data;
    },
  });

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex items-center gap-3 p-6 text-red-700">
          <CircleAlert className="h-5 w-5" /> {error instanceof Error ? error.message : "Failed to load dashboard."}
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats;
  const maxCat = Math.max(1, ...(data?.vehiclesByCategory.map((c) => c.count) ?? [1]));

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950">Dashboard</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Overview of your dealership at a glance.</p>
        </div>
        <Button asChild className="rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
          <Link href="/admin/vehicles/new"><PlusCircle className="h-4 w-4" /> Add Vehicle</Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Vehicles" value={stats?.totalVehicles}
          icon={<Car className="h-5 w-5" />} tone="bg-zinc-950 text-amber-400"
          sub={`${stats?.availableVehicles ?? "—"} available · ${stats?.reservedVehicles ?? "—"} reserved`}
        />
        <StatCard
          label="Sold Vehicles" value={stats?.soldVehicles}
          icon={<Car className="h-5 w-5" />} tone="bg-red-100 text-red-600"
          sub="Lifetime completed sales"
        />
        <StatCard
          label="Categories" value={stats?.categories}
          icon={<Shapes className="h-5 w-5" />} tone="bg-violet-100 text-violet-600"
          sub="Active vehicle categories"
        />
        <StatCard
          label="Total Enquiries" value={stats?.totalEnquiries}
          icon={<MessagesSquare className="h-5 w-5" />} tone="bg-sky-100 text-sky-600"
          sub={`${stats?.newEnquiries ?? "—"} new · ${stats?.inProgressEnquiries ?? "—"} in progress`}
          highlight={(stats?.newEnquiries ?? 0) > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicles by category chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-base">Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
              : (data?.vehiclesByCategory ?? []).map((c) => (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-700">{c.name}</span>
                      <span className="text-zinc-400">{c.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${(c.count / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            {!isLoading && (data?.vehiclesByCategory.length ?? 0) === 0 && (
              <p className="text-sm text-zinc-400">No published vehicles yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent vehicles */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Recently Added Vehicles</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
              <Link href="/admin/vehicles">View all <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            {data?.recentVehicles.map((v) => {
              const img = v.media.find((m) => m.isPrimary) ?? v.media[0];
              return (
                <Link
                  key={v.id}
                  href={`/admin/vehicles/${v.id}/edit`}
                  className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-2.5 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
                >
                  {img ? (
                     
                    <img src={img.url} alt="" className="h-11 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400"><Car className="h-5 w-5" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{v.title}</p>
                    <p className="text-xs text-zinc-500">{v.category.name} · {formatDate(v.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900">{formatPrice(v.price, v.currency)}</p>
                    <Badge className={cn("mt-0.5 border-0 text-[10px]", STATUS_STYLES[v.status])}>{v.status}</Badge>
                  </div>
                </Link>
              );
            })}
            {!isLoading && (data?.recentVehicles.length ?? 0) === 0 && (
              <EmptyHint text="No vehicles yet — add your first vehicle to get started." href="/admin/vehicles/new" cta="Add Vehicle" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent enquiries */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Recent Enquiries</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
              <Link href="/admin/enquiries">View all <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            {data?.recentEnquiries.map((e) => (
              <Link key={e.id} href="/admin/enquiries" className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 px-3.5 py-2.5 transition-colors hover:bg-zinc-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{e.customerName}</p>
                  <p className="truncate text-xs text-zinc-500">{e.vehicleName} · {formatDate(e.createdAt)}</p>
                </div>
                <Badge className={cn("shrink-0 border-0 text-[10px]", STATUS_STYLES[e.status])}>{e.status.replace("_", " ")}</Badge>
              </Link>
            ))}
            {!isLoading && (data?.recentEnquiries.length ?? 0) === 0 && (
              <EmptyHint text="No customer enquiries yet." />
            )}
          </CardContent>
        </Card>

        {/* Recent media */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Recently Uploaded Media</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
              <Link href="/admin/media">View all <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {data?.recentMedia.map((m) => (
                  <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100" title={m.vehicle?.title ?? m.filename}>
                    { }
                    <img src={m.url} alt={m.filename} className="h-full w-full object-cover" loading="lazy" />
                    {m.type === "VIDEO" && (
                      <span className="absolute bottom-1 right-1 rounded bg-zinc-950/70 px-1 py-0.5 text-[9px] font-bold text-white">VIDEO</span>
                    )}
                  </div>
                ))}
                {(data?.recentMedia.length ?? 0) === 0 && (
                  <div className="col-span-full flex flex-col items-center py-6 text-center text-zinc-400">
                    <Images className="h-8 w-8" />
                    <p className="mt-2 text-sm">No media uploaded yet.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, tone, sub, highlight,
}: {
  label: string; value?: number; icon: React.ReactNode; tone: string; sub?: string; highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && "border-amber-300 ring-1 ring-amber-200")}>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
          {value === undefined ? (
            <Skeleton className="mt-1.5 h-8 w-16" />
          ) : (
            <p className="mt-1 font-display text-3xl font-bold text-zinc-950">{value}</p>
          )}
          {sub && <p className="mt-1.5 text-xs text-zinc-400">{sub}</p>}
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>
      </CardContent>
    </Card>
  );
}

function EmptyHint({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-200 py-8 text-center">
      <Inbox className="h-7 w-7 text-zinc-300" />
      <p className="mt-2 px-4 text-sm text-zinc-400">{text}</p>
      {href && cta && (
        <Button asChild size="sm" className="mt-4 rounded-full">
          <Link href={href}>{cta}</Link>
        </Button>
      )}
    </div>
  );
}
