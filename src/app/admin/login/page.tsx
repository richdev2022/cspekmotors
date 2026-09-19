"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function AdminLoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email") as string)?.trim();
    const password = fd.get("password") as string;

    setSubmitting(true);
    const res = await api.post<{ name: string }>("/api/auth/login", { email, password });
    if (!res.ok) {
      toast.error(res.error ?? "Invalid email or password.");
      setSubmitting(false);
      return;
    }
    toast.success(`Welcome back, ${res.data?.name ?? "Admin"}!`);
    // Hard (full-page) navigation: the freshly set session cookie is guaranteed
    // to be sent with the request. A soft client-side push() can be dropped or
    // served from a stale router cache when the app runs behind reverse
    // proxies/tunnels, landing the user back on the login page.
    // Small delay lets the welcome toast paint before the page unloads.
    setTimeout(() => window.location.assign("/admin"), 600);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 30%, #f59e0b 0%, transparent 35%), radial-gradient(circle at 85% 70%, #f59e0b 0%, transparent 35%)",
        }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">
        <div className="text-center">
          { }
          <img src="/brand/logo-dark-bg.png" alt="C-SPEK MOTORS LTD" className="mx-auto h-16 w-auto" />
          <p className="mt-3 text-sm text-zinc-400">Admin Dashboard — Staff Sign In</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="admin@cspekmotors.com"
                className="h-12 border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-12 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-full bg-amber-500 text-base font-semibold text-zinc-950 hover:bg-amber-600"
          >
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Signing in…</>
            ) : (
              "Sign In to Dashboard"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Protected area — authorized staff only. All sign-in attempts are logged.
        </p>
      </div>
    </div>
  );
}
