import { z } from "zod";

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------
export const VEHICLE_STATUSES = ["AVAILABLE", "RESERVED", "SOLD", "HIDDEN"] as const;
export const VEHICLE_CONDITIONS = ["NEW", "USED"] as const;
export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "COMPLETED", "CLOSED"] as const;
export const MESSAGE_STATUSES = ["NEW", "READ", "ARCHIVED"] as const;
export const CURRENCIES = ["NGN", "USD", "EUR", "GBP"] as const;
export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

// ------------------------------------------------------------
// Auth
// ------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const adminUserCreateSchema = z.object({
  name: z.string().min(2, "Name is required.").max(100),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(ADMIN_ROLES).default("ADMIN"),
});

export const adminUserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal("")),
  role: z.enum(ADMIN_ROLES).optional(),
  isActive: z.boolean().optional(),
});

// ------------------------------------------------------------
// Category
// ------------------------------------------------------------
export const categoryCreateSchema = z.object({
  name: z.string().min(2, "Category name is required.").max(80),
  slug: z.string().optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  video: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

// ------------------------------------------------------------
// Vehicle
// ------------------------------------------------------------
export const specificationSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(200),
});

const vehicleBase = {
  title: z.string().min(3, "Vehicle title is required.").max(160),
  brand: z.string().min(1, "Brand is required.").max(80),
  model: z.string().min(1, "Model is required.").max(80),
  year: z.coerce.number().int().min(1950, "Year looks too old.").max(2100, "Year looks invalid."),
  categoryId: z.string().min(1, "Please select a category."),
  price: z.coerce.number().min(0, "Price cannot be negative.").nullable().optional(),
  currency: z.enum(CURRENCIES).default("NGN"),
  condition: z.enum(VEHICLE_CONDITIONS).default("USED"),
  status: z.enum(VEHICLE_STATUSES).default("AVAILABLE"),
  location: z.string().max(160).optional().or(z.literal("")),
  shortDescription: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(10000).optional().or(z.literal("")),
  mileage: z.coerce.number().int().min(0).nullable().optional(),
  transmission: z.string().max(60).optional().or(z.literal("")),
  fuelType: z.string().max(60).optional().or(z.literal("")),
  engine: z.string().max(120).optional().or(z.literal("")),
  colour: z.string().max(60).optional().or(z.literal("")),
  bodyType: z.string().max(60).optional().or(z.literal("")),
  driveType: z.string().max(60).optional().or(z.literal("")),
  seats: z.coerce.number().int().min(0).max(200).nullable().optional(),
  specifications: z.array(specificationSchema).max(40).default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  publishDetails: z.boolean().default(false),
  seoTitle: z.string().max(200).optional().or(z.literal("")),
  seoDescription: z.string().max(320).optional().or(z.literal("")),
  seoKeywords: z.string().max(300).optional().or(z.literal("")),
  slug: z.string().optional(),
};

export const vehicleCreateSchema = z.object(vehicleBase);
export const vehicleUpdateSchema = z.object(vehicleBase).partial();

// ------------------------------------------------------------
// Public enquiry (submitted from the vehicle page)
// ------------------------------------------------------------
export const enquirySchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required."),
  customerName: z.string().min(2, "Please enter your full name.").max(120),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().min(7, "Please enter a valid phone number.").max(20)
    .regex(/^[+\d][\d\s\-()]+$/, "Phone number contains invalid characters."),
  message: z.string().min(5, "Please tell us a little about what you need.").max(3000),
});

// ------------------------------------------------------------
// Contact form
// ------------------------------------------------------------
export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(120),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().max(20).optional().or(z.literal("")),
  subject: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(5, "Please enter your message.").max(3000),
});

// ------------------------------------------------------------
// Admin enquiry / message updates
// ------------------------------------------------------------
export const enquiryUpdateSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES).optional(),
});

export const messageUpdateSchema = z.object({
  status: z.enum(MESSAGE_STATUSES).optional(),
});

// ------------------------------------------------------------
// Media
// ------------------------------------------------------------
export const mediaUpdateSchema = z.object({
  caption: z.string().max(240).nullable().optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  vehicleId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

// ------------------------------------------------------------
// Settings (admin)
// ------------------------------------------------------------
export const settingsUpdateSchema = z.object({
  companyName: z.string().min(2).max(160).optional(),
  logo: z.string().max(500).nullable().optional(),
  logoLight: z.string().max(500).nullable().optional(),
  logoDark: z.string().max(500).nullable().optional(),
  tagline: z.string().max(200).optional(),
  phone: z.string().max(40).nullable().optional(),
  phoneSecondary: z.string().max(40).nullable().optional(),
  whatsapp: z.string().max(40).nullable().optional(),
  email: z.string().email("Enter a valid email address.").max(160).nullable().optional().or(z.literal("")),
  address: z.string().max(400).nullable().optional(),
  businessHours: z.array(z.object({ days: z.string().min(1).max(80), hours: z.string().min(1).max(80) })).max(10).optional(),
  mapUrl: z.string().max(600).nullable().optional(),
  facebook: z.string().max(300).nullable().optional(),
  instagram: z.string().max(300).nullable().optional(),
  tiktok: z.string().max(300).nullable().optional(),
  twitter: z.string().max(300).nullable().optional(),
  youtube: z.string().max(300).nullable().optional(),
  websiteTitle: z.string().max(200).optional(),
  websiteDescription: z.string().max(500).optional(),
  seoDefaultTitle: z.string().max(200).nullable().optional(),
  seoDefaultDescription: z.string().max(500).nullable().optional(),
  socialSharingImage: z.string().max(600).nullable().optional(),
  heroImage: z.string().max(600).nullable().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
