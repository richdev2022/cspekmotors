/**
 * C-SPEK MOTORS LTD — Database seed script
 * Run: bun run scripts/seed.ts
 * Idempotent: safe to run multiple times (upserts by slug/email/id).
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
type Manifest = Record<string, string[]>;

function loadManifest(): Manifest {
  const path = "/home/z/my-project/scripts/seed-images-manifest.json";
  if (existsSync(path)) {
    try { return JSON.parse(readFileSync(path, "utf8")); } catch { /* fallthrough */ }
  }
  return {};
}

const manifest = loadManifest();

function img(key: string, index: number): string | null {
  const arr = manifest[key];
  if (!arr || arr.length < index) return null;
  return arr[index - 1] ?? null;
}

function images(key: string, count: number): string[] {
  const arr = manifest[key] ?? [];
  return arr.slice(0, count);
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

// ------------------------------------------------------------
// Seed data
// ------------------------------------------------------------
const CATEGORIES = [
  { name: "Cars", slug: "cars", description: "Sedans, hatchbacks and saloon cars for personal and family use — from economical daily drivers to executive rides.", imageKey: "cat-cars", sortOrder: 1 },
  { name: "SUVs", slug: "suvs", description: "Sport utility vehicles built for comfort, presence and Nigerian roads — family SUVs, luxury 4x4s and off-roaders.", imageKey: "cat-suvs", sortOrder: 2 },
  { name: "Trucks", slug: "trucks", description: "Heavy-duty trucks for haulage, construction and logistics — tippers, tractors, flatbeds and crane trucks.", imageKey: "cat-trucks", sortOrder: 3 },
  { name: "Trailers", slug: "trailers", description: "Semi-trailers, tankers and flatbed trailers for long-haul freight and heavy equipment movement.", imageKey: "cat-trailers", sortOrder: 4 },
  { name: "Buses", slug: "buses", description: "Commercial buses and coaches for mass transit, school runs, staff shuttles and interstate travel.", imageKey: "cat-buses", sortOrder: 5 },
  { name: "Vans", slug: "vans", description: "Panel vans, mini buses and delivery vans for business, logistics and family transport.", imageKey: "cat-vans", sortOrder: 6 },
  { name: "Commercial Vehicles", slug: "commercial-vehicles", description: "Pickups, light trucks and work vehicles that keep Nigerian businesses moving.", imageKey: "cat-commercial", sortOrder: 7 },
  { name: "Other Vehicles", slug: "other-vehicles", description: "Specialist and custom vehicles — armored cars, cash-in-transit trucks, ambulances, tippers and more.", imageKey: "cat-other", sortOrder: 8 },
];

interface SeedVehicle {
  title: string; brand: string; model: string; year: number; categorySlug: string;
  price: number | null; currency?: string; condition: "NEW" | "USED"; status: "AVAILABLE" | "RESERVED" | "SOLD" | "HIDDEN";
  location: string; shortDescription: string; description: string;
  mileage?: number | null; transmission?: string; fuelType?: string; engine?: string; colour?: string;
  bodyType?: string; driveType?: string; seats?: number | null;
  specifications: [string, string][];
  isFeatured?: boolean; imageKeys: { key: string; index: number }[]; caption?: string;
}

const VEHICLES: SeedVehicle[] = [
  {
    title: "Toyota Land Cruiser 300 VXR 2023", brand: "Toyota", model: "Land Cruiser 300", year: 2023,
    categorySlug: "suvs", price: 85000000, condition: "NEW", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "Brand new 2023 Land Cruiser 300 VXR — the king of SUVs. Twin-turbo V6, full option, 0km.",
    description: "The all-new Toyota Land Cruiser 300 VXR is the pinnacle of luxury and capability. This brand new 2023 model comes fully loaded with premium leather interior, cooled seats, 360-degree camera, JBL premium audio and the latest safety suite.\n\nUnder the bonnet sits a 3.5L twin-turbo V6 producing 415hp paired to a 10-speed automatic transmission and full-time 4WD. Whether you are navigating city traffic or crossing rough terrain, the Land Cruiser 300 delivers unrivalled confidence and comfort.\n\nStraight import, accident free, complete customs papers. Trade-in accepted. National delivery available.",
    mileage: 0, transmission: "10-Speed Automatic", fuelType: "Petrol", engine: "3.5L V6 Twin-Turbo", colour: "Pearl White", bodyType: "SUV", driveType: "4WD", seats: 7,
    specifications: [["Engine", "3.5L V6 Twin-Turbo (415hp)"], ["Transmission", "10-Speed Automatic"], ["Drive", "Full-time 4WD"], ["Seats", "7 (Captain seats)"], ["Fuel", "Petrol"], ["Infotainment", "12.3-inch touchscreen, JBL audio"], ["Safety", "Toyota Safety Sense 2.5"], ["Warranty", "3 years / 100,000km"]],
    isFeatured: true, imageKeys: [{ key: "cat-suvs", index: 2 }, { key: "cat-suvs", index: 3 }], caption: "Toyota Land Cruiser 300 VXR — front three-quarter view",
  },
  {
    title: "Lexus LX 600 Ultra Luxury 2024", brand: "Lexus", model: "LX 600", year: 2024,
    categorySlug: "suvs", price: 120000000, condition: "NEW", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "2024 Lexus LX 600 Ultra Luxury. 3.5L twin-turbo V6, rear executive seats, mark levinson audio.",
    description: "The 2024 Lexus LX 600 Ultra Luxury is flagship motoring at its finest. With four-zone climate control, executive rear seats with ottoman, a 25-speaker Mark Levinson surround system and hand-crafted interior trim, every journey feels first class.\n\nPowered by a 3.4L twin-turbo V6 with 10-speed automatic and full-time four-wheel drive with multi-terrain select, it is as capable as it is luxurious.\n\nFully loaded, 0km, straight import with complete documentation. Flexible payment plans available for qualified buyers.",
    mileage: 0, transmission: "10-Speed Automatic", fuelType: "Petrol", engine: "3.4L V6 Twin-Turbo", colour: "Obsidian Black", bodyType: "SUV", driveType: "4WD", seats: 5,
    specifications: [["Engine", "3.4L V6 Twin-Turbo (409hp)"], ["Transmission", "10-Speed Automatic"], ["Drive", "Full-time 4WD"], ["Seats", "5 (Executive rear seats)"], ["Audio", "25-speaker Mark Levinson"], ["Displays", "Dual 12.3-inch + rear screens"], ["Safety", "Lexus Safety System+ 2.5"], ["Warranty", "4 years / 100,000km"]],
    isFeatured: true, imageKeys: [{ key: "lexus", index: 1 }, { key: "lexus", index: 2 }], caption: "Lexus LX 600 Ultra Luxury",
  },
  {
    title: "Toyota Land Cruiser Prado TXL 2019", brand: "Toyota", model: "Land Cruiser Prado", year: 2019,
    categorySlug: "suvs", price: 38500000, condition: "USED", status: "RESERVED", location: "Lagos, Nigeria",
    shortDescription: "Foreign used 2019 Prado TXL. One owner, full service history, accident free.",
    description: "This foreign used 2019 Toyota Land Cruiser Prado TXL is the perfect family SUV — rugged, reliable and endlessly comfortable. Features include leather seats, dual-zone climate control, reverse camera, cruise control and the legendary 2.8L turbo diesel engine.\n\nOne owner from new with complete service history. Accident free with clean customs papers. Inspection is welcome at our Lagos showroom.",
    mileage: 78000, transmission: "6-Speed Automatic", fuelType: "Diesel", engine: "2.8L 4-Cylinder Turbo Diesel", colour: "Silver Metallic", bodyType: "SUV", driveType: "4WD", seats: 7,
    specifications: [["Engine", "2.8L Turbo Diesel (201hp)"], ["Transmission", "6-Speed Automatic"], ["Drive", "4WD"], ["Seats", "7"], ["Mileage", "78,000km"], ["History", "One owner, full service records"], ["Condition", "Accident free"]],
    imageKeys: [{ key: "cat-suvs", index: 1 }], caption: "Toyota Land Cruiser Prado TXL",
  },
  {
    title: "Toyota Camry SE 2021", brand: "Toyota", model: "Camry", year: 2021,
    categorySlug: "cars", price: 18750000, condition: "USED", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "Neat foreign used 2021 Camry SE. Sporty trim, paddle shifters, fuel efficient 2.5L engine.",
    description: "The 2021 Toyota Camry SE blends sporty styling with legendary Camry reliability. This neat foreign used example features the 2.5L four-cylinder engine, sport-tuned suspension, paddle shifters and a bold front grille.\n\nInside you get dual-zone climate control, 7-inch infotainment with wireless charging, and Toyota Safety Sense as standard. Accident free, non-smoker, ready to drive away today.",
    mileage: 52000, transmission: "8-Speed Automatic", fuelType: "Petrol", engine: "2.5L 4-Cylinder", colour: "Midnight Black", bodyType: "Sedan", driveType: "FWD", seats: 5,
    specifications: [["Engine", "2.5L 4-Cylinder (203hp)"], ["Transmission", "8-Speed Automatic"], ["Drive", "Front-wheel drive"], ["Seats", "5"], ["Mileage", "52,000km"], ["Fuel Economy", "9.4L/100km city"], ["Condition", "Accident free"]],
    isFeatured: true, imageKeys: [{ key: "camry", index: 1 }, { key: "camry", index: 2 }], caption: "Toyota Camry SE",
  },
  {
    title: "Honda Accord Sport 2020", brand: "Honda", model: "Accord", year: 2020,
    categorySlug: "cars", price: 14500000, condition: "USED", status: "SOLD", location: "Lagos, Nigeria",
    shortDescription: "Foreign used 2020 Accord Sport. Sold — thank you for the trust! Browse our stock for similar deals.",
    description: "This 2020 Honda Accord Sport has found a new home — SOLD! Thank you to everyone who enquired.\n\nLooking for something similar? We receive fresh stock weekly. Explore our current Cars inventory or speak to our sales team on WhatsApp and we will source exactly what you need.",
    mileage: 61000, transmission: "CVT Automatic", fuelType: "Petrol", engine: "1.5L Turbo", colour: "Modern Steel", bodyType: "Sedan", driveType: "FWD", seats: 5,
    specifications: [["Engine", "1.5L Turbo (192hp)"], ["Transmission", "CVT Automatic"], ["Drive", "Front-wheel drive"], ["Seats", "5"], ["Mileage", "61,000km"], ["Status", "Sold"]],
    imageKeys: [{ key: "cat-cars", index: 2 }, { key: "cat-cars", index: 1 }], caption: "Honda Accord Sport — SOLD",
  },
  {
    title: "Mercedes-Benz Actros 2651 6x4 2021", brand: "Mercedes-Benz", model: "Actros 2651", year: 2021,
    categorySlug: "trucks", price: 95000000, condition: "USED", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "Work-ready 2021 Actros 2651 6x4 tractor head. 510hp, Big-Space cab, fleet maintained.",
    description: "The Mercedes-Benz Actros 2651 is Germany's finest heavy-duty tractor head — now available for the Nigerian haulage market. This 2021 6x4 example is powered by the OM 471 15.6L straight-six producing 510hp with Mercedes PowerShift 3 transmission.\n\nBig-Space cab with air conditioning, fridge and comfortable sleeper berth keeps drivers fresh on long hauls. Fleet maintained with complete service records. Perfect for container haulage and flatbed operations.\n\nFlexible payment terms available for fleet buyers. Inspection highly welcome.",
    mileage: 210000, transmission: "12-Speed Mercedes PowerShift 3", fuelType: "Diesel", engine: "15.6L OM 471 (510hp)", colour: "White", bodyType: "Tractor Head", driveType: "6x4", seats: 2,
    specifications: [["Engine", "OM 471 15.6L (510hp)"], ["Transmission", "PowerShift 3 automated"], ["Axle Config", "6x4"], ["Cab", "Big-Space sleeper cab"], ["Fifth Wheel", "JOST brand"], ["Mileage", "210,000km"], ["Maintenance", "Full fleet records"]],
    isFeatured: true, imageKeys: [{ key: "cat-trucks", index: 2 }, { key: "cat-trucks", index: 3 }], caption: "Mercedes-Benz Actros 2651 6x4",
  },
  {
    title: "MAN TGS 33.480 Tipper 2020", brand: "MAN", model: "TGS 33.480", year: 2020,
    categorySlug: "trucks", price: 78000000, condition: "USED", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "2020 MAN TGS 33.480 6x4 with 20-ton tipper body. Construction ready, strong axles.",
    description: "Built for Nigerian construction sites, this MAN TGS 33.480 combines a 480hp D26 engine with a heavy-duty 20-ton hydraulic tipper body. The 6x4 drivetrain, reinforced axles and differential locks make light work of quarry and site roads.\n\nCab features air conditioning, driver comfort suspension and MAN Trucknology infotainment. Recently serviced and site ready. Full duty paid with documents.",
    mileage: 165000, transmission: "12-Speed ZF Automatic", fuelType: "Diesel", engine: "12.4L D26 (480hp)", colour: "Green", bodyType: "Tipper Truck", driveType: "6x4", seats: 2,
    specifications: [["Engine", "D26 12.4L (480hp)"], ["Transmission", "ZF 12-speed automatic"], ["Axle Config", "6x4 with diff locks"], ["Tipper Body", "20-ton hydraulic steel body"], ["Mileage", "165,000km"], ["Condition", "Site ready, recently serviced"]],
    imageKeys: [{ key: "man-truck", index: 1 }, { key: "man-truck", index: 2 }], caption: "MAN TGS 33.480 Tipper",
  },
  {
    title: "40ft Flatbed Semi-Trailer 2022", brand: "CIMC", model: "40ft Flatbed", year: 2022,
    categorySlug: "trailers", price: 22000000, condition: "NEW", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "Brand new CIMC 40ft tri-axle flatbed semi-trailer. 60-ton payload, container locks fitted.",
    description: "This brand new CIMC 40ft flatbed semi-trailer is built for serious haulage. The tri-axle configuration with 13-ton axles handles payloads up to 60 tons, while twist locks secure 20ft and 40ft containers.\n\nHigh-tensile steel deck, JOST landing legs and landing gear, dual-line air brakes with ABS. Compatible with all standard tractor heads. Bulk pricing available for fleets of three or more units.",
    price_currency_note: undefined as never,
    transmission: "N/A", fuelType: "N/A", engine: "N/A", colour: "Black", bodyType: "Semi-Trailer", driveType: "Tri-axle", seats: null,
    specifications: [["Length", "40ft (12.5m)"], ["Axles", "3 x 13-ton FUWA axles"], ["Payload", "Up to 60 tons"], ["Deck", "High-tensile steel"], ["Container Locks", "12 twist locks"], ["Brakes", "Dual-line air with ABS"], ["Landing Gear", "JOST"]],
    imageKeys: [{ key: "cat-trailers", index: 2 }, { key: "cat-trailers", index: 1 }], caption: "40ft Flatbed Semi-Trailer",
  },
  {
    title: "Toyota Hiace Hummer 18-Seater 2021", brand: "Toyota", model: "Hiace", year: 2021,
    categorySlug: "vans", price: 32000000, condition: "USED", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "Neat 2021 Hiace Hummer bus. 18 comfortable seats, powerful 2.7L engine, business ready.",
    description: "The Toyota Hiace Hummer is the workhorse of Nigerian commercial transport. This 2021 example features the sought-after Hummer body with 18 plush seats, high roof and generous luggage space.\n\nPowered by the proven 2.7L petrol engine with rear-wheel drive, it balances power with running costs. AC chills beautifully, interior is clean, and papers are complete. Perfect for interstate transport, staff shuttle or church bus.",
    mileage: 89000, transmission: "5-Speed Manual", fuelType: "Petrol", engine: "2.7L 4-Cylinder", colour: "White", bodyType: "Mini Bus", driveType: "RWD", seats: 18,
    specifications: [["Engine", "2.7L 4-Cylinder"], ["Transmission", "5-speed manual"], ["Seats", "18 passengers"], ["Body", "Hummer high-roof"], ["AC", "Front + rear units"], ["Mileage", "89,000km"]],
    isFeatured: true, imageKeys: [{ key: "cat-vans", index: 2 }, { key: "cat-vans", index: 1 }], caption: "Toyota Hiace Hummer Bus",
  },
  {
    title: "Mercedes-Benz Sprinter 516 CDI 2022", brand: "Mercedes-Benz", model: "Sprinter 516", year: 2022,
    categorySlug: "buses", price: 65000000, condition: "NEW", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "2022 Sprinter 516 CDI executive bus. 21 reclining seats, USB ports, premium climate control.",
    description: "The Mercedes-Benz Sprinter 516 CDI sets the standard for executive staff transport. This 2022 build features 21 reclining business-class seats with armrests, individual USB charging, reading lights and powerful dual-zone climate control.\n\nThe 2.1L CDI turbodiesel delivers effortless highway cruising with excellent fuel economy, while MBUX infotainment and active safety systems protect your investment.\n\nIdeal for corporate shuttles, hotels and travel companies. Finance options available.",
    mileage: 0, transmission: "9-Speed Automatic", fuelType: "Diesel", engine: "2.1L CDI Turbo Diesel", colour: "Silver", bodyType: "Executive Bus", driveType: "RWD", seats: 21,
    specifications: [["Engine", "2.1L CDI (163hp)"], ["Transmission", "9G-Tronic automatic"], ["Seats", "21 reclining executive seats"], ["Features", "USB ports, reading lights, curtains"], ["Safety", "Active brake assist, lane keep"], ["Warranty", "Balance of factory warranty"]],
    imageKeys: [{ key: "sprinter", index: 1 }, { key: "sprinter", index: 2 }], caption: "Mercedes-Benz Sprinter 516 CDI Executive Bus",
  },
  {
    title: "Toyota Coaster 30-Seater 2020", brand: "Toyota", model: "Coaster", year: 2020,
    categorySlug: "buses", price: 45000000, condition: "USED", status: "SOLD", location: "Lagos, Nigeria",
    shortDescription: "Sold! 2020 Toyota Coaster 30-seater. Thank you to our customer — more units arriving soon.",
    description: "SOLD — this 2020 Toyota Coaster has been delivered to a happy school owner. Congratulations!\n\nMore Coaster units are arriving regularly. If you need a 30-seater for school runs, staff transport or commercial use, message us on WhatsApp and we will reserve the next available unit for you.",
    mileage: 103000, transmission: "5-Speed Manual", fuelType: "Diesel", engine: "4.2L 1HZ Diesel", colour: "White", bodyType: "Bus", driveType: "RWD", seats: 30,
    specifications: [["Engine", "4.2L 1HZ diesel"], ["Seats", "30 passengers"], ["Mileage", "103,000km"], ["Status", "Sold — more stock arriving"]],
    imageKeys: [{ key: "coaster", index: 1 }, { key: "cat-buses", index: 2 }], caption: "Toyota Coaster Bus — SOLD",
  },
  {
    title: "Toyota Hilux Workmate 2022", brand: "Toyota", model: "Hilux", year: 2022,
    categorySlug: "commercial-vehicles", price: 28500000, condition: "NEW", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "Brand new 2022 Hilux Workmate 4x4. Double cab, 2.4L turbodiesel, NGO and fleet pricing.",
    description: "The Toyota Hilux needs no introduction — it is the most trusted work vehicle in Africa. This brand new 2022 Workmate double cab pairs the fuel-efficient 2.4L turbodiesel with genuine 4x4 capability.\n\nVinyl flooring and durable cloth seats make it easy to clean after site visits, while dual front airbags, ABS and vehicle stability control keep occupants safe. Ideal for NGOs, construction firms and utility companies.\n\nFleet discounts available on orders of three or more units.",
    mileage: 0, transmission: "6-Speed Manual", fuelType: "Diesel", engine: "2.4L Turbo Diesel", colour: "Super White", bodyType: "Double Cab Pickup", driveType: "4WD", seats: 5,
    specifications: [["Engine", "2.4L turbodiesel (150hp)"], ["Transmission", "6-speed manual"], ["Drive", "Shift-on-fly 4WD"], ["Payload", "1,020kg"], ["Safety", "Airbags, ABS, VSC"], ["Warranty", "3 years / 100,000km"]],
    isFeatured: true, imageKeys: [{ key: "cat-commercial", index: 2 }, { key: "cat-commercial", index: 1 }], caption: "Toyota Hilux Workmate 4x4",
  },
  {
    title: "Ford Ranger XLT 2021", brand: "Ford", model: "Ranger", year: 2021,
    categorySlug: "commercial-vehicles", price: 24000000, condition: "USED", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "Foreign used 2021 Ranger XLT. 3.2L turbo diesel, SYNC3 infotainment, tow pack.",
    description: "The Ford Ranger XLT delivers American muscle with practical capability. This 2021 foreign used example runs the willing 3.2L five-cylinder turbodiesel through a 6-speed automatic gearbox.\n\nSYNC 3 infotainment with Apple CarPlay and Android Auto, rear park assist, tow bar and bed liner are all fitted. Accident free with clean papers — book a test drive today.",
    mileage: 67000, transmission: "6-Speed Automatic", fuelType: "Diesel", engine: "3.2L 5-Cylinder Turbo Diesel", colour: "Blue", bodyType: "Double Cab Pickup", driveType: "4WD", seats: 5,
    specifications: [["Engine", "3.2L 5-cyl turbodiesel (197hp)"], ["Transmission", "6-speed automatic"], ["Drive", "4WD"], ["Infotainment", "SYNC 3 with CarPlay"], ["Towing", "3,500kg braked"], ["Mileage", "67,000km"]],
    imageKeys: [{ key: "cat-commercial", index: 3 }], caption: "Ford Ranger XLT",
  },
  {
    title: "Armored Cash-in-Transit Vehicle 2019", brand: "Mercedes-Benz", model: "Sprinter CIT", year: 2019,
    categorySlug: "other-vehicles", price: 150000000, condition: "USED", status: "AVAILABLE", location: "Lagos, Nigeria",
    shortDescription: "B6 armored CIT vehicle on Sprinter chassis. Ballistic steel, gun ports, secure compartments.",
    description: "This professionally armored cash-in-transit vehicle is built on the Mercedes-Benz Sprinter chassis to B6 ballistic protection level. Features include ballistic steel plating, bullet-resistant glass, secure value compartments with dual-key access, gun ports and GPS tracking.\n\nThe 3.0L V6 diesel handles the additional armor weight with ease. Suitable for cash processing companies, banks and security agencies. Full documentation and conversion certificates available for inspection.\n\nSerious enquiries only, please. Site inspection at our Lagos facility can be arranged under NDA.",
    mileage: 95000, transmission: "7-Speed Automatic", fuelType: "Diesel", engine: "3.0L V6 Turbo Diesel", colour: "White", bodyType: "Armored Van", driveType: "RWD", seats: 6,
    specifications: [["Protection Level", "B6 ballistic"], ["Plating", "Ballistic steel + aramid"], ["Glass", "Bullet-resistant multi-layer"], ["Compartments", "Secure value boxes, dual-key"], ["Tracking", "GPS with geofencing"], ["Chassis", "Mercedes Sprinter 519"]],
    imageKeys: [{ key: "cat-other", index: 2 }, { key: "cat-other", index: 1 }], caption: "Armored Cash-in-Transit Vehicle",
  },
];

// ------------------------------------------------------------
// Seed execution
// ------------------------------------------------------------
async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@cspekmotors.com").toLowerCase();
  const name = process.env.SEED_ADMIN_NAME || "System Administrator";
  const password = process.env.SEED_ADMIN_PASSWORD || "Cspek@2026";

  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Admin exists: ${email}`);
    return existing;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await db.adminUser.create({
    data: { name, email, passwordHash, role: "SUPER_ADMIN" },
  });
  console.log(`✓ Super admin created: ${email} (password from SEED_ADMIN_PASSWORD)`);
  return admin;
}

async function seedSettings() {
  const settings = await db.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      companyName: "C-SPEK MOTORS LTD",
      tagline: "Quality Vehicles. Trusted Deals.",
      phone: "08039552546",
      phoneSecondary: "09074884438",
      whatsapp: process.env.COMPANY_WHATSAPP_NUMBER || "2348039552546",
      email: "info@cspekmotors.com",
      address: "18, Oguntana Crescent, Gbagada - Lagos",
      logoLight: "/brand/logo-light-bg.png",
      logoDark: "/brand/logo-dark-bg.png",
      businessHours: JSON.stringify([
        { days: "Monday – Friday", hours: "8:00 AM – 6:00 PM" },
        { days: "Saturday", hours: "9:00 AM – 4:00 PM" },
        { days: "Sunday", hours: "Closed" },
      ]),
      mapUrl: "https://maps.google.com/?q=18+Oguntana+Crescent+Gbagada+Lagos+Nigeria",
      facebook: "https://facebook.com/cspekmotors",
      instagram: "https://instagram.com/cspekmotors",
      tiktok: null,
      twitter: "https://x.com/cspekmotors",
      youtube: null,
      websiteTitle: "C-SPEK MOTORS LTD — Quality Vehicles. Trusted Deals.",
      websiteDescription:
        "C-SPEK MOTORS LTD is a trusted Nigerian automobile dealership offering quality cars, SUVs, trucks, trailers, buses and vans. Browse verified inventory and enquire directly on WhatsApp.",
      socialSharingImage: "/og-image.png",
    },
  });
  console.log("✓ Site settings seeded");
  return settings;
}

async function seedCategories() {
  for (const c of CATEGORIES) {
    const image = img(c.imageKey, 1);
    await db.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
        ...(image ? { image } : {}),
      },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        image,
        isActive: true,
        sortOrder: c.sortOrder,
      },
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories seeded`);
}

async function seedVehicles() {
  const categories = await db.category.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  let created = 0, skipped = 0;

  for (const v of VEHICLES) {
    const slug = slugify(`${v.title}-${v.year}`);
    const category = catBySlug.get(v.categorySlug);
    if (!category) {
      console.warn(`  ! Category ${v.categorySlug} not found for ${v.title} — skipped`);
      continue;
    }

    const exists = await db.vehicle.findUnique({ where: { slug } });
    if (exists) { skipped++; continue; }

    const vehicle = await db.vehicle.create({
      data: {
        title: v.title,
        slug,
        brand: v.brand,
        model: v.model,
        year: v.year,
        categoryId: category.id,
        price: v.price,
        currency: v.currency ?? "NGN",
        condition: v.condition,
        status: v.status,
        location: v.location,
        shortDescription: v.shortDescription,
        description: v.description,
        mileage: v.mileage ?? null,
        transmission: v.transmission ?? null,
        fuelType: v.fuelType ?? null,
        engine: v.engine ?? null,
        colour: v.colour ?? null,
        bodyType: v.bodyType ?? null,
        driveType: v.driveType ?? null,
        seats: v.seats ?? null,
        specifications: JSON.stringify(v.specifications.map(([label, value]) => ({ label, value }))),
        isFeatured: v.isFeatured ?? false,
        isPublished: true,
        seoTitle: `${v.title} for Sale in Nigeria | C-SPEK MOTORS LTD`,
        seoDescription: v.shortDescription,
        seoKeywords: `${v.brand}, ${v.model}, ${v.year}, ${category.name}, for sale, Nigeria, C-SPEK MOTORS`,
      },
    });

    // Media — first image is primary
    let order = 0;
    for (const ik of v.imageKeys) {
      const url = img(ik.key, ik.index);
      if (!url) continue;
      await db.media.create({
        data: {
          vehicleId: vehicle.id,
          categoryId: category.id,
          type: "IMAGE",
          url,
          filename: url.split("/").pop() || "image.jpg",
          mimeType: url.endsWith(".png") ? "image/png" : "image/jpeg",
          caption: order === 0 ? (v.caption ?? v.title) : `${v.title} — photo ${order + 1}`,
          sortOrder: order,
          isPrimary: order === 0,
        },
      });
      order++;
    }
    created++;
  }
  console.log(`✓ Vehicles: ${created} created, ${skipped} already existed`);
}

async function seedEnquiries() {
  const existing = await db.enquiry.count();
  if (existing > 0) {
    console.log("✓ Enquiries already present — skipping enquiry seed");
    return;
  }
  const landcruiser = await db.vehicle.findFirst({ where: { slug: { contains: "land-cruiser-300" } } });
  const hilux = await db.vehicle.findFirst({ where: { slug: { contains: "hilux-workmate" } } });
  const hiace = await db.vehicle.findFirst({ where: { slug: { contains: "hiace" } } });

  const now = Date.now();
  const rows = [
    landcruiser && {
      vehicleId: landcruiser.id, vehicleName: landcruiser.title, vehicleCategory: "SUVs",
      customerName: "Adebayo Ogundimu", email: "adebayo.o@example.com", phone: "+234 803 555 0142",
      message: "Good day. I am interested in the Land Cruiser 300 VXR. Can you confirm it is still available and share the final asking price including duty? I can come inspect this week.",
      status: "CONTACTED", createdAt: new Date(now - 2 * 3600 * 1000),
    },
    hilux && {
      vehicleId: hilux.id, vehicleName: hilux.title, vehicleCategory: "Commercial Vehicles",
      customerName: "Fatima Bello", email: "fatima.bello@example.com", phone: "+234 806 555 0187",
      message: "Hello, my organization needs 4 units of the 2022 Hilux Workmate 4x4 for a field project in Kaduna. Kindly share fleet pricing and delivery timeline.",
      status: "IN_PROGRESS", createdAt: new Date(now - 26 * 3600 * 1000),
    },
    hiace && {
      vehicleId: hiace.id, vehicleName: hiace.title, vehicleCategory: "Vans",
      customerName: "Chinedu Okafor", email: "chinedu.okafor@example.com", phone: "+234 809 555 0163",
      message: "Please how much is the last price for the Hiace Hummer bus? I want to use it for Lagos to Onitsha transport business.",
      status: "NEW", createdAt: new Date(now - 45 * 60 * 1000),
    },
  ].filter(Boolean) as {
    vehicleId: string; vehicleName: string; vehicleCategory: string; customerName: string;
    email: string; phone: string; message: string; status: string; createdAt: Date;
  }[];

  for (const row of rows) {
    await db.enquiry.create({ data: row });
  }
  console.log(`✓ ${rows.length} sample enquiries seeded`);
}

async function seedContactMessages() {
  const existing = await db.contactMessage.count();
  if (existing > 0) return;
  await db.contactMessage.create({
    data: {
      name: "Grace Eze", email: "grace.eze@example.com", phone: "+234 805 555 0129",
      subject: "Part-exchange enquiry",
      message: "Good afternoon. Do you accept trade-ins? I have a 2017 Toyota Highlander I would like to exchange for an SUV from your showroom.",
    },
  });
  console.log("✓ Sample contact message seeded");
}

async function main() {
  console.log("Seeding C-SPEK MOTORS LTD database...\n");
  await seedAdmin();
  await seedSettings();
  await seedCategories();
  await seedVehicles();
  await seedEnquiries();
  await seedContactMessages();
  console.log("\nSeed complete ✔");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
