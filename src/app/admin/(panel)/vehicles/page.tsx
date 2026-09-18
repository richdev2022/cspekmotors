"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle, Search, Pencil, Trash2, Eye, EyeOff, Star, ExternalLink, Loader2, Car, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatPrice, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VehicleWithRelations } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  RESERVED: "bg-amber-100 text-amber-700",
  SOLD: "bg-red-100 text-red-700",
  HIDDEN: "bg-zinc-200 text-zinc-600",
};

interface ListResponse {
  items: VehicleWithRelations[];
  total: number; page: number; limit: number; totalPages: number;
}

export default function AdminVehiclesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<VehicleWithRelations | null>(null);

  const { data, isLoading, isError, error } = useQuery<ListResponse>({
    queryKey: ["admin-vehicles", { search, status, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      const res = await api.get<ListResponse>(`/api/admin/vehicles?${params.toString()}`);
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load vehicles");
      return res.data;
    },
  });

  const patchVehicle = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await api.put(`/api/admin/vehicles/${id}`, body);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Vehicle updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/admin/vehicles/${id}`);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Vehicle deleted successfully.");
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950">Vehicles</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {data ? `${data.total} vehicle${data.total === 1 ? "" : "s"} in your inventory` : "Manage your vehicle inventory"}
          </p>
        </div>
        <Button asChild className="rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
          <Link href="/admin/vehicles/new"><PlusCircle className="h-4 w-4" /> Add Vehicle</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, brand or model…"
            className="pl-9"
            aria-label="Search vehicles"
          />
        </form>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
            <SelectItem value="HIDDEN">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-14 w-full" /></TableCell>
                  </TableRow>
                ))}

              {isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-red-600">
                    {error instanceof Error ? error.message : "Failed to load vehicles."}
                  </TableCell>
                </TableRow>
              )}

              {data?.items.map((v) => {
                const primary = v.media.find((m) => m.isPrimary) ?? v.media.find((m) => m.type === "IMAGE");
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      {primary ? (
                         
                        <img src={primary.url} alt={v.title} className="h-11 w-16 rounded-lg object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400"><Car className="h-4 w-4" /></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[260px] truncate text-sm font-semibold text-zinc-900">{v.title}</p>
                      <p className="text-xs text-zinc-500">
                        {v.brand} · {v.year}
                        {v.isFeatured && <span className="ml-1.5 inline-flex items-center text-amber-600"><Star className="h-3 w-3 fill-current" /></span>}
                        {!v.isPublished && <span className="ml-1.5 text-xs font-medium text-red-500">(unpublished)</span>}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-zinc-600 md:table-cell">{v.category.name}</TableCell>
                    <TableCell className="text-sm font-semibold text-zinc-900">{formatPrice(v.price, v.currency)}</TableCell>
                    <TableCell>
                      <Badge className={cn("border-0 text-[10px]", STATUS_BADGE[v.status])}>{v.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-zinc-500 lg:table-cell">{formatDate(v.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          title={v.isPublished ? "Unpublish (hide from website)" : "Publish to website"}
                          onClick={() => patchVehicle.mutate({ id: v.id, body: { isPublished: !v.isPublished } })}
                          disabled={patchVehicle.isPending}
                        >
                          {v.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-red-500" />}
                        </IconButton>
                        <IconButton
                          title={v.isFeatured ? "Remove from featured" : "Mark as featured (shows on homepage)"}
                          onClick={() => patchVehicle.mutate({ id: v.id, body: { isFeatured: !v.isFeatured } })}
                          disabled={patchVehicle.isPending}
                        >
                          <Star className={cn("h-4 w-4", v.isFeatured && "fill-amber-400 text-amber-500")} />
                        </IconButton>
                        <IconButton title="View on website" onClick={() => window.open(`/vehicles/${v.slug}`, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </IconButton>
                        <IconButton title="Edit vehicle">
                          <Link href={`/admin/vehicles/${v.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </IconButton>
                        <IconButton title="Delete vehicle" onClick={() => setDeleteTarget(v)} className="hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <Car className="mx-auto h-10 w-10 text-zinc-300" />
                    <p className="mt-3 font-display text-lg font-semibold text-zinc-800">No vehicles found</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {search || status !== "all" ? "Try adjusting your search or filters." : "Add your first vehicle to get started."}
                    </p>
                    <Button asChild className="mt-5 rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
                      <Link href="/admin/vehicles/new"><PlusCircle className="h-4 w-4" /> Add Vehicle</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
            <p className="text-xs text-zinc-500">Page {data.page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-zinc-800">{deleteTarget?.title}</span> will be permanently
              removed along with its {deleteTarget?.media.length ?? 0} media file(s). Customer enquiries will be
              preserved for your records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteVehicle.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteVehicle.mutate(deleteTarget.id);
              }}
            >
              {deleteVehicle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete Vehicle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IconButton({
  children, title, onClick, className, disabled,
}: {
  children: React.ReactNode; title: string; onClick?: () => void; className?: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}
