"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Play, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicMediaUrl } from "@/lib/media";
import { createPortal } from "react-dom";

export interface GalleryMedia {
  id: string;
  url: string;
  type: string; // IMAGE | VIDEO
  caption?: string | null;
}

export function VehicleGallery({ media, title }: { media: GalleryMedia[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "images" | "videos">("all");
  const touchStartX = useRef<number | null>(null);

  const images = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");
  const showImages = filter !== "videos";
  const showVideos = filter !== "images";
  const current = images[activeIndex];
  const currentUrl = publicMediaUrl(current?.url) ?? current?.url;
  const imageCount = images.length;

  const next = useCallback(() => setActiveIndex((i) => (i + 1) % Math.max(1, imageCount)), [imageCount]);
  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + imageCount) % Math.max(1, imageCount)), [imageCount]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, next, prev]);

  if (images.length === 0 && videos.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
        <Images className="h-12 w-12" aria-hidden="true" />
        <span className="sr-only">No media available for {title}</span>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-3 overflow-hidden">
      {(images.length > 0 || videos.length > 0) && (
        <div className="flex w-full gap-2 overflow-x-auto rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="Post media filter">
          {(["all", "images", "videos"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "min-w-20 flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-colors sm:min-w-24",
                filter === value ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-600 hover:bg-white hover:text-zinc-950",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      {showImages && images.length > 0 && <div
        className="relative h-[min(58vw,220px)] min-w-0 max-w-full cursor-zoom-in overflow-hidden rounded-2xl bg-zinc-100 sm:aspect-[4/3] sm:h-auto sm:max-h-[70vh] lg:aspect-[16/10]"
        onClick={() => current && setLightboxOpen(true)}
        onTouchStart={(e) => (touchStartX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          if (start !== null && end !== undefined) {
            const dx = start - end;
            if (Math.abs(dx) > 50) (dx > 0 ? next : prev)();
          }
          touchStartX.current = null;
        }}
        role="button"
        aria-label={`Open image gallery for ${title}`}
      >
        {current ? (
          <>
            <img
              src={currentUrl}
              alt={current.caption || `${title} — photo ${activeIndex + 1}`}
              className="h-full w-full object-contain p-1 sm:p-4"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-zinc-950/55 p-2.5 text-white backdrop-blur transition hover:bg-zinc-950/80"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-zinc-950/55 p-2.5 text-white backdrop-blur transition hover:bg-zinc-950/80"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-zinc-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  {activeIndex + 1} / {images.length}
                </span>
              </>
            )}
          </>
        ) : null}
      </div>}

      {/* Thumbnails */}
      {showImages && images.length > 1 && (
        <div className="styled-scrollbar flex gap-2.5 overflow-x-auto pb-1" role="tablist" aria-label="Image thumbnails">
          {images.map((m, i) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`View photo ${i + 1} of ${title}`}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-28",
                i === activeIndex ? "border-amber-500 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              { }
              <img src={publicMediaUrl(m.url) ?? m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Videos (lazy — only load when played) */}
      {showVideos && videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((v) => (
            <LazyVideo key={v.id} src={publicMediaUrl(v.url) ?? v.url} caption={v.caption} title={title} />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && current &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} image viewer`}
          >
            <button
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <figure className="max-h-[85vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
              { }
              <img
                src={currentUrl}
                alt={current.caption || `${title} — image ${activeIndex + 1}`}
                className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
              />
              <figcaption className="mt-3 text-center text-sm text-zinc-300">
                {current.caption || title} · {activeIndex + 1} / {images.length}
              </figcaption>
            </figure>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

function LazyVideo({ src, caption, title }: { src: string; caption?: string | null; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <button
        onClick={() => setPlaying(true)}
        className="group relative flex h-[min(56vw,210px)] min-w-0 max-w-full items-center justify-center overflow-hidden rounded-2xl bg-zinc-900 sm:aspect-[16/9] sm:h-auto"
        aria-label={`Play video of ${title}`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-zinc-950 shadow-lg transition-transform group-hover:scale-110">
          <Play className="h-7 w-7 fill-current" />
        </span>
        <span className="absolute bottom-4 left-4 rounded-full bg-zinc-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {caption || "Vehicle video"} — tap to play
        </span>
      </button>
    );
  }

  return (
    <figure>
      { }
      <video
        controls
        autoPlay
        preload="metadata"
        playsInline
        className="h-[min(56vw,210px)] w-full max-w-full rounded-2xl bg-zinc-950 sm:aspect-[16/9] sm:h-auto"
        aria-label={`${title} video`}
      >
        <source src={src} />
        Your browser does not support video playback.
      </video>
      {caption && <figcaption className="mt-2 text-xs text-zinc-500">{caption}</figcaption>}
    </figure>
  );
}
