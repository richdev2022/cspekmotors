"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud, Loader2, Images, Play, Trash2, ChevronDown, ChevronRight, Star, X,
  Wand2, Settings2, Sparkles, Film, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string; url: string; type: string; filename: string; caption: string | null;
  isPrimary: boolean; sortOrder: number; createdAt: string; vehicleId: string | null;
}
interface MediaVehicle { id: string; title: string; slug: string; media: MediaItem[] }
interface MediaCategory { id: string; name: string; slug: string; media: MediaItem[]; vehicles: MediaVehicle[] }
interface MediaData { categories: MediaCategory[]; unassigned: MediaItem[] }

export default function AdminMediaPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError, error } = useQuery<MediaData>({
    queryKey: ["admin-media", typeFilter],
    queryFn: async () => {
      const params = typeFilter !== "all" ? `?type=${typeFilter}` : "";
      const res = await api.get<MediaData>(`/api/admin/media${params}`);
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load media");
      return res.data;
    },
  });

  const deleteMedia = useDeleteMedia(qc);

  function toggle(key: string) {
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950">Media Library</h1>
          <p className="mt-0.5 text-sm text-zinc-500">All media grouped by Category → Vehicle — nothing ever gets mixed up.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Media</SelectItem>
              <SelectItem value="IMAGE">Images</SelectItem>
              <SelectItem value="VIDEO">Videos</SelectItem>
            </SelectContent>
          </Select>
          <UploadDialog onDone={() => { qc.invalidateQueries({ queryKey: ["admin-media"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); }} />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load media."}
        </div>
      )}

      {data?.categories.map((cat) => {
        const categoryOwnMedia = cat.media.filter((m) => !m.vehicleId);
        const vehiclesWithMedia = cat.vehicles.filter((v) => v.media.length > 0);
        const totalMedia = categoryOwnMedia.length + vehiclesWithMedia.reduce((acc, v) => acc + v.media.length, 0);

        if (totalMedia === 0) return null;

        const key = cat.id;
        const open = expanded[key] !== false; // default open

        return (
          <div key={cat.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <button
              onClick={() => toggle(key)}
              className="flex w-full items-center justify-between gap-3 bg-zinc-50 px-5 py-3.5 text-left transition-colors hover:bg-zinc-100"
              aria-expanded={open}
            >
              <span className="flex items-center gap-2.5">
                {open ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
                <span className="font-display text-base font-semibold text-zinc-900">{cat.name}</span>
                <span className="text-xs text-zinc-400">{totalMedia} file{totalMedia === 1 ? "" : "s"}</span>
              </span>
            </button>

            {open && (
              <div className="space-y-5 p-5">
                {/* Category-level media */}
                {categoryOwnMedia.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Category images ({categoryOwnMedia.length})
                    </p>
                    <MediaGrid items={categoryOwnMedia} onDelete={deleteMedia} />
                  </div>
                )}

                {/* Vehicle media */}
                {vehiclesWithMedia.map((v) => (
                  <div key={v.id}>
                    <p className="mb-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {cat.name} → <span className="normal-case text-amber-600">{v.title}</span>
                      <span className="font-normal normal-case text-zinc-300">({v.media.length})</span>
                    </p>
                    <MediaGrid items={v.media} onDelete={deleteMedia} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned media */}
      {data && data.unassigned.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <X className="h-3.5 w-3.5" /> Unlinked uploads ({data.unassigned.length}) — attached to no vehicle or category
          </p>
          <MediaGrid items={data.unassigned} onDelete={deleteMedia} />
        </div>
      )}

      {!isLoading && data && data.categories.every((c) => c.media.filter((m) => !m.vehicleId).length === 0 && c.vehicles.every((v) => v.media.length === 0)) && data.unassigned.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center">
          <Images className="mx-auto h-10 w-10 text-zinc-300" />
          <p className="mt-3 font-display text-lg font-semibold text-zinc-800">No media uploaded</p>
          <p className="mt-1 text-sm text-zinc-500">Upload photos and videos from the vehicle editor or the Upload button above.</p>
        </div>
      )}
    </div>
  );
}

function MediaGrid({ items, onDelete }: { items: MediaItem[]; onDelete: (m: MediaItem) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((m) => (
        <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
          { }
          <img src={m.url} alt={m.caption || m.filename} className="h-full w-full object-cover" loading="lazy" />
          {m.type === "VIDEO" && (
            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-zinc-950/75 px-2 py-0.5 text-[9px] font-bold text-white">
              <Play className="h-2.5 w-2.5 fill-current" /> VIDEO
            </span>
          )}
          {m.isPrimary && (
            <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-zinc-950">
              <Star className="h-2.5 w-2.5 fill-current" />
            </span>
          )}
          <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="truncate text-[9px] text-white/90" title={m.filename}>{m.filename}</span>
            <button
              onClick={() => onDelete(m)}
              className="shrink-0 rounded-full bg-white/15 p-1 text-white backdrop-blur transition hover:bg-red-600"
              aria-label={`Delete ${m.filename}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function useDeleteMedia(qc: ReturnType<typeof useQueryClient>) {
  return (m: MediaItem) => {
    if (!confirm(`Delete "${m.filename}" permanently? This cannot be undone.`)) return;
    api.del(`/api/admin/media/${m.id}`).then((res) => {
      if (res.ok) {
        toast.success("Media deleted.");
        qc.invalidateQueries({ queryKey: ["admin-media"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["vehicle-media"] });
      } else {
        toast.error(res.error ?? "Delete failed.");
      }
    });
  };
}

// ------------------------------------------------------------
// Upload dialog — Smart Wizard (AI auto-categorize) or Manual
// ------------------------------------------------------------
type UploadMode = "wizard" | "manual";

const ACCEPTED_MIMES = "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime";
const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 120;

interface CategoryOption { id: string; name: string }
interface VehicleOption { id: string; title: string; categoryName: string | null }

interface WizardFile {
  id: string;
  file: File;
  previewUrl: string | null; // object URL (images only)
  isVideo: boolean;
  status: "pending" | "analyzing" | "ready" | "uploading" | "done" | "error";
  detected: boolean;
  confidence?: number;
  description?: string;
  reason?: string;
  target: string; // "category:<id>" | "vehicle:<id>" | ""
  error?: string;
}

interface DetectResult {
  detected: boolean;
  categoryId?: string;
  categoryName?: string;
  confidence?: number;
  description?: string;
  reason?: string;
}

function clientValidate(f: File): string | null {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (f.type.startsWith("image/")) {
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return "Unsupported image format. Allowed: JPG, PNG, WEBP.";
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) return `Image too large — maximum ${MAX_IMAGE_MB}MB.`;
    return null;
  }
  if (f.type.startsWith("video/")) {
    if (!["mp4", "webm", "mov"].includes(ext)) return "Unsupported video format. Allowed: MP4, WEBM, MOV.";
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return `Video too large — maximum ${MAX_VIDEO_MB}MB.`;
    return null;
  }
  return "Unsupported format — use JPG, PNG, WEBP, MP4, WEBM or MOV.";
}

/** Shared categories + vehicles for the upload destination selects. */
function useDestinationOptions(enabled: boolean) {
  const { data: categories } = useQuery<CategoryOption[]>({
    queryKey: ["admin-categories"],
    enabled,
    queryFn: async () => {
      const res = await api.get<CategoryOption[]>("/api/admin/categories");
      if (!res.ok || !res.data) throw new Error(res.error);
      return res.data;
    },
  });
  const { data: vehicles } = useQuery<VehicleOption[]>({
    queryKey: ["media-dialog-vehicles"],
    enabled,
    queryFn: async () => {
      const res = await api.get<{ items: { id: string; title: string; category: { name: string } | null }[] }>("/api/admin/vehicles?limit=60");
      if (!res.ok || !res.data) throw new Error(res.error);
      return res.data.items.map((v) => ({ id: v.id, title: v.title, categoryName: v.category?.name ?? null }));
    },
  });
  return { categories: categories ?? [], vehicles: vehicles ?? [] };
}

function UploadDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<UploadMode>("wizard");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
          <UploadCloud className="h-4 w-4" /> Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Upload Media</DialogTitle>
          <DialogDescription>
            Let the Smart Wizard detect each vehicle and assign the right category automatically, or assign destinations yourself.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={mode} onValueChange={(v) => setMode(v as UploadMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wizard" className="gap-1.5"><Wand2 className="h-4 w-4" /> Smart Wizard</TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5"><Settings2 className="h-4 w-4" /> Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="wizard" className="mt-4">
            <WizardUploader open={open} onDone={onDone} onFinished={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="manual" className="mt-4">
            <ManualUploader open={open} onDone={onDone} onFinished={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Wizard: drop files → AI detection → review/adjust → upload
// ------------------------------------------------------------
function WizardUploader({ open, onDone, onFinished }: { open: boolean; onDone: () => void; onFinished: () => void }) {
  const { categories, vehicles } = useDestinationOptions(open);
  const [files, setFiles] = useState<WizardFile[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const analyzingRef = useRef(false);
  const analyzeQueue = useRef<WizardFile[]>([]);

  // Reset when the dialog closes (also frees object URLs)
  useEffect(() => {
    if (!open) {
      setFiles((prev) => {
        prev.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
        return [];
      });
      setUploadProgress(0);
      setUploading(false);
      setAnalyzing(false);
      analyzeQueue.current = [];
      analyzingRef.current = false;
    }
  }, [open]);

  function patchFile(id: string, patch: Partial<WizardFile>) {
    setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function drainQueue() {
    if (analyzingRef.current) return;
    analyzingRef.current = true;
    setAnalyzing(true);
    while (analyzeQueue.current.length > 0) {
      const batch = analyzeQueue.current;
      analyzeQueue.current = [];
      for (const wf of batch) {
        patchFile(wf.id, { status: "analyzing", error: undefined });
        const fd = new FormData();
        fd.append("file", wf.file);
        const res = await api.upload<DetectResult>("/api/admin/media/detect", fd);
        if (!res.ok || !res.data) {
          patchFile(wf.id, { status: "ready", detected: false, reason: res.error ?? "AI analysis failed — pick a destination manually." });
          continue;
        }
        if (!res.data.detected) {
          patchFile(wf.id, { status: "ready", detected: false, reason: res.data.reason ?? "Could not auto-detect. Pick a destination manually." });
          continue;
        }
        patchFile(wf.id, {
          status: "ready",
          detected: true,
          confidence: res.data.confidence,
          description: res.data.description,
          reason: undefined,
          target: res.data.categoryId ? `category:${res.data.categoryId}` : "",
        });
      }
    }
    analyzingRef.current = false;
    setAnalyzing(false);
  }

  function analyzeBatch(batch: WizardFile[]) {
    analyzeQueue.current.push(...batch);
    void drainQueue();
  }

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.length === 0 || uploading) return;
    const accepted: WizardFile[] = [];
    for (const f of incoming) {
      const err = clientValidate(f);
      if (err) {
        toast.error(`"${f.name}": ${err}`);
        continue;
      }
      accepted.push({
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        file: f,
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
        isVideo: f.type.startsWith("video/"),
        status: "pending",
        detected: false,
        target: "",
      });
    }
    if (accepted.length === 0) return;
    setFiles((prev) => [...prev, ...accepted]);
    // The wizard reads and categorizes uploads as soon as they arrive.
    analyzeBatch(accepted);
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function handleUploadAll() {
    const withTarget = files.filter((f) => (f.status === "ready" || f.status === "error") && f.target);
    const unassigned = files.filter((f) => (f.status === "ready" || f.status === "error") && !f.target).length;
    if (withTarget.length === 0) {
      toast.error("Assign a destination to at least one file first.");
      return;
    }
    if (unassigned > 0) {
      toast.error(`${unassigned} file(s) still need a destination. Assign or remove them.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < withTarget.length; i++) {
      const wf = withTarget[i];
      patchFile(wf.id, { status: "uploading", error: undefined });
      const fd = new FormData();
      const [kind, id] = wf.target.split(":");
      if (kind === "vehicle") fd.set("vehicleId", id);
      else fd.set("categoryId", id);
      fd.append("files", wf.file);
      const res = await api.upload("/api/admin/media/upload", fd, (pct) => {
        setUploadProgress(Math.round(((i + pct / 100) / withTarget.length) * 100));
      });
      if (res.ok) {
        ok += 1;
        patchFile(wf.id, { status: "done" });
      } else {
        failed += 1;
        patchFile(wf.id, { status: "error", error: res.error ?? "Upload failed." });
      }
      setUploadProgress(Math.round(((i + 1) / withTarget.length) * 100));
    }
    setUploading(false);
    onDone();

    if (failed === 0) {
      toast.success(`${ok} file(s) uploaded and categorized.`);
      setFiles([]);
      onFinished();
    } else {
      toast.warning(`${ok} uploaded, ${failed} failed — review the errors below, then upload again.`);
    }
  }

  const readyCount = files.filter((f) => (f.status === "ready" || f.status === "error") && f.target).length;
  const unassignedCount = files.filter((f) => (f.status === "ready" || f.status === "error") && !f.target).length;

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
          dragOver ? "border-amber-500 bg-amber-50" : "border-zinc-300 bg-zinc-50 hover:border-amber-400",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <UploadCloud className="h-6 w-6 text-zinc-400" />
        <p className="text-sm font-medium text-zinc-700">Drop images or videos here, or click to browse</p>
        <p className="text-xs text-zinc-400">
          Multiple files supported · JPG, PNG, WEBP, MP4, WEBM, MOV · max {MAX_IMAGE_MB}MB image / {MAX_VIDEO_MB}MB video
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPTED_MIMES}
          className="hidden"
          onChange={(e) => { addFiles(e.target.files ?? []); e.currentTarget.value = ""; }}
        />
      </div>

      {analyzing && (
        <p className="flex items-center gap-2 text-sm text-amber-700">
          <Loader2 className="h-4 w-4 animate-spin" /> AI wizard is reading your files and assigning categories…
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2.5">
          {files.map((wf) => (
            <WizardFileRow
              key={wf.id}
              wf={wf}
              categories={categories}
              vehicles={vehicles}
              disabled={uploading}
              onTarget={(t) => patchFile(wf.id, { target: t, error: undefined })}
              onRemove={() => removeFile(wf.id)}
              onRetry={() => analyzeBatch([wf])}
            />
          ))}
        </ul>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-center text-xs text-zinc-500">Uploading… {uploadProgress}%</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          {files.length > 0 && unassignedCount > 0
            ? `${unassignedCount} file(s) still need a destination.`
            : files.length > 0
              ? "All set — review the assignments above and upload."
              : "AI suggests a category per file. Category uploads show on the public category page — pick a vehicle to show them on its post."}
        </p>
        <Button
          onClick={handleUploadAll}
          disabled={analyzing || uploading || files.length === 0 || readyCount === 0 || unassignedCount > 0}
          className="shrink-0 rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600"
        >
          {uploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>) : (<><UploadCloud className="h-4 w-4" /> Upload {readyCount > 0 ? `${readyCount} File(s)` : ""}</>)}
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Wizard file row: thumbnail + AI hint + destination select
// ------------------------------------------------------------
function WizardFileRow({
  wf, categories, vehicles, disabled, onTarget, onRemove, onRetry,
}: {
  wf: WizardFile;
  categories: CategoryOption[];
  vehicles: VehicleOption[];
  disabled: boolean;
  onTarget: (t: string) => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-2.5">
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        {wf.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wf.previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <Film className="h-5 w-5" />
          </div>
        )}
        {wf.isVideo && (
          <span className="absolute bottom-1 left-1 rounded bg-zinc-950/70 px-1 py-0.5 text-[8px] font-bold text-white">VIDEO</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900" title={wf.file.name}>{wf.file.name}</p>
          <span className="shrink-0 text-xs text-zinc-400">{formatFileSize(wf.file.size)}</span>
          <StatusChip wf={wf} />
        </div>

        {wf.status === "analyzing" && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700">
            <Loader2 className="h-3 w-3 animate-spin" /> AI is looking at this file…
          </p>
        )}
        {wf.detected && wf.description && (
          <p className="truncate text-xs text-zinc-500" title={wf.description}>
            <Sparkles className="mr-1 inline h-3 w-3 text-amber-500" />{wf.description}
          </p>
        )}
        {!wf.detected && wf.reason && (wf.status === "ready" || wf.status === "error") && (
          <p className="text-xs text-amber-700"><AlertTriangle className="mr-1 inline h-3 w-3" />{wf.reason}</p>
        )}
        {wf.error && (
          <p className="text-xs text-red-600"><XCircle className="mr-1 inline h-3 w-3" />{wf.error}</p>
        )}

        <div className="flex items-center gap-2">
          <Select value={wf.target} onValueChange={onTarget} disabled={disabled}>
            <SelectTrigger className="h-8 min-w-0 flex-1 text-xs">
              <SelectValue placeholder="Assign destination…" />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Category images</SelectLabel>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={`category:${c.id}`}>{c.name}</SelectItem>
                  ))}
                </SelectGroup>
              )}
              {vehicles.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Vehicle galleries</SelectLabel>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={`vehicle:${v.id}`}>
                      {v.title}{v.categoryName ? ` — ${v.categoryName}` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={onRetry}
            disabled={disabled}
            title="Re-run AI detection"
            className="shrink-0 rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-amber-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            title="Remove from queue"
            className="shrink-0 rounded-full p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}

function StatusChip({ wf }: { wf: WizardFile }) {
  if (wf.status === "done") {
    return <Badge className="shrink-0 border-0 bg-emerald-100 text-[10px] text-emerald-700"><CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Uploaded</Badge>;
  }
  if (wf.status === "uploading") {
    return <Badge className="shrink-0 border-0 bg-blue-100 text-[10px] text-blue-700"><Loader2 className="mr-0.5 h-2.5 w-2.5 animate-spin" /> Uploading</Badge>;
  }
  if (wf.status === "analyzing") {
    return <Badge className="shrink-0 border-0 bg-amber-100 text-[10px] text-amber-700"><Loader2 className="mr-0.5 h-2.5 w-2.5 animate-spin" /> Analyzing</Badge>;
  }
  if (wf.status === "error") {
    return <Badge className="shrink-0 border-0 bg-red-100 text-[10px] text-red-700"><XCircle className="mr-0.5 h-2.5 w-2.5" /> Failed</Badge>;
  }
  if (wf.status === "ready") {
    return wf.detected ? (
      <Badge className="shrink-0 border-0 bg-emerald-100 text-[10px] text-emerald-700">
        <Sparkles className="mr-0.5 h-2.5 w-2.5" /> AI {Math.round((wf.confidence ?? 0) * 100)}%
      </Badge>
    ) : (
      <Badge className="shrink-0 border-0 bg-amber-100 text-[10px] text-amber-700">Needs review</Badge>
    );
  }
  return <Badge className="shrink-0 border-0 bg-zinc-100 text-[10px] text-zinc-600">Queued</Badge>;
}

// ------------------------------------------------------------
// Manual: pick one destination yourself, then choose files
// ------------------------------------------------------------
function ManualUploader({ open, onDone, onFinished }: { open: boolean; onDone: () => void; onFinished: () => void }) {
  const { categories, vehicles } = useDestinationOptions(open);
  const [target, setTarget] = useState<string>(""); // "vehicle:<id>" | "category:<id>"
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setTarget("");
      setProgress(0);
      setUploading(false);
    }
  }, [open]);

  async function handleUpload() {
    if (!target || files.length === 0) {
      toast.error("Choose a target and at least one file.");
      return;
    }
    const [kind, id] = target.split(":");
    const fd = new FormData();
    if (kind === "vehicle") fd.set("vehicleId", id);
    else fd.set("categoryId", id);
    files.forEach((f) => fd.append("files", f));

    setUploading(true);
    setProgress(0);
    const res = await api.upload("/api/admin/media/upload", fd, setProgress);
    setUploading(false);

    if (!res.ok) {
      toast.error(res.error ?? "Upload failed.");
      return;
    }
    toast.success(`${files.length} file(s) uploaded successfully.`);
    setFiles([]);
    onDone();
    onFinished();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Category / Vehicle target *</Label>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger><SelectValue placeholder="Choose where this media belongs" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={`category:${c.id}`}>
                {c.name} — category images
              </SelectItem>
            ))}
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={`vehicle:${v.id}`}>
                {v.title} — vehicle gallery
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Files *</Label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 transition-colors hover:border-amber-400"
        >
          <UploadCloud className="h-5 w-5" /> Click to choose images or videos
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPTED_MIMES}
          className="hidden"
          onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); e.currentTarget.value = ""; }}
        />
        {files.length > 0 && (
          <ul className="styled-scrollbar max-h-32 space-y-1 overflow-y-auto text-xs">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-zinc-100 px-2.5 py-1.5">
                <span className="truncate">{f.name}</span>
                <span className="ml-2 shrink-0 text-zinc-400">{formatFileSize(f.size)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-center text-xs text-zinc-500">Uploading… {progress}%</p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={uploading || !target || files.length === 0}
        className={cn("w-full rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600")}
      >
        {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <>Upload {files.length > 0 ? `${files.length} File(s)` : ""}</>}
      </Button>
    </div>
  );
}
