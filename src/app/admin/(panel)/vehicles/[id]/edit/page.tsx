"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import type { VehicleWithRelations } from "@/types";
import { parseSpecifications } from "@/types";

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: vehicle, isLoading, isError, error } = useQuery<VehicleWithRelations>({
    queryKey: ["admin-vehicle", id],
    queryFn: async () => {
      const res = await api.get<VehicleWithRelations & { specifications: { label: string; value: string }[] }>(`/api/admin/vehicles/${id}`);
      if (!res.ok || !res.data) throw new Error(res.error ?? "Vehicle not found");
      return { ...res.data, specifications: [] as never } as unknown as VehicleWithRelations;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
        <p className="font-display text-lg font-semibold text-red-800">{error instanceof Error ? error.message : "Vehicle not found"}</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link href="/admin/vehicles">Back to Vehicles</Link>
        </Button>
      </div>
    );
  }

  const initial = {
    title: vehicle.title,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    categoryId: vehicle.categoryId,
    price: vehicle.price !== null ? String(vehicle.price) : "",
    currency: vehicle.currency,
    condition: vehicle.condition,
    status: vehicle.status,
    location: vehicle.location ?? "",
    shortDescription: vehicle.shortDescription ?? "",
    description: vehicle.description ?? "",
    mileage: vehicle.mileage !== null ? String(vehicle.mileage) : "",
    transmission: vehicle.transmission ?? "",
    fuelType: vehicle.fuelType ?? "",
    engine: vehicle.engine ?? "",
    colour: vehicle.colour ?? "",
    bodyType: vehicle.bodyType ?? "",
    driveType: vehicle.driveType ?? "",
    seats: vehicle.seats !== null ? String(vehicle.seats) : "",
    specifications: parseSpecifications(vehicle.specifications),
    isFeatured: vehicle.isFeatured,
    isPublished: vehicle.isPublished,
    publishDetails: vehicle.publishDetails,
    seoTitle: vehicle.seoTitle ?? "",
    seoDescription: vehicle.seoDescription ?? "",
    seoKeywords: vehicle.seoKeywords ?? "",
    slug: vehicle.slug,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-zinc-500">
            <Link href="/admin/vehicles"><ArrowLeft className="h-4 w-4" /> Back to Vehicles</Link>
          </Button>
          <h1 className="font-display text-2xl font-bold text-zinc-950">Edit Vehicle</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {vehicle.title} · /vehicles/{vehicle.slug}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/vehicles/${vehicle.slug}`} target="_blank">
            <ExternalLink className="h-4 w-4" /> View on Website
          </Link>
        </Button>
      </div>
      <VehicleForm mode="edit" vehicleId={vehicle.id} initial={initial} />
    </div>
  );
}
