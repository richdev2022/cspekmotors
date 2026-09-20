"use client";

import { useMemo, useState } from "react";
import { Images } from "lucide-react";
import { publicMediaUrl } from "@/lib/media";

type CategoryMedia = { id: string; url: string; type: string; caption: string | null };

export function CategoryGallery({
  name,
  video,
  media,
}: {
  name: string;
  video: string | null;
  media: CategoryMedia[];
}) {
  const [filter, setFilter] = useState<"all" | "images" | "videos">("all");
  const galleryMedia = useMemo(() => {
    const items = video && !media.some((item) => item.url === video)
      ? [{ id: "category-video", url: video, type: "VIDEO", caption: "Trucks in action" }, ...media]
      : media;
    return filter === "images" ? items.filter((item) => item.type === "IMAGE")
      : filter === "videos" ? items.filter((item) => item.type === "VIDEO")
      : items;
  }, [filter, media, video]);
  const imageCount = media.filter((item) => item.type === "IMAGE").length;
  const videoCount = media.filter((item) => item.type === "VIDEO").length + (video && !media.some((item) => item.url === video) ? 1 : 0);

  if (media.length === 0 && !video) return null;

  return (
    <section className="mt-12" aria-label={`${name} gallery`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-zinc-950">{name} Gallery</h2>
          <p className="mt-1 text-sm text-zinc-500">Photos and videos from our {name.toLowerCase()} stock.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          <Images className="h-3.5 w-3.5" /> {galleryMedia.length} file{galleryMedia.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-5 flex w-full gap-2 rounded-xl bg-zinc-100 p-1" role="tablist" aria-label={`${name} media filter`}>
        {([
          ["all", `All (${imageCount + videoCount})`],
          ["images", `Images (${imageCount})`],
          ["videos", `Videos (${videoCount})`],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${filter === value ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {galleryMedia.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">No {filter} in this gallery yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {galleryMedia.map((item) => {
            const url = publicMediaUrl(item.url) ?? item.url;
            return item.type === "VIDEO" ? (
              <video key={item.id} src={url} controls preload="metadata" className="aspect-[4/3] w-full rounded-2xl bg-zinc-950 object-contain" aria-label={item.caption || `${name} video`} />
            ) : (
              <a key={item.id} href={url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100" title={item.caption || `${name} photo`}>
                <img src={url} alt={item.caption || `${name} photo`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
