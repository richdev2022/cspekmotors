"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SafeAdmin } from "@/types";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  const [deleteTarget, setDeleteTarget] = useState<SafeAdmin | null>(null);

  const { data: users, isLoading, isError, error } = useQuery<SafeAdmin[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await api.get<SafeAdmin[]>("/api/admin/users");
      if (!res.ok || !res.data) throw new Error(res.error ?? "Failed to load users");
      return res.data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/users", form);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Admin account created.");
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", role: "ADMIN" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Admin account deleted.");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950">Admin Users</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Only Super Admins can manage staff accounts.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-full bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
          <Plus className="h-4 w-4" /> Add Admin
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ))}
            {isError && <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-red-600">{error instanceof Error ? error.message : "Failed to load users."}</TableCell></TableRow>}
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold text-zinc-900">{u.name}</TableCell>
                <TableCell className="text-zinc-600">{u.email}</TableCell>
                <TableCell>
                  <Badge className={cn("border-0 text-[10px]", u.role === "SUPER_ADMIN" ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600")}>
                    {u.role === "SUPER_ADMIN" ? <ShieldCheck className="mr-1 h-3 w-3" /> : <Shield className="mr-1 h-3 w-3" />}
                    {u.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-xs text-zinc-500 md:table-cell">{formatDate(u.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => setDeleteTarget(u)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete account"
                    aria-label={`Delete ${u.email}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Admin</DialogTitle>
            <DialogDescription>Admins manage vehicles, categories, media and enquiries. Super Admins can also manage settings and staff.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Jane Okafor" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@cspekmotors.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Minimum 8 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || form.name.length < 2 || !form.email || form.password.length < 8} className="bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-600">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete admin account "{deleteTarget?.email}"?</AlertDialogTitle>
            <AlertDialogDescription>This staff member will no longer be able to sign in.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={remove.isPending}
              onClick={(e) => { e.preventDefault(); if (deleteTarget) remove.mutate(deleteTarget.id); }}>
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
