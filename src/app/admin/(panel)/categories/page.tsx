"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Shapes, Eye, EyeOff, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CategoryRow {
  id: string; name: string; slug: string; description: string | null; image: string | null;
  video: string | null; isActive: boolean; sortOrder: number;
  _count: { vehicles: number; media: number };
}

const emptyForm = { name: "", slug: "", description: "", isActive: true, sortOrder: 0 };

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const pendingImageRef = useRef<string | null>(null);

  const { data: categories, isLoading, isError, error } = useQuery<CategoryRow[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await api.get<CategoryRow[]>("/api/admin/categories");
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load categories");
      return res.data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
        ...(editing ? {} : pendingImageRef.current ? { image: pendingImageRef.current } : {}),
      };
      const res = editing
        ? await api.put(`/api/admin/categories/${editing.id}`, body)
        : await api.post("/api/admin/categories", body);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success(editing ? "Category updated." : "Category created.");
      setDialogOpen(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (c: CategoryRow) => {
      const res = await api.put(`/api/admin/categories/${c.id}`, { isActive: !c.isActive });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => { toast.success("Visibility updated."); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/admin/categories/${id}`);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Category deleted.");
      setDeleteTarget(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("files", file);
    fd.set("unlinked", "true"); // category images live on the category record itself
    const res = await api.upload<{ url: string }[]>("/api/admin/media/upload", fd);
    setUploading(false);
    if (!res.ok || !res.data || res.data.length === 0) {
      toast.error(res.error ?? "Image upload failed.");
      return;
    }
    const url = res.data[0].url;
    if (editing) {
      const updated = await api.put(`/api/admin/categories/${editing.id}`, { image: url });
      if (updated.ok) {
        toast.success("Category image updated.");
        refresh();
      } else {
        toast.error(updated.error ?? "Could not attach the image.");
      }
    } else {
      pendingImageRef.current = url;
      toast.success("Image ready — it will be attached when you create the category.");
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    pendingImageRef.current = null;
    setDialogOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? "", isActive: c.isActive, sortOrder: c.sortOrder });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950">Categories</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Organize your inventory — categories appear automatically on the website.</p>
        </div>
        <Button onClick={openCreate} className="rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <Card><CardContent className="p-6 text-sm text-red-600">{error instanceof Error ? error.message : "Failed to load categories."}</CardContent></Card>
      ) : (categories?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center">
          <Shapes className="mx-auto h-10 w-10 text-zinc-300" />
          <p className="mt-3 font-display text-lg font-semibold text-zinc-800">No categories yet</p>
          <p className="mt-1 text-sm text-zinc-500">Create your first category — e.g. Cars, SUVs, Trucks.</p>
          <Button onClick={openCreate} className="mt-5 rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories!.map((c) => (
            <Card key={c.id} className={cn("overflow-hidden", !c.isActive && "opacity-60")}>
              <div className="relative aspect-[16/8] bg-zinc-100">
                {c.image ? (
                   
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-300"><Shapes className="h-8 w-8" /></div>
                )}
                <Badge className={cn("absolute left-2 top-2 border-0", c.isActive ? "bg-emerald-500" : "bg-zinc-600")}>
                  {c.isActive ? "Visible" : "Hidden"}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold text-zinc-950">{c.name}</h3>
                    <p className="truncate text-xs text-zinc-400">/categories/{c.slug}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">{c._count.vehicles} vehicles</Badge>
                </div>
                {c.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">{c.description}</p>}
                <div className="mt-3 flex items-center gap-1 border-t border-zinc-100 pt-3">
                  <Button variant="ghost" size="sm" className="h-8 flex-1 rounded-full text-xs" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 flex-1 rounded-full text-xs" onClick={() => toggleActive.mutate(c)} disabled={toggleActive.isPending}>
                    {c.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {c.isActive ? "Hide" : "Show"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? `Edit "${editing.name}"` : "Add New Category"}</DialogTitle>
            <DialogDescription>
              Categories automatically appear on the website when visible.
              {editing && " Upload a new image to replace the current one."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Cars" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>URL Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto from name" />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description shown on category cards…" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-3.5 py-3">
              <Label>Visible on website</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>
            {editing && (
              <div className="space-y-1.5">
                <Label>Category Image</Label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 hover:border-amber-400">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload new image (JPG, PNG, WEBP)"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} disabled={uploading} />
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || form.name.trim().length < 2}
              className="bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget._count.vehicles > 0
                ? `This category still contains ${deleteTarget._count.vehicles} vehicle(s). Move or delete them first — they would be deleted along with it.`
                : "This will permanently remove the category. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={remove.isPending || (deleteTarget?._count.vehicles ?? 0) > 0}
              onClick={(e) => { e.preventDefault(); if (deleteTarget) remove.mutate(deleteTarget.id); }}
            >
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
