import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title, description, resetHref, icon,
}: {
  title: string;
  description: string;
  resetHref?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        {icon ?? <SearchX className="h-8 w-8" />}
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{description}</p>
      {resetHref && (
        <Button asChild variant="outline" className="mt-6 rounded-full">
          <Link href={resetHref}>Clear All Filters</Link>
        </Button>
      )}
    </div>
  );
}
