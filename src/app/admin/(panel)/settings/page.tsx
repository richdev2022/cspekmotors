"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, UploadCloud, Plus, Trash2, Building2, Globe, Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { upload as uploadBlob } from "@vercel/blob/client";

interface SettingsData {
  companyName: string; logo: string | null; logoLight: string | null; logoDark: string | null; tagline: string;
  phone: string | null; phoneSecondary: string | null; whatsapp: string | null; email: string | null; address: string | null;
  businessHours: string | null; mapUrl: string | null;
  facebook: string | null; instagram: string | null; tiktok: string | null; twitter: string | null; youtube: string | null;
  websiteTitle: string; websiteDescription: string;
  seoDefaultTitle: string | null; seoDefaultDescription: string | null; socialSharingImage: string | null; heroImage: string | null;
}

interface HourRow { days: string; hours: string }

export default function AdminSettingsPage() {
  const { data, isLoading, isError, error } = useQuery<SettingsData & { businessHoursRows: HourRow[] }>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await api.get<SettingsData & { businessHoursRows: HourRow[] }>("/api/admin/settings");
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load settings");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-sm text-red-600">{error instanceof Error ? error.message : "Failed to load settings."}</CardContent>
      </Card>
    );
  }

  if (!data) return null;
  return <SettingsForm key={data.websiteTitle} data={data} />;
}

function SettingsForm({ data }: { data: SettingsData & { businessHoursRows: HourRow[] } }) {
  const qc = useQueryClient();
  const shareRef = useRef<HTMLInputElement>(null);
  const lightLogoRef = useRef<HTMLInputElement>(null);
  const darkLogoRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);
  const [uploadingShare, setUploadingShare] = useState(false);
  const [uploadingLightLogo, setUploadingLightLogo] = useState(false);
  const [uploadingDarkLogo, setUploadingDarkLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroUrl, setHeroUrl] = useState("");

  // Initialized once from loaded data — no sync effect needed
  const [form, setForm] = useState<Record<string, string>>(() => ({
    companyName: data.companyName, tagline: data.tagline,
    phone: data.phone ?? "", phoneSecondary: data.phoneSecondary ?? "", whatsapp: data.whatsapp ?? "", email: data.email ?? "", address: data.address ?? "",
    mapUrl: data.mapUrl ?? "",
    facebook: data.facebook ?? "", instagram: data.instagram ?? "", tiktok: data.tiktok ?? "", twitter: data.twitter ?? "", youtube: data.youtube ?? "",
    websiteTitle: data.websiteTitle, websiteDescription: data.websiteDescription,
    seoDefaultTitle: data.seoDefaultTitle ?? "", seoDefaultDescription: data.seoDefaultDescription ?? "",
    socialSharingImage: data.socialSharingImage ?? "",
    heroImage: data.heroImage ?? "",
    logoLight: data.logoLight ?? "",
    logoDark: data.logoDark ?? "",
  }));
  const [hours, setHours] = useState<HourRow[]>(() => data.businessHoursRows ?? []);

  const [tab, setTab] = useState("company");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: async () => {
      const res = await api.put("/api/admin/settings", { ...form, businessHours: hours });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Settings saved. Website updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function uploadImage(file: File | undefined, purpose: "logoLight" | "logoDark" | "share" | "hero") {
    if (!file) return;
    if (purpose === "share") setUploadingShare(true);
    else if (purpose === "logoLight") setUploadingLightLogo(true);
    else if (purpose === "hero") setUploadingHero(true);
    else setUploadingDarkLogo(true);

    try {
      const blob = await uploadBlob(`site/${purpose}-${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/media/upload-client",
        clientPayload: JSON.stringify({ purpose, unlinked: true, fileSize: file.size, fileType: file.type }),
      });
      const url = blob.url;
      const field = purpose === "share" ? "socialSharingImage" : purpose === "hero" ? "heroImage" : purpose;
      setForm((f) => ({ ...f, [field]: url }));
      const put = await api.put("/api/admin/settings", { [field]: url });
      if (put.ok) {
        toast.success(
          purpose === "share" ? "Social sharing image updated." : purpose === "hero" ? "Hero image updated." : "Logo updated."
        );
        qc.invalidateQueries({ queryKey: ["admin-settings"] });
      } else {
        toast.error(put.error ?? "Could not attach the image.");
      }
    } finally {
      if (purpose === "share") setUploadingShare(false);
      else if (purpose === "logoLight") setUploadingLightLogo(false);
      else if (purpose === "hero") setUploadingHero(false);
      else setUploadingDarkLogo(false);
    }
  }

  async function importHeroUrl() {
    if (!heroUrl.trim()) return;
    setUploadingHero(true);
    try {
      const res = await api.post<{ url: string }>("/api/admin/media/import-url", { url: heroUrl.trim(), unlinked: true, purpose: "hero" });
      if (!res.ok || !res.data?.url) throw new Error(res.error ?? "Could not import hero image.");
      const put = await api.put("/api/admin/settings", { heroImage: res.data.url });
      if (!put.ok) throw new Error(put.error ?? "Could not save hero image.");
      setForm((f) => ({ ...f, heroImage: res.data!.url }));
      setHeroUrl("");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Hero image imported and saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import hero image.");
    } finally {
      setUploadingHero(false);
    }
  }

  async function clearHeroImage() {
    if (!form.heroImage || !window.confirm("Remove the hero image from the homepage?")) return;
    const res = await api.put("/api/admin/settings", { heroImage: null });
    if (!res.ok) {
      toast.error(res.error ?? "Could not remove the hero image.");
      return;
    }
    setForm((f) => ({ ...f, heroImage: "" }));
    qc.invalidateQueries({ queryKey: ["admin-settings"] });
    toast.success("Hero image removed.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-950">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Company details, contact info, SEO defaults and social links — no code needed.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="company"><Building2 className="mr-1.5 h-4 w-4" /> Company</TabsTrigger>
          <TabsTrigger value="contact"><Phone className="mr-1.5 h-4 w-4" /> Contact</TabsTrigger>
          <TabsTrigger value="website"><Globe className="mr-1.5 h-4 w-4" /> Website & SEO</TabsTrigger>
          <TabsTrigger value="social"><Share2 className="mr-1.5 h-4 w-4" /> Social Media</TabsTrigger>
        </TabsList>

        {/* COMPANY */}
        <TabsContent value="company" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Business Identity</CardTitle>
              <CardDescription>Shown across the website, footer and structured data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Company Name"><Input value={form.companyName ?? ""} onChange={set("companyName")} /></Field>
              <Field label="Tagline"><Input value={form.tagline ?? ""} onChange={set("tagline")} /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Brand Logos</CardTitle>
              <CardDescription>
                Two logo versions keep the brand crisp everywhere: the dark artwork sits on white/light backgrounds,
                the silver artwork on dark backgrounds. Both are used across the website and in SEO structured data.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <Field label="Logo for Light Backgrounds" hint="Dark text artwork — navbar (scrolled), light sections, print.">
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  {form.logoLight ? (
                     
                    <img src={form.logoLight} alt="Logo for light backgrounds" className="mx-auto h-14 w-auto" />
                  ) : (
                    <span className="flex h-14 items-center justify-center text-[10px] text-zinc-400">No logo set</span>
                  )}
                  <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-amber-400">
                    {uploadingLightLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    {uploadingLightLogo ? "Uploading…" : "Replace Logo"}
                    <input ref={lightLogoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], "logoLight")} />
                  </label>
                </div>
              </Field>
              <Field label="Logo for Dark Backgrounds" hint="Silver artwork — navbar over hero, footer, admin panel.">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  {form.logoDark ? (
                     
                    <img src={form.logoDark} alt="Logo for dark backgrounds" className="mx-auto h-14 w-auto" />
                  ) : (
                    <span className="flex h-14 items-center justify-center text-[10px] text-zinc-500">No logo set</span>
                  )}
                  <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-amber-400">
                    {uploadingDarkLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    {uploadingDarkLogo ? "Uploading…" : "Replace Logo"}
                    <input ref={darkLogoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], "logoDark")} />
                  </label>
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Homepage Hero Image</CardTitle>
              <CardDescription>Displayed behind the landing page hero copy. Use a wide JPG, PNG or WEBP image.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                {form.heroImage ? (
                  <img src={form.heroImage} alt="Hero background preview" className="h-20 w-36 rounded-lg border border-zinc-200 object-cover" />
                ) : (
                  <span className="flex h-20 w-36 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-center text-[10px] text-zinc-400">No hero image set</span>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-amber-400">
                    {uploadingHero ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    {uploadingHero ? "Uploading…" : form.heroImage ? "Replace Hero Image" : "Upload Hero Image"}
                    <input ref={heroRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { uploadImage(e.target.files?.[0], "hero"); e.currentTarget.value = ""; }} />
                  </label>
  {form.heroImage && <Button type="button" variant="outline" size="sm" className="rounded-full text-xs text-red-600 hover:bg-red-50" onClick={clearHeroImage}>Remove</Button>}
  </div>
  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
    <Input value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="Or paste an image URL" type="url" aria-label="Hero image URL" />
    <Button type="button" variant="outline" onClick={importHeroUrl} disabled={uploadingHero || !heroUrl.trim()}>Use URL</Button>
  </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-base">Business Hours</CardTitle>
                <CardDescription>Displayed on the contact page and footer.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setHours((h) => [...h, { days: "", hours: "" }])}>
                <Plus className="h-4 w-4" /> Add Row
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {hours.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Days (e.g. Monday – Friday)" value={row.days} onChange={(e) => setHours((h) => h.map((r, idx) => idx === i ? { ...r, days: e.target.value } : r))} />
                  <Input placeholder="Hours (e.g. 8:00 AM – 6:00 PM)" value={row.hours} onChange={(e) => setHours((h) => h.map((r, idx) => idx === i ? { ...r, hours: e.target.value } : r))} />
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-500 hover:bg-red-50" onClick={() => setHours((h) => h.filter((_, idx) => idx !== i))} aria-label="Remove row">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {hours.length === 0 && <p className="text-sm text-zinc-400">No business hours configured.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTACT */}
        <TabsContent value="contact" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Contact Information</CardTitle>
              <CardDescription>Used by the contact page, footer and WhatsApp enquiries.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone Number (Line 1)"><Input value={form.phone ?? ""} onChange={set("phone")} placeholder="08039552546" /></Field>
              <Field label="Phone Number (Line 2)" hint="Optional second line — shown next to the primary number on the website."><Input value={form.phoneSecondary ?? ""} onChange={set("phoneSecondary")} placeholder="09074884438" /></Field>
              <Field label="WhatsApp Number" hint="International format, digits only — e.g. 2348039552546 for 08039552546">
                <Input value={form.whatsapp ?? ""} onChange={set("whatsapp")} placeholder="2348039552546" />
              </Field>
              <Field label="Email Address"><Input type="email" value={form.email ?? ""} onChange={set("email")} placeholder="info@cspekmotors.com" /></Field>
              <Field label="Google Maps URL"><Input value={form.mapUrl ?? ""} onChange={set("mapUrl")} placeholder="https://maps.google.com/?q=…" /></Field>
              <Field label="Showroom Address" className="sm:col-span-2"><Textarea rows={2} value={form.address ?? ""} onChange={set("address")} /></Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEBSITE & SEO */}
        <TabsContent value="website" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Website Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Website Title (browser tab / SEO)"><Input value={form.websiteTitle ?? ""} onChange={set("websiteTitle")} /></Field>
              <Field label="Website Description"><Textarea rows={3} value={form.websiteDescription ?? ""} onChange={set("websiteDescription")} /></Field>
              <Field label="Default SEO Title"><Input value={form.seoDefaultTitle ?? ""} onChange={set("seoDefaultTitle")} placeholder="Falls back to website title" /></Field>
              <Field label="Default SEO Description"><Textarea rows={2} value={form.seoDefaultDescription ?? ""} onChange={set("seoDefaultDescription")} /></Field>
              <Field label="Social Sharing Image (Open Graph)">
                <div className="flex items-center gap-4">
                  {form.socialSharingImage ? (
                    <img src={form.socialSharingImage} alt="Social sharing" className="h-14 w-24 rounded-lg border border-zinc-200 object-cover" />
                  ) : (
                    <span className="flex h-14 w-24 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-[10px] text-zinc-400">None</span>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-amber-400">
                    {uploadingShare ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    {uploadingShare ? "Uploading…" : "Upload Image"}
                    <input ref={shareRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], "share")} />
                  </label>
                </div>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL */}
        <TabsContent value="social" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Social Media Links</CardTitle>
              <CardDescription>Shown in the footer and used in structured data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Facebook"><Input value={form.facebook ?? ""} onChange={set("facebook")} placeholder="https://facebook.com/…" /></Field>
              <Field label="Instagram"><Input value={form.instagram ?? ""} onChange={set("instagram")} placeholder="https://instagram.com/…" /></Field>
              <Field label="TikTok"><Input value={form.tiktok ?? ""} onChange={set("tiktok")} placeholder="https://tiktok.com/@…" /></Field>
              <Field label="X / Twitter"><Input value={form.twitter ?? ""} onChange={set("twitter")} placeholder="https://x.com/…" /></Field>
              <Field label="YouTube"><Input value={form.youtube ?? ""} onChange={set("youtube")} placeholder="https://youtube.com/@…" /></Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 z-20 flex justify-end rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="min-w-40 rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
          {save.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Save All Settings <Save className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className ? `${className} space-y-1.5` : "space-y-1.5"}>
      <Label className="text-[13px] font-semibold text-zinc-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
