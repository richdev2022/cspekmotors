"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Could not send your message. Please try again.");
        setSubmitting(false);
        return;
      }
      setSent(true);
      toast.success("Message sent! We will get back to you shortly.");
      form.reset();
    } catch {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h3 className="mt-4 font-display text-xl font-semibold text-emerald-900">Message Sent!</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-emerald-700">
          Thank you for reaching out. Our team has received your message and will respond within one
          business day. For urgent enquiries, WhatsApp is fastest.
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSent(false)}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Contact form">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Full Name *</Label>
          <Input id="contact-name" name="name" required placeholder="Your full name" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">Phone Number</Label>
          <Input id="contact-phone" name="phone" type="tel" placeholder="e.g. +234 803 000 0000" autoComplete="tel" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-email">Email Address *</Label>
        <Input id="contact-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input id="contact-subject" name="subject" placeholder="e.g. Vehicle enquiry, trade-in, fleet purchase…" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message *</Label>
        <Textarea id="contact-message" name="message" required rows={5} placeholder="How can we help you?" />
      </div>
      <Button type="submit" disabled={submitting} className="h-12 w-full rounded-full bg-zinc-950 font-semibold text-base hover:bg-zinc-800">
        {submitting ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</>
        ) : (
          <><Send className="h-5 w-5" /> Send Message</>
        )}
      </Button>
    </form>
  );
}
