export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
}

export function SectionHeading({ eyebrow, title, description, align = "center" }: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">{eyebrow}</p>
      )}
      <h2 className="mt-2 font-display text-3xl font-bold text-zinc-950 sm:text-4xl text-balance">{title}</h2>
      {description && <p className="mt-3 text-base leading-relaxed text-zinc-500">{description}</p>}
    </div>
  );
}
