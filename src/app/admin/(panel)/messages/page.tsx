"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Mail, Phone, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MessageRow {
  id: string; name: string; email: string; phone: string | null; subject: string | null;
  message: string; status: string; createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  READ: "bg-zinc-200 text-zinc-600",
  ARCHIVED: "bg-amber-100 text-amber-700",
};

export default function AdminMessagesPage() {
  const qc = useQueryClient();
  const [detail, setDetail] = useState<MessageRow | null>(null);

  const { data, isLoading, isError, error } = useQuery<{ items: MessageRow[]; total: number }>({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const res = await api.get<{ items: MessageRow[]; total: number }>("/api/admin/contact-messages?limit=50");
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load messages");
      return res.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/api/admin/contact-messages/${id}`, { status });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      setDetail(null);
      toast.success("Message updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/admin/contact-messages/${id}`);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      setDetail(null);
      toast.success("Message deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-950">Contact Messages</h1>
        <p className="mt-0.5 text-sm text-zinc-500">General messages from the website contact form.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      )}

      {isError && (
        <Card><CardContent className="p-6 text-sm text-red-600">{error instanceof Error ? error.message : "Failed to load messages."}</CardContent></Card>
      )}

      {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center">
          <Inbox className="mx-auto h-10 w-10 text-zinc-300" />
          <p className="mt-3 font-display text-lg font-semibold text-zinc-800">No messages yet</p>
          <p className="mt-1 text-sm text-zinc-500">Contact form submissions will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.items.map((m) => (
          <Card key={m.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setDetail(m)}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-950">{m.name}</p>
                  <Badge className={cn("border-0 text-[10px]", STATUS_BADGE[m.status])}>{m.status}</Badge>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-zinc-700">{m.subject || "(no subject)"}</p>
                <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{m.message}</p>
              </div>
              <span className="shrink-0 text-xs text-zinc-400">{formatDate(m.createdAt)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{detail.name}</DialogTitle>
                <DialogDescription>{formatDate(detail.createdAt, true)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <a href={`mailto:${detail.email}`} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-amber-300">
                    <Mail className="h-3.5 w-3.5" /> {detail.email}
                  </a>
                  {detail.phone && (
                    <a href={`tel:${detail.phone}`} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-amber-300">
                      <Phone className="h-3.5 w-3.5" /> {detail.phone}
                    </a>
                  )}
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-800">{detail.subject || "(no subject)"}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{detail.message}</p>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
                  {detail.status === "NEW" && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => updateStatus.mutate({ id: detail.id, status: "READ" })}>
                      Mark as Read
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => updateStatus.mutate({ id: detail.id, status: "ARCHIVED" })}>
                    Archive
                  </Button>
                  <Button size="sm" variant="outline" className="ml-auto rounded-full text-red-600 hover:bg-red-50" onClick={() => remove.mutate(detail.id)} disabled={remove.isPending}>
                    {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
