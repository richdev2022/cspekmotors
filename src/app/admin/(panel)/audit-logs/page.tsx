"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AuditRow {
  id: string; adminName: string; action: string; resource: string;
  resourceId: string | null; details: string | null; createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  UPLOAD: "bg-violet-100 text-violet-700",
  LOGIN: "bg-amber-100 text-amber-700",
};

const RESOURCES = ["ALL", "VEHICLE", "CATEGORY", "MEDIA", "ENQUIRY", "CONTACT_MESSAGE", "SETTINGS", "ADMIN_USER", "AUTH"];

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState("ALL");

  const { data, isLoading, isError } = useQuery<{ items: AuditRow[]; total: number; page: number; totalPages: number }>({
    queryKey: ["audit-logs", page, resource],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (resource && resource !== "ALL") params.set("resource", resource);
      const res = await api.get<{ items: AuditRow[]; total: number; page: number; totalPages: number }>(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load audit logs");
      return res.data;
    },
    meta: { onError: () => toast.error("Failed to load audit logs.") },
  } as never);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950">Audit Logs</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Every important admin action, recorded for accountability.</p>
        </div>
        <Select value={resource} onValueChange={(v) => { setResource(v); setPage(1); }}>
          <SelectTrigger className="w-48 rounded-full"><SelectValue placeholder="All resources" /></SelectTrigger>
          <SelectContent>
            {RESOURCES.map((r) => (
              <SelectItem key={r} value={r}>{r === "ALL" ? "All Resources" : r.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="space-y-2 p-5">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : isError ? (
          <p className="p-10 text-center text-sm text-red-600">Failed to load audit logs.</p>
        ) : (data?.items.length ?? 0) === 0 ? (
          <div className="p-16 text-center">
            <ScrollText className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-3 font-display text-lg font-semibold text-zinc-800">No audit entries yet</p>
            <p className="mt-1 text-sm text-zinc-500">Admin actions will be recorded here automatically.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {data!.items.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3.5 text-sm">
                <Badge className={cn("border-0 text-[10px]", ACTION_COLORS[log.action] ?? "bg-zinc-100 text-zinc-600")}>{log.action}</Badge>
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{log.resource.replace(/_/g, " ")}</span>
                <span className="min-w-0 flex-1 truncate text-zinc-700">{log.details ?? log.resourceId}</span>
                <span className="text-xs font-medium text-zinc-500">{log.adminName}</span>
                <span className="text-xs text-zinc-400">{formatDate(log.createdAt, true)}</span>
              </li>
            ))}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
            <p className="text-xs text-zinc-500">Page {data.page} of {data.totalPages} · {data.total} entries</p>
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
    </div>
  );
}
