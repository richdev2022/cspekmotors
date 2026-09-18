import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function CategoryCard({
  name, slug, description, image, vehicleCount,
}: {
  name: string; slug: string; description?: string | null; image?: string | null; vehicleCount: number;
}) {
  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      aria-label={`Browse ${name} — ${vehicleCount} vehicles available`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {image ? (
           
          <img
            src={image}
            alt={`${name} available for sale at C-SPEK MOTORS LTD`}
            loading="lazy"
            className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-95"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold text-white">{name}</h3>
              <p className="mt-0.5 text-sm text-zinc-300">{vehicleCount} vehicle{vehicleCount === 1 ? "" : "s"} available</p>
            </div>
            <Badge className="shrink-0 bg-amber-500 text-zinc-950 hover:bg-amber-500">Browse</Badge>
          </div>
          {description && <p className="mt-2 hidden text-xs leading-relaxed text-zinc-400 sm:line-clamp-2">{description}</p>}
        </div>
      </div>
    </Link>
  );
}
