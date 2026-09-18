import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 text-amber-400">
        <SearchX className="h-10 w-10" aria-hidden="true" />
      </div>
      <p className="mt-6 font-display text-7xl font-bold text-white">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-zinc-100">Page not found</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
        The page you are looking for may have been moved, sold, or never existed. Let&apos;s get you back
        on the road.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="rounded-full bg-amber-500 px-7 font-semibold text-zinc-950 hover:bg-amber-600">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Back to Homepage
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/5 px-7 font-semibold text-white hover:bg-white/10 hover:text-white">
          <Link href="/vehicles">Browse Vehicles</Link>
        </Button>
      </div>
    </div>
  );
}
