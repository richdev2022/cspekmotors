import type { Metadata } from "next";
import { Suspense } from "react";
import EnquirySuccessClient from "@/components/site/enquiry-success-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Enquiry Received — Thank You",
  description: "Your vehicle enquiry has been received by C-SPEK MOTORS LTD. Our team will contact you shortly.",
  robots: { index: false, follow: false },
};

export default function EnquirySuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-20">
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          <Skeleton className="mx-auto mt-6 h-10 w-64" />
          <Skeleton className="mx-auto mt-4 h-6 w-full max-w-md" />
          <Skeleton className="mt-8 h-32 rounded-2xl" />
        </div>
      }
    >
      <EnquirySuccessClient />
    </Suspense>
  );
}
