import type { AdminUser, Category, Media, Vehicle, Enquiry, EnquiryAttachment, ContactMessage, SiteSettings, AuditLog } from "@prisma/client";

export type VehicleWithRelations = Vehicle & {
  category: Category;
  media: Media[];
};

export type EnquiryWithRelations = Enquiry & {
  vehicle: { id: string; title: string; slug: string; price: number | null; currency: string } | null;
  attachments: EnquiryAttachment[];
};

export type CategoryWithCount = Category & {
  _count: { vehicles: number; media: number };
};

export type SafeAdmin = Omit<AdminUser, "passwordHash">;

export function toSafeAdmin(admin: AdminUser): SafeAdmin {
  const { passwordHash: _ph, ...safe } = admin;
  return safe;
}

export interface PublicSettings {
  companyName: string;
  tagline: string;
  logo: string | null;
  logoLight: string | null;
  logoDark: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  businessHours: string | null;
  mapUrl: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  youtube: string | null;
  websiteTitle: string;
  websiteDescription: string;
  socialSharingImage: string | null;
}

export function toPublicSettings(s: SiteSettings): PublicSettings {
  return {
    companyName: s.companyName,
    tagline: s.tagline,
    logo: s.logo,
    logoLight: s.logoLight,
    logoDark: s.logoDark,
    phone: s.phone,
    phoneSecondary: s.phoneSecondary,
    whatsapp: s.whatsapp,
    email: s.email,
    address: s.address,
    businessHours: s.businessHours,
    mapUrl: s.mapUrl,
    facebook: s.facebook,
    instagram: s.instagram,
    tiktok: s.tiktok,
    twitter: s.twitter,
    youtube: s.youtube,
    websiteTitle: s.websiteTitle,
    websiteDescription: s.websiteDescription,
    socialSharingImage: s.socialSharingImage,
  };
}

export interface VehicleListParams {
  category?: string;
  search?: string;
  featured?: boolean;
  status?: string;
  condition?: string;
  sort?: string;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Specification {
  label: string;
  value: string;
}

export function parseSpecifications(json?: string | null): Specification[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter((s) => s && typeof s.label === "string" && typeof s.value === "string");
    }
  } catch { /* ignore */ }
  return [];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: { path: string; message: string }[];
}
