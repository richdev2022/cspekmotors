import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VehicleWithRelations } from "@/types";
import { VehicleEnquiryButton } from "@/components/site/enquiry-dialog";

export function VehicleStatusBadge({ status }: { status: string }) {
  if (status === "SOLD") {
    return <Badge className="bg-red-600 hover:bg-red-600 text-white uppercase tracking-wide">Sold</Badge>;
  }
  if (status === "RESERVED") {
    return <Badge className="bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide">Reserved</Badge>;
  }
  if (status === "AVAILABLE") {
    return <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white uppercase tracking-wide">Available</Badge>;
  }
  return null;
}

export function VehicleCard({ vehicle }: { vehicle: VehicleWithRelations }) {
  const primary = vehicle.media.find((m) => m.isPrimary && m.type === "IMAGE") ?? vehicle.media.find((m) => m.type === "IMAGE");
  const imageCount = vehicle.media.filter((m) => m.type === "IMAGE").length;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Image */}
      <Link
        href={`/vehicles/${vehicle.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-zinc-100"
        aria-label={`View details of ${vehicle.title}`}
      >
        {primary ? (
           
          <img
            src={primary.url}
            alt={primary.caption || `${vehicle.title} — ${vehicle.category.name} for sale at C-SPEK MOTORS LTD`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <CarPlaceholder />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <VehicleStatusBadge status={vehicle.status} />
          {vehicle.isFeatured && (
            <Badge className="bg-zinc-950/85 text-amber-400 uppercase tracking-wide backdrop-blur">Featured</Badge>
          )}
        </div>
        {imageCount > 1 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-zinc-950/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <Eye className="h-3 w-3" /> {imageCount}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">{vehicle.category.name}</p>
            <h3 className="mt-1 truncate font-display text-lg font-semibold text-zinc-950">
              <Link href={`/vehicles/${vehicle.slug}`} className="hover:text-amber-600 transition-colors">
                {vehicle.title}
              </Link>
            </h3>
          </div>
        </div>

        <p className="mt-2 text-sm italic text-zinc-400">Contact us for price &amp; full details.</p>

        <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-400">{imageCount > 0 ? `${imageCount} photo${imageCount > 1 ? "s" : ""}` : ""}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="rounded-full font-medium">
            <Link href={`/vehicles/${vehicle.slug}`}>View Details</Link>
          </Button>
          <VehicleEnquiryButton
            vehicle={{
              vehicleId: vehicle.id,
              vehicleTitle: vehicle.title,
              vehicleCategory: vehicle.category.name,
              vehicleSlug: vehicle.slug,
            }}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded-full"
          />
        </div>
      </div>
    </article>
  );
}

function CarPlaceholder() {
  return (
    <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
    </svg>
  );
}
