"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { Button } from "@/components/ui/button";

export default function NewVehiclePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-zinc-500">
          <Link href="/admin/vehicles"><ArrowLeft className="h-4 w-4" /> Back to Vehicles</Link>
        </Button>
        <h1 className="font-display text-2xl font-bold text-zinc-950">Add New Vehicle</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Fill in the vehicle details, save, then upload photos and videos on the next screen.
        </p>
      </div>
      <VehicleForm mode="create" />
    </div>
  );
}
