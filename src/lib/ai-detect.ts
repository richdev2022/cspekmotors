// ============================================================
// AI media auto-categorization (server-side)
//
// Uses the z-ai-web-dev-sdk vision model to look at an uploaded
// image (or a frame extracted from a video via ffmpeg) and map it
// to one of the dealership's vehicle categories.
// ============================================================
import { spawn } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export interface DetectedCategory {
  category: string;
  brand: string | null;
  model: string | null;
  name: string | null;
  year: number | null;
  confidence: number;
  description: string;
}

export class VisionNotConfiguredError extends Error {
  constructor() {
    super("AI auto-detection is not configured on this server. Set AI_VISION_API_KEY and optionally AI_VISION_BASE_URL and AI_VISION_MODEL, then restart the app. Until then, assign categories manually.");
    this.name = "VisionNotConfiguredError";
  }
}

interface ZaiMessagePart {
  type: string;
  text?: string;
  image_url?: { url: string };
}

let zaiPromise: Promise<{
  chat: { completions: { createVision(body: unknown): Promise<ZaiVisionResponse> } };
}> | null = null;

interface ZaiVisionResponse {
  choices?: { message?: { content?: string } }[];
}

interface VisionClient {
  name: string;
  classify(dataUrl: string, prompt: string): Promise<string>;
}

let zaiClient: VisionClient | null | undefined;

async function getZaiClient(): Promise<VisionClient | null> {
  if (zaiClient !== undefined) return zaiClient;
  try {
    const mod = await import("z-ai-web-dev-sdk");
    const zai = (await mod.default.create()) as {
      chat: { completions: { createVision(body: unknown): Promise<ZaiVisionResponse> } };
    };
    zaiClient = {
      name: "zai-sdk",
      async classify(dataUrl, prompt) {
        const res = await zai.chat.completions.createVision({
          messages: [{ role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ] as ZaiMessagePart[] }],
          thinking: { type: "disabled" },
        });
        return res?.choices?.[0]?.message?.content ?? "";
      },
    };
  } catch {
    zaiClient = null;
  }
  return zaiClient;
}

export function openAiVisionConfig(): { baseUrl: string; apiKey: string; model: string } | null {
  const apiKey = process.env.AI_VISION_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    baseUrl: (process.env.AI_VISION_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
    apiKey,
    model: process.env.AI_VISION_MODEL?.trim() || "gpt-4o-mini",
  };
}

async function classifyViaOpenAiCompatible(
  cfg: { baseUrl: string; apiKey: string; model: string },
  dataUrl: string,
  prompt: string,
): Promise<string> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 300,
      messages: [{ role: "user", content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: dataUrl } },
      ] }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 180);
    throw new Error(`Vision API returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const json = (await res.json()) as ZaiVisionResponse;
  return json?.choices?.[0]?.message?.content ?? "";
}

// ------------------------------------------------------------
// Video frame extraction (ffmpeg)
// ------------------------------------------------------------
const FFMPEG_BIN = () => process.env.FFMPEG_PATH?.trim() || "ffmpeg";

function runFfmpeg(args: string[], timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_BIN(), args, { stdio: ["ignore", "ignore", "ignore"] });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("ffmpeg timed out"));
    }, timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

/**
 * Extract a representative JPEG frame from a video buffer.
 * Tries to grab a frame ~1.5s in; falls back to the very first frame.
 * Returns null when ffmpeg is unavailable or the video can't be decoded.
 */
export async function extractVideoFrame(buffer: Buffer): Promise<Buffer | null> {
  if (!buffer.length) return null;
  const dir = await mkdtemp(path.join(tmpdir(), "cspek-frame-"));
  try {
    const src = path.join(dir, "input.bin");
    const out = path.join(dir, "frame.jpg");
    await writeFile(src, buffer);

    // Seek 1.5s in for a more representative shot; fall back to first frame.
    for (const seekArgs of [["-ss", "1.5"], []]) {
      try {
        await runFfmpeg(["-y", "-i", src, ...seekArgs, "-vframes", "1", "-q:v", "3", out]);
        const frame = await readFile(out).catch(() => null);
        if (frame && frame.length > 0) return frame;
      } catch (err) {
        if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
          throw new Error(`ffmpeg was not found on the server (looked for "${FFMPEG_BIN()}"). Install ffmpeg or set FFMPEG_PATH to enable video auto-detection. Assign this file manually for now.`);
        }
        // try next strategy
      }
    }
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// ------------------------------------------------------------
// Vision classification
// ------------------------------------------------------------
function parseModelJson(raw: string): DetectedCategory | null {
  if (!raw) return null;
  // Strip markdown fences and any prose around the JSON object.
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const category = typeof obj.category === "string" ? obj.category.trim() : "";
    const brand = typeof obj.brand === "string" && obj.brand.trim() ? obj.brand.trim() : null;
    const model = typeof obj.model === "string" && obj.model.trim() ? obj.model.trim() : null;
    const name = typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : null;
    const year = typeof obj.year === "number" && obj.year >= 1900 && obj.year <= new Date().getFullYear() + 1 ? Math.round(obj.year) : null;
    const confidence = typeof obj.confidence === "number" ? Math.min(1, Math.max(0, obj.confidence)) : 0.5;
    const description = typeof obj.description === "string" ? obj.description.trim() : "";
    if (!category) return null;
    return { category, brand, model, name, year, confidence, description };
  } catch {
    return null;
  }
}

/**
 * Ask the vision model what kind of vehicle is shown and which
 * dealership category it belongs to. Throws on transport failure —
 * callers should treat that as "AI unavailable" and fall back to manual.
 */
export async function classifyVehicleMedia(
  buffer: Buffer,
  mimeType: string,
  categoryNames: string[],
  vehicleNames: string[] = [],
): Promise<DetectedCategory> {
  const dataUrl = `data:${mimeType || "image/jpeg"};base64,${buffer.toString("base64")}`;

  const prompt = [
    "You are classifying media for an automobile dealership inventory.",
    `Pick the ONE best-fitting vehicle category for the main vehicle shown, strictly from this list: ${categoryNames.join(", ")}.`,
    'If the media shows a vehicle that fits none of the specific categories, choose "Other Vehicles".',
    'If no vehicle at all is clearly visible, choose "Other Vehicles" and set confidence to 0.1.',
    'Identify the visible vehicle when possible. Use null for unknown brand, model, name, or year; never guess a precise identity from an unclear image.',
    vehicleNames.length > 0
      ? `Existing inventory names are provided for matching only. Do not choose one unless the visible make and model clearly agree: ${vehicleNames.join(" | ")}.`
      : "There is no existing inventory list; return the best visible identity or null.",
    'Respond ONLY with a JSON object in this exact shape: {"category":"<name from the list>","brand":"<make or null>","model":"<model or null>","name":"<full vehicle name or null>","year":<number or null>,"confidence":<0-1>,"description":"<one short sentence describing what is shown>"}',
  ].join("\n");

  const failures: string[] = [];
  const zai = await getZaiClient();
  if (zai) {
    try {
      const parsed = parseModelJson(await zai.classify(dataUrl, prompt));
      if (parsed) return parsed;
      failures.push("zai-sdk: unexpected response shape");
    } catch (err) {
      failures.push(`zai-sdk: ${(err as Error)?.message ?? "failed"}`);
    }
  }

  const cfg = openAiVisionConfig();
  if (cfg) {
    try {
      const parsed = parseModelJson(await classifyViaOpenAiCompatible(cfg, dataUrl, prompt));
      if (parsed) return parsed;
      failures.push(`${cfg.model}: unexpected response shape`);
    } catch (err) {
      failures.push(`${cfg.model}: ${(err as Error)?.message ?? "failed"}`);
    }
  }

  if (!zai && !cfg) throw new VisionNotConfiguredError();
  throw new Error(`The AI vision service failed (${failures.join("; ")}). Assign this file manually, or check the AI_VISION_* settings on the server.`);
}

// ------------------------------------------------------------
// Fuzzy category → DB row matching
// ------------------------------------------------------------
const SYNONYMS: Record<string, string[]> = {
  cars: ["car", "sedan", "saloon", "coupe", "hatchback"],
  suvs: ["suv", "crossover", "4x4", "jeep", "sport utility"],
  trucks: ["truck", "pickup", "lorry", "tipper"],
  trailers: ["trailer", "tanker", "semi"],
  buses: ["bus", "coach", "minibus"],
  vans: ["van", "minivan"],
  "commercial vehicles": ["commercial", "commercialvehicle", "commercial-vehicles", "keke", "tricycle", "machinery"],
  motorcycles: ["motorcycle", "bike", "motorbike", "scooter", "tricyclebike"],
  "other vehicles": ["other", "othervehicle", "other-vehicles", "unknown"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Match an AI category guess to a DB category row. Returns null when nothing fits. */
export function matchCategoryToDb(
  guess: string,
  categories: { id: string; name: string }[],
): { id: string; name: string } | null {
  if (!guess || categories.length === 0) return null;
  const norm = normalize(guess);

  // 1) exact normalized match
  let hit = categories.find((c) => normalize(c.name) === norm);
  if (hit) return hit;

  // 2) synonym match
  for (const c of categories) {
    const key = normalize(c.name);
    const syn = SYNONYMS[key] ?? [];
    if (syn.some((s) => normalize(s) === norm)) return c;
  }

  // 3) containment (e.g. "SUV (Sport Utility Vehicle)" or "SUVs & Crossovers")
  hit = categories.find((c) => {
    const key = normalize(c.name);
    return key.length > 2 && (norm.includes(key) || key.includes(norm));
  });
  if (hit) return hit;

  // 4) synonyms with containment
  for (const c of categories) {
    const key = normalize(c.name);
    const syn = SYNONYMS[key] ?? [];
    if (syn.some((s) => {
      const sn = normalize(s);
      return sn.length > 2 && (norm.includes(sn) || sn.includes(norm));
    })) return c;
  }

  return null;
}

export function matchDetectedVehicle(
  detection: Pick<DetectedCategory, "brand" | "model" | "name" | "year">,
  vehicles: { id: string; title: string; brand: string; model: string; year: number }[],
): { id: string; title: string; confidence: number } | null {
  const brand = normalize(detection.brand ?? "");
  const model = normalize(detection.model ?? "");
  const name = normalize(detection.name ?? "");
  if (!brand && !model && !name) return null;

  const candidates = vehicles.filter((vehicle) => {
    const vehicleBrand = normalize(vehicle.brand);
    const vehicleModel = normalize(vehicle.model);
    const vehicleTitle = normalize(vehicle.title);
    const exactName = Boolean(name && (vehicleTitle === name || vehicleTitle.includes(name) || name.includes(vehicleTitle)));
    const exactMakeModel = Boolean(brand && model && vehicleBrand === brand && vehicleModel === model);
    const yearMatches = detection.year == null || detection.year === vehicle.year;
    return yearMatches && (exactName || exactMakeModel);
  });

  if (candidates.length !== 1) return null;
  const vehicle = candidates[0];
  const exactName = Boolean(name && normalize(vehicle.title) === name);
  return { id: vehicle.id, title: vehicle.title, confidence: exactName ? 1 : 0.95 };
}
