"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/floating-whatsapp";

interface SuccessData {
  vehicleTitle: string;
  vehicleCategory: string;
  vehicleSlug: string;
  customerName: string;
  whatsappUrl: string;
  attachmentCount: number;
}

export default function EnquirySuccessClient() {
  const searchParams = useSearchParams();
  const vehicleSlug = searchParams.get("v");
  const [data, setData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Deferred so we do not setState synchronously inside the effect body
    const t = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem("cspek_enquiry_success");
        if (raw) setData(JSON.parse(raw));
      } catch { /* fallthrough */ }
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden="true" />
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">Thank You!</h1>

          {data ? (
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-zinc-500">
              {data.customerName}, your enquiry has been received successfully. Our sales team will
              contact you shortly with availability, pricing and next steps.
            </p>
          ) : (
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-zinc-500">
              Your enquiry has been received successfully. Our sales team will contact you shortly.
            </p>
          )}

          {/* Vehicle summary */}
          {data && (
            <div className="mt-8 rounded-2xl bg-zinc-50 p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Enquiry Summary</p>
              <p className="mt-2 font-display text-lg font-semibold text-zinc-900">{data.vehicleTitle}</p>
              <p className="mt-0.5 text-sm text-zinc-500">Category: {data.vehicleCategory}</p>
              {data.attachmentCount > 0 && (
                <p className="mt-1 text-sm text-zinc-500">
                  Attachments uploaded: {data.attachmentCount} file{data.attachmentCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          )}

          {/* Next steps */}
          <div className="mt-8 space-y-2.5">
            {data?.whatsappUrl && (
              <Button asChild className="h-13 w-full rounded-full bg-[#25D366] py-3.5 text-base font-semibold text-white hover:bg-[#1fb857]">
                <a href={data.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-5 w-5" /> Continue on WhatsApp — recommended
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="h-13 w-full rounded-full py-3.5 text-base font-semibold">
              {vehicleSlug ? (
                <Link href={`/vehicles/${vehicleSlug}`}>
                  <ArrowLeft className="h-5 w-5" /> Back to Vehicle
                </Link>
              ) : (
                <Link href="/vehicles">
                  <ArrowLeft className="h-5 w-5" /> Back to Vehicles
                </Link>
              )}
            </Button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-zinc-400">
            Tip: tapping the WhatsApp button opens a pre-filled message with your enquiry details, so our
            team can continue the conversation with you instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
