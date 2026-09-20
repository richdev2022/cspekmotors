"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/floating-whatsapp";
import { generateWhatsAppGeneralLink } from "@/lib/whatsapp";

export function Hero({
  settings,
}: {
  settings: { companyName: string; tagline: string; whatsapp: string | null; heroImage: string | null };
}) {
  const whatsappUrl = generateWhatsAppGeneralLink(settings.whatsapp);
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[92svh] items-center overflow-hidden bg-zinc-950"
      aria-label="Welcome"
    >
      {/* Background image with slow zoom + parallax */}
      <motion.div
        className="absolute inset-0"
        aria-hidden="true"
        style={reduceMotion ? undefined : { y: bgY, opacity: bgOpacity }}
      >
        {settings.heroImage && (
          <img
            src={settings.heroImage}
            alt=""
            className="hero-zoom h-full w-full object-cover opacity-45"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/55 to-zinc-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/40 to-transparent" />
      </motion.div>

      <motion.div
        className="relative mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8"
        style={reduceMotion ? undefined : { y: contentY }}
        variants={reduceMotion ? undefined : containerVariants}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
      >
        <div className="max-w-2xl">
          <motion.p
            variants={reduceMotion ? undefined : itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400"
          >
            {settings.companyName}
          </motion.p>

          <motion.h1
            variants={reduceMotion ? undefined : itemVariants}
            className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.08] text-white sm:text-6xl lg:text-7xl text-balance"
          >
            {settings.tagline}
          </motion.h1>

          <motion.p
            variants={reduceMotion ? undefined : itemVariants}
            className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg"
          >
            From premium SUVs and family cars to heavy-duty trucks, trailers and buses —
            we stock, inspect and deliver the vehicles that keep Nigeria moving.
          </motion.p>

          <motion.div
            variants={reduceMotion ? undefined : itemVariants}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-13 rounded-full bg-amber-500 px-8 text-base font-semibold text-zinc-950 transition-transform hover:scale-105 hover:bg-amber-600">
              <Link href="/vehicles">
                Explore Vehicles <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-white/25 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/15 hover:text-white">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={reduceMotion ? undefined : itemVariants}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-400"
          >
            <span className="inline-flex items-center gap-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors">
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Instant WhatsApp enquiries
              </a>
            </span>
            <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden="true" />
            <span>Nationwide delivery available</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      {!reduceMotion && (
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
