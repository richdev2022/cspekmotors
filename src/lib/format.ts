export function formatPrice(price?: number | null, currency: string = "NGN"): string {
  if (price === null || price === undefined) return "Contact for Price";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}

export function formatPriceCompact(price?: number | null, currency: string = "NGN"): string {
  if (price === null || price === undefined) return "Contact for Price";
  if (currency === "NGN" && price >= 1_000_000) {
    return `₦${(price / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  }
  return formatPrice(price, currency);
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Lagos",
  }).format(d);
}

export function formatMileage(mileage?: number | null): string {
  if (mileage === null || mileage === undefined) return "—";
  return `${mileage.toLocaleString()} km`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function excerpt(text?: string | null, length = 140): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}
