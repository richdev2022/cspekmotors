"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText, Loader2, Paperclip, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface EnquiryVehicleInfo {
  vehicleId: string;
  vehicleTitle: string;
  vehicleCategory: string;
  vehicleSlug: string;
}

const MAX_ATTACHMENTS = 4;
const MAX_FILE_MB = 10;

export function VehicleEnquiryButton({
  vehicle, className, label = "Enquire Now",
}: {
  vehicle: EnquiryVehicleInfo;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold", className)}>
          {label}
        </Button>
      </DialogTrigger>
      <EnquiryDialogContent vehicle={vehicle} onSuccess={() => setOpen(false)} />
    </Dialog>
  );
}

export function EnquiryDialogContent({ vehicle, onSuccess }: { vehicle: EnquiryVehicleInfo; onSuccess: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(`"${tooBig.name}" is larger than ${MAX_FILE_MB}MB.`);
      return;
    }
    setFiles((prev) => {
      const merged = [...prev, ...incoming].slice(0, MAX_ATTACHMENTS);
      if (prev.length + incoming.length > MAX_ATTACHMENTS) {
        toast.info(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      }
      return merged;
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("vehicleId", vehicle.vehicleId);
    files.forEach((f) => fd.append("attachments", f));

    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Could not submit your enquiry. Please try again.");
        setSubmitting(false);
        return;
      }

      // Pass result to the success page without exposing data in the URL
      sessionStorage.setItem(
        "cspek_enquiry_success",
        JSON.stringify({
          vehicleTitle: vehicle.vehicleTitle,
          vehicleCategory: vehicle.vehicleCategory,
          vehicleSlug: vehicle.vehicleSlug,
          customerName: json.data.enquiry.customerName,
          whatsappUrl: json.data.whatsappUrl,
          attachmentCount: json.data.enquiry.attachments?.length ?? files.length,
        })
      );
      toast.success("Enquiry received successfully!");
      onSuccess();
      router.push(`/enquiry/success?v=${encodeURIComponent(vehicle.vehicleSlug)}`);
    } catch {
      toast.error("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto styled-scrollbar">
      <DialogHeader>
        <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          {vehicle.vehicleCategory}
        </DialogDescription>
        <DialogTitle className="font-display text-xl">Enquire about this vehicle</DialogTitle>
        <p className="text-sm text-zinc-500">
          You are enquiring about the <span className="font-semibold text-zinc-800">{vehicle.vehicleTitle}</span>.
          Fill in your details and our sales team will contact you shortly.
        </p>
      </DialogHeader>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="vehicleId" value={vehicle.vehicleId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="customerName">Full Name *</Label>
            <Input id="customerName" name="customerName" required placeholder="e.g. John Adeyemi" autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" name="phone" required type="tel" placeholder="e.g. +234 803 000 0000" autoComplete="tel" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" name="email" required type="email" placeholder="you@example.com" autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            name="message"
            required
            rows={4}
            placeholder="I am interested in this vehicle. Please share availability, best price and inspection options…"
          />
        </div>

        {/* Attachments */}
        <div className="space-y-1.5">
          <Label htmlFor="attachments">
            Attachments <span className="text-zinc-400 font-normal">(optional — images or PDF, max {MAX_FILE_MB}MB each)</span>
          </Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 transition-colors hover:border-amber-400 hover:bg-amber-50"
          >
            <Paperclip className="h-4 w-4" /> Attach files (up to {MAX_ATTACHMENTS})
          </button>
          <input
            ref={fileRef}
            id="attachments"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Remove attachment ${f.name}`}
                    className="text-zinc-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button type="submit" disabled={submitting} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded-full text-base">
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
          ) : (
            <><MessageSquareText className="h-5 w-5" /> Submit Enquiry</>
          )}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Your details are sent only to {`C-SPEK MOTORS LTD`} — never shared with third parties.
        </p>
      </form>
    </DialogContent>
  );
}
