"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Loader2, Save, Plus, Trash2, UploadCloud, X, Play, Star, ChevronUp, ChevronDown, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";

// ------------------------------------------------------------
// Form schema (mirrors the API zod schema)
// ------------------------------------------------------------
const formSchema = z.object({
  title: z.string().min(3, "Vehicle title is required.").max(160),
  brand: z.string().min(1, "Brand is required.").max(80),
  model: z.string().min(1, "Model is required.").max(80),
  year: z.coerce.number().int().min(1950).max(2100),
  categoryId: z.string().min(1, "Please select a category."),
  price: z.string().optional(),
  currency: z.string().default("NGN"),
  condition: z.string().default("USED"),
  status: z.string().default("AVAILABLE"),
  location: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(10000).optional(),
  mileage: z.string().optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  engine: z.string().optional(),
  colour: z.string().optional(),
  bodyType: z.string().optional(),
  driveType: z.string().optional(),
  seats: z.string().optional(),
  specifications: z.array(z.object({ label: z.string().min(1, "Label required"), value: z.string().min(1, "Value required") })).default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(320).optional(),
  seoKeywords: z.string().max(300).optional(),
  slug: z.string().optional(),
});

type FormValues = z.input<typeof formSchema>;

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export function VehicleForm({
  mode,
  vehicleId,
  initial,
}: {
  mode: "create" | "edit";
  vehicleId?: string;
  initial?: Record<string, unknown>;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: categories } = useQuery<CategoryOption[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await api.get<CategoryOption[]>("/api/admin/categories");
      if (!res.ok || !res.data) throw new Error(res.error);
      return res.data;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial ?? {
      title: "", brand: "", model: "", year: new Date().getFullYear(),
      categoryId: "", price: "", currency: "NGN", condition: "USED", status: "AVAILABLE",
      location: "", shortDescription: "", description: "", mileage: "", transmission: "",
      fuelType: "", engine: "", colour: "", bodyType: "", driveType: "", seats: "",
      specifications: [], isFeatured: false, isPublished: true, seoTitle: "", seoDescription: "", seoKeywords: "", slug: "",
    },
  });

  const specsArray = useFieldArray({ control: form.control, name: "specifications" });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const currency = useWatch({ control: form.control, name: "currency" });
  const condition = useWatch({ control: form.control, name: "condition" });
  const status = useWatch({ control: form.control, name: "status" });
  const isPublished = useWatch({ control: form.control, name: "isPublished" });
  const isFeatured = useWatch({ control: form.control, name: "isFeatured" });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const numOrNull = (v?: string) => (v && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : null);

    const payload = {
      ...values,
      year: Number(values.year),
      price: numOrNull(values.price),
      mileage: numOrNull(values.mileage),
      seats: numOrNull(values.seats),
    };

    const res =
      mode === "create"
        ? await api.post<{ id: string; slug: string }>("/api/admin/vehicles", payload)
        : await api.put<{ id: string; slug: string }>(`/api/admin/vehicles/${vehicleId}`, payload);

    if (!res.ok || !res.data) {
      toast.error(res.error ?? "Could not save the vehicle. Please review the form and try again.");
      setSaving(false);
      return;
    }

    qc.invalidateQueries({ queryKey: ["admin-vehicles"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    if (mode === "create") {
      toast.success("Vehicle created! Now upload photos and videos below.");
      router.push(`/admin/vehicles/${res.data.id}/edit`);
    } else {
      toast.success("Vehicle saved successfully.");
      setSaving(false);
      router.refresh();
    }
  }

  const err = (name: string) => form.formState.errors[name]?.message as string | undefined;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Tabs defaultValue="basic" className="space-y-5">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          {mode === "edit" && <TabsTrigger value="media">Media & Gallery</TabsTrigger>}
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ---------------- BASIC ---------------- */}
        <TabsContent value="basic" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Vehicle Identity</CardTitle>
              <CardDescription>Core details customers see first.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle Title *" error={err("title")} className="sm:col-span-2">
                <Input placeholder="e.g. Toyota Land Cruiser 300 VXR 2023" {...form.register("title")} />
              </Field>
              <Field label="Brand *" error={err("brand")}>
                <Input placeholder="e.g. Toyota" {...form.register("brand")} />
              </Field>
              <Field label="Model *" error={err("model")}>
                <Input placeholder="e.g. Land Cruiser 300" {...form.register("model")} />
              </Field>
              <Field label="Year *" error={err("year")}>
                <Input type="number" placeholder="2023" {...form.register("year")} />
              </Field>
              <Field label="Category *" error={err("categoryId")}>
                <Select value={categoryId} onValueChange={(v) => form.setValue("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Pricing & Availability</CardTitle>
              <CardDescription>
                For your records and the sales team only — price and these details are NOT shown on the public
                website. Customers are directed to contact you on WhatsApp, by phone or via the enquiry form.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Price (admin only)" error={err("price")} hint="Kept private — never shown on the public site">
                <Input type="number" min="0" placeholder="e.g. 85000000" {...form.register("price")} />
              </Field>
              <Field label="Currency">
                <Select value={currency} onValueChange={(v) => form.setValue("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN — Naira (₦)</SelectItem>
                    <SelectItem value="USD">USD — Dollar ($)</SelectItem>
                    <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP — Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Condition">
                <Select value={condition} onValueChange={(v) => form.setValue("condition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Brand New</SelectItem>
                    <SelectItem value="USED">Used</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={status} onValueChange={(v) => form.setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                    <SelectItem value="HIDDEN">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Location" className="sm:col-span-2">
                <Input placeholder="e.g. Lagos, Nigeria" {...form.register("location")} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Descriptions</CardTitle>
              <CardDescription>
                Internal notes for the sales team — descriptions are not published on the public website while
                "contact for details" mode is active.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Short Description" error={err("shortDescription")} hint="Internal / SEO use (max 300 characters) — not shown on public listing cards">
                <Textarea rows={2} maxLength={300} placeholder="One or two punchy sentences that sell the vehicle…" {...form.register("shortDescription")} />
              </Field>
              <Field label="Full Description">
                <Textarea rows={7} placeholder="Full details — condition, features, history, reasons to buy. Separate paragraphs with a blank line." {...form.register("description")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- SPECS ---------------- */}
        <TabsContent value="specs" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Technical Details</CardTitle>
              <CardDescription>
                Private reference for the sales team — not displayed publicly. Customers receive these details
                directly when they enquire.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Mileage (km)"><Input type="number" min="0" placeholder="e.g. 45000" {...form.register("mileage")} /></Field>
              <Field label="Transmission"><Input placeholder="e.g. 10-Speed Automatic" {...form.register("transmission")} /></Field>
              <Field label="Fuel Type"><Input placeholder="e.g. Petrol / Diesel" {...form.register("fuelType")} /></Field>
              <Field label="Engine"><Input placeholder="e.g. 3.5L V6 Twin-Turbo" {...form.register("engine")} /></Field>
              <Field label="Colour"><Input placeholder="e.g. Pearl White" {...form.register("colour")} /></Field>
              <Field label="Body Type"><Input placeholder="e.g. SUV / Sedan / Pickup" {...form.register("bodyType")} /></Field>
              <Field label="Drive Type"><Input placeholder="e.g. 4WD / FWD / 6x4" {...form.register("driveType")} /></Field>
              <Field label="Seats"><Input type="number" min="0" placeholder="e.g. 5" {...form.register("seats")} /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-base">Custom Specifications</CardTitle>
                <CardDescription>Private spec sheet for your team — shared with customers on enquiry, not published online.</CardDescription>
              </div>
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => specsArray.append({ label: "", value: "" })}
              >
                <Plus className="h-4 w-4" /> Add Spec
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {specsArray.fields.length === 0 && (
                <p className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
                  No custom specifications yet. Click “Add Spec” to add rows like “Warranty — 3 years”.
                </p>
              )}
              {specsArray.fields.map((field, i) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <Input placeholder="Label (e.g. Warranty)" {...form.register(`specifications.${i}.label` as const)} />
                    <Input placeholder="Value (e.g. 3 years / 100,000km)" {...form.register(`specifications.${i}.value` as const)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => specsArray.remove(i)} aria-label="Remove specification">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- MEDIA (edit mode only) ---------------- */}
        {mode === "edit" && vehicleId && (
          <TabsContent value="media">
            <MediaManager vehicleId={vehicleId} />
          </TabsContent>
        )}

        {/* ---------------- SEO ---------------- */}
        <TabsContent value="seo" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Search Engine Optimization</CardTitle>
              <CardDescription className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                Leave any field empty and we will generate sensible defaults automatically from the vehicle details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="URL Slug" hint="Leave empty to auto-generate from the title">
                <Input placeholder="toyota-land-cruiser-300-2023" {...form.register("slug")} />
              </Field>
              <Field label="SEO Title" hint="Recommended: under 60 characters">
                <Input placeholder="e.g. Toyota Land Cruiser 2024 for Sale | C-SPEK MOTORS LTD" {...form.register("seoTitle")} />
              </Field>
              <Field label="SEO Description" hint="Recommended: 120–160 characters">
                <Textarea rows={3} placeholder="Appears under the title in Google search results…" {...form.register("seoDescription")} />
              </Field>
              <Field label="SEO Keywords" hint="Comma separated">
                <Input placeholder="toyota, land cruiser, suv, for sale, lagos" {...form.register("seoKeywords")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save bar */}
      <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 font-medium text-zinc-700">
            <Switch checked={isPublished} onCheckedChange={(v) => form.setValue("isPublished", v)} />
            Published (visible on website)
          </label>
          <label className="flex items-center gap-2 font-medium text-zinc-700">
            <Switch checked={isFeatured} onCheckedChange={(v) => form.setValue("isFeatured", v)} />
            Featured on homepage
          </label>
        </div>
        <Button type="submit" disabled={saving} className="min-w-44 rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : mode === "create" ? (
            <>Create Vehicle <Save className="h-4 w-4" /></>
          ) : (
            <>Save Changes <Save className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Media manager (upload / reorder / primary / delete / captions)
// ------------------------------------------------------------
export interface MediaItem {
  id: string;
  url: string;
  type: string;
  filename: string;
  caption?: string | null;
  fileSize?: number | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt?: string;
}

export function MediaManager({ vehicleId, standalone = false }: { vehicleId?: string; standalone?: boolean }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<MediaItem[] | null>(null);

  // Load media for this vehicle
  const { data, isLoading } = useQuery<{ media: MediaItem[] }>({
    queryKey: ["vehicle-media", vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const res = await api.get<{ media: MediaItem[] }>(`/api/admin/vehicles/${vehicleId}`);
      if (!res.ok || !res.data) throw new Error(res.error);
      return { media: res.data.media };
    },
  });

  const media = standalone ? items : data?.media;

  function setLocal(next: MediaItem[]) {
    setItems(next);
    if (vehicleId) qc.setQueryData(["vehicle-media", vehicleId], { media: next });
  }

  async function handleFiles(files: FileList | File[] | null) {
    if (!files || !vehicleId) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    const fd = new FormData();
    fd.set("vehicleId", vehicleId);
    list.forEach((f) => fd.append("files", f));

    setUploading(true);
    setProgress(0);
    const res = await api.upload<MediaItem[]>("/api/admin/media/upload", fd, setProgress);
    setUploading(false);

    if (!res.ok || !res.data) {
      toast.error(res.error ?? "Upload failed.");
      return;
    }
    toast.success(`${res.data.length} file(s) uploaded.`);
    qc.invalidateQueries({ queryKey: ["vehicle-media", vehicleId] });
    qc.invalidateQueries({ queryKey: ["admin-media"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const patch = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await api.patch(`/api/admin/media/${id}`, body);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_d, vars) => {
      if (vars.body.sortOrder !== undefined) {
        qc.invalidateQueries({ queryKey: ["vehicle-media", vehicleId] });
      }
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/admin/media/${id}`);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Media deleted.");
      if (vehicleId) {
        qc.invalidateQueries({ queryKey: ["vehicle-media", vehicleId] });
        qc.invalidateQueries({ queryKey: ["admin-vehicles"] });
      }
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function makePrimary(m: MediaItem) {
    if (vehicleId) {
      patch.mutate({ id: m.id, body: { isPrimary: true } });
      if (media) setLocal(media.map((x) => ({ ...x, isPrimary: x.id === m.id })));
      toast.success("Primary image updated.");
    }
  }

  async function move(m: MediaItem, dir: -1 | 1) {
    if (!media) return;
    const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder || (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
    const idx = sorted.findIndex((x) => x.id === m.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    // swap sortOrders
    patch.mutate({ id: m.id, body: { sortOrder: other.sortOrder } });
    patch.mutate({ id: other.id, body: { sortOrder: m.sortOrder } });
    const next = sorted.map((x) => {
      if (x.id === m.id) return { ...x, sortOrder: other.sortOrder };
      if (x.id === other.id) return { ...x, sortOrder: m.sortOrder };
      return x;
    });
    setLocal(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base">Photos & Videos</CardTitle>
        <CardDescription>
          Upload multiple images (JPG, PNG, WEBP — max 8MB) and videos (MP4, WEBM, MOV — max 120MB).
          The primary image is used as the cover everywhere on the website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Dropzone */}
        {vehicleId && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            aria-label="Upload media files"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
              dragOver ? "border-amber-500 bg-amber-50" : "border-zinc-300 bg-zinc-50 hover:border-amber-400"
            )}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = ""; }}
            />
            {uploading ? (
              <div className="w-full max-w-sm space-y-3">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
                <p className="text-sm font-medium text-zinc-700">Uploading… {progress}%</p>
                <Progress value={progress} className="h-2" />
              </div>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-zinc-400" />
                <p className="mt-3 text-sm font-semibold text-zinc-700">
                  Drag & drop files here, or <span className="text-amber-600">browse</span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">Images: JPG, PNG, WEBP · Videos: MP4, WEBM, MOV</p>
              </>
            )}
          </div>
        )}

        {/* Media grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (media?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center">
            <UploadCloud className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-600">No media uploaded yet</p>
            <p className="mt-1 text-xs text-zinc-400">Uploaded images and videos will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...(media ?? [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder).map((m, idx, arr) => (
              <div key={m.id} className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="relative aspect-video bg-zinc-100">
                  {m.type === "VIDEO" ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-zinc-300">
                      <Play className="h-8 w-8 fill-current" />
                      <span className="mt-1.5 text-[10px] font-bold uppercase tracking-widest">Video</span>
                    </div>
                  ) : (
                     
                    <img src={m.url} alt={m.caption || m.filename} className="h-full w-full object-cover" loading="lazy" />
                  )}
                  {m.isPrimary && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-zinc-950">
                      <Star className="h-3 w-3 fill-current" /> PRIMARY
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove.mutate(m.id)}
                    disabled={remove.isPending}
                    className="absolute right-2 top-2 rounded-full bg-zinc-950/60 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                    aria-label={`Delete ${m.filename}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2 p-3">
                  <input
                    defaultValue={m.caption ?? ""}
                    placeholder="Add a caption…"
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val !== (m.caption ?? "")) patch.mutate({ id: m.id, body: { caption: val } });
                    }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-zinc-400" title={m.filename}>
                      {m.filename} {m.fileSize ? `· ${formatFileSize(m.fileSize)}` : ""}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" onClick={() => move(m, -1)} disabled={idx === 0} className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30" aria-label="Move earlier">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => move(m, 1)} disabled={idx === arr.length - 1} className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30" aria-label="Move later">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {m.type === "IMAGE" && !m.isPrimary && (
                    <Button type="button" variant="outline" size="sm" className="w-full rounded-full text-xs" onClick={() => makePrimary(m)}>
                      <Star className="h-3.5 w-3.5" /> Set as Primary
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <Skeleton className="aspect-video rounded-none" />
      <div className="space-y-2 p-3"><Skeleton className="h-6 w-full" /><Skeleton className="h-4 w-2/3" /></div>
    </div>
  );
}

function Field({
  label, children, error, hint, className,
}: {
  label: string; children: React.ReactNode; error?: string; hint?: string; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[13px] font-semibold text-zinc-700">{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {!error && hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
