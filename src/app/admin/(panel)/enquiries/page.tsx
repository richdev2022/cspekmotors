"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone, Mail, ExternalLink, Trash2, Loader2, MessagesSquare, Paperclip, MessageCircleQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/site/floating-whatsapp";
import type { EnquiryWithRelations } from "@/types";

const STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "COMPLETED", "CLOSED"] as const;
const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-violet-100 text-violet-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-zinc-200 text-zinc-600",
};

interface EnquiriesResponse {
  items: EnquiryWithRelations[];
  total: number; page: number; totalPages: number;
  statusCounts: Record<string, number>;
}

export default function AdminEnquiriesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<EnquiryWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnquiryWithRelations | null>(null);

  const { data, isLoading, isError, error } = useQuery<EnquiriesResponse>({
    queryKey: ["admin-enquiries", status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status !== "all") params.set("status", status);
      const res = await api.get<EnquiriesResponse>(`/api/admin/enquiries?${params.toString()}`);
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load enquiries");
      return res.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const res = await api.put(`/api/admin/enquiries/${id}`, { status: newStatus });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_d, vars) => {
      toast.success(`Status updated to ${vars.newStatus.replace("_", " ").toLowerCase()}.`);
      qc.invalidateQueries({ queryKey: ["admin-enquiries"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setDetail(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/admin/enquiries/${id}`);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Enquiry deleted.");
      setDeleteTarget(null);
      setDetail(null);
      qc.invalidateQueries({ queryKey: ["admin-enquiries"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-950">Customer Enquiries</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Track, contact and convert every enquiry.</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" count={data ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0) : undefined} active={status === "all"} onClick={() => { setStatus("all"); setPage(1); }} />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={s.replace("_", " ")}
            count={data?.statusCounts[s]}
            active={status === s}
            onClick={() => { setStatus(s); setPage(1); }}
          />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                <TableHead className="hidden lg:table-cell">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
              ))}
              {isError && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-red-600">{error instanceof Error ? error.message : "Failed to load enquiries."}</TableCell></TableRow>
              )}
              {data?.items.map((e) => (
                <TableRow key={e.id} className="cursor-pointer" onClick={() => setDetail(e)}>
                  <TableCell>
                    <p className="text-sm font-semibold text-zinc-900">{e.customerName}</p>
                    <p className="text-xs text-zinc-500">{e.phone}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="max-w-[220px] truncate text-sm text-zinc-800">{e.vehicleName}</p>
                    <p className="text-xs text-zinc-400">{e.vehicleCategory ?? "—"}</p>
                  </TableCell>
                  <TableCell className="hidden text-xs text-zinc-500 lg:table-cell">{formatDate(e.createdAt, true)}</TableCell>
                  <TableCell><Badge className={cn("border-0 text-[10px]", STATUS_BADGE[e.status])}>{e.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                      {e.whatsappUrl && (
                        <a href={e.whatsappUrl} target="_blank" rel="noopener noreferrer" title="Open WhatsApp conversation"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-[#25D366]/10 hover:text-[#1fb857]">
                          <WhatsAppIcon className="h-4 w-4" />
                        </a>
                      )}
                      <a href={`tel:${e.phone}`} title="Call customer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100">
                        <Phone className="h-4 w-4" />
                      </a>
                      <a href={`mailto:${e.email}`} title="Email customer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100">
                        <Mail className="h-4 w-4" />
                      </a>
                      <button onClick={() => setDeleteTarget(e)} title="Delete enquiry" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <MessageCircleQuestion className="mx-auto h-10 w-10 text-zinc-300" />
                    <p className="mt-3 font-display text-lg font-semibold text-zinc-800">No customer enquiries yet</p>
                    <p className="mt-1 text-sm text-zinc-500">Enquiries submitted from vehicle pages will appear here instantly.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
            <p className="text-xs text-zinc-500">Page {data.page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto styled-scrollbar">
          {detail && (
            <>
              <DialogHeader>
                <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Enquiry · {formatDate(detail.createdAt, true)}
                </DialogDescription>
                <DialogTitle className="font-display text-xl">{detail.customerName}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={detail.email} href={`mailto:${detail.email}`} />
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={detail.phone} href={`tel:${detail.phone}`} />
                </div>

                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Vehicle of Interest</p>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{detail.vehicleName}</p>
                      <p className="text-xs text-zinc-500">{detail.vehicleCategory ?? "—"}</p>
                    </div>
                    {detail.vehicle?.slug && (
                      <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full text-xs">
                        <Link href={`/vehicles/${detail.vehicle.slug}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Customer Message</p>
                  <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-zinc-200 p-4 text-sm leading-relaxed text-zinc-700">
                    {detail.message}
                  </p>
                </div>

                {detail.attachments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Attachments ({detail.attachments.length})
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {detail.attachments.map((a) => (
                        <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="group flex items-center gap-2 rounded-xl border border-zinc-200 p-2.5 text-xs transition-colors hover:border-amber-300 hover:bg-amber-50">
                          {a.fileType?.startsWith("image/") ? (
                             
                            <img src={a.fileUrl} alt={a.fileName} className="h-9 w-9 rounded-lg object-cover" />
                          ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100"><Paperclip className="h-4 w-4 text-zinc-500" /></span>
                          )}
                          <span className="truncate font-medium text-zinc-700">{a.fileName}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: detail.id, newStatus: s })}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                          detail.status === s
                            ? "bg-zinc-950 text-white"
                            : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                        )}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                  {detail.whatsappUrl && (
                    <Button asChild className="flex-1 rounded-full bg-[#25D366] font-semibold text-white hover:bg-[#1fb857]">
                      <a href={detail.whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon className="h-4 w-4" /> Open WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 rounded-full text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(detail)}>
                    <Trash2 className="h-4 w-4" /> Delete Enquiry
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              The enquiry from <span className="font-semibold">{deleteTarget?.customerName}</span> about{" "}
              <span className="font-semibold">{deleteTarget?.vehicleName}</span> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={remove.isPending}
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

function FilterChip({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
        active ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white/20" : "bg-zinc-100")}>{count}</span>
      )}
    </button>
  );
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-wide text-zinc-400">{label}</span>
        <span className="block truncate text-sm font-medium text-zinc-900">{value}</span>
      </span>
    </div>
  );
  return href ? <a href={href} className="block transition-transform hover:scale-[1.01]">{content}</a> : content;
}
