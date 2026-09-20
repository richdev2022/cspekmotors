import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { toPublicSettings } from "@/types";

/**
 * Shared layout for legal pages (Terms, Privacy, etc.).
 * Renders a hero header, a sidebar-table-of-contents, and the body content.
 */
export async function LegalPageLayout({
  eyebrow,
  title,
  intro,
  lastUpdated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: { id: string; heading: string; body: ReactNode }[];
}) {
  const settings = toPublicSettings(await getSiteSettings());

  return (
    <div className="bg-zinc-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-950 py-20 sm:py-24" aria-label={title}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 30%, #f59e0b 0%, transparent 45%), radial-gradient(circle at 85% 70%, #f59e0b 0%, transparent 45%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold text-white sm:text-5xl text-balance">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300">{intro}</p>
          <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-white py-14 sm:py-20" aria-label={`${title} details`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Sidebar TOC */}
            <aside className="hidden lg:block">
              <nav
                className="sticky top-24 space-y-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                aria-label="Page sections"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">On this page</p>
                <ol className="space-y-1 text-sm">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block rounded-lg px-3 py-2 text-zinc-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
                      >
                        <span className="mr-2 text-zinc-400">{i + 1}.</span>
                        {s.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            {/* Body content */}
            <article className="prose prose-zinc max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h2:text-2xl prose-h2:font-bold prose-h2:text-zinc-950 prose-h3:text-lg prose-h3:font-semibold prose-h3:text-zinc-900 prose-p:text-zinc-600 prose-p:leading-relaxed prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-900 prose-li:text-zinc-600">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2>{s.heading}</h2>
                  {s.body}
                </section>
              ))}
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-zinc-950 py-14" aria-label="Contact about legal">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl text-balance">
            Questions about this policy?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            Our team is happy to clarify any part of this document. Reach out and we&apos;ll respond as quickly as we can.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-full bg-amber-500 px-7 font-semibold text-zinc-950 hover:bg-amber-600">
              <Link href="/contact">Contact Us <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            {settings.phone && (
              <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/5 px-7 font-semibold text-white hover:bg-white/10 hover:text-white">
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>Call {settings.phone}</a>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
