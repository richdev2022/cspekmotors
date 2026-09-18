/**
 * C-SPEK MOTORS LTD — Seed image fetcher
 * Runs parallel image searches via z-ai CLI, downloads results locally
 * to /home/z/my-project/uploads/seed/ so the site is self-contained.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";

const OUT_DIR = "/home/z/my-project/uploads/seed";
const TMP_DIR = "/home/z/my-project/scripts/.img-tmp";
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

const searches: { key: string; query: string; count: number }[] = [
  { key: "hero", query: "modern luxury car dealership showroom at night with cars", count: 3 },
  { key: "cat-cars", query: "silver sedan car parked side view", count: 2 },
  { key: "cat-suvs", query: "white Toyota Land Cruiser SUV parked outdoors", count: 3 },
  { key: "cat-trucks", query: "Mercedes-Benz Actros heavy truck", count: 3 },
  { key: "cat-trailers", query: "flatbed semi trailer truck on highway", count: 2 },
  { key: "cat-buses", query: "Toyota Coaster commuter mini bus", count: 2 },
  { key: "cat-vans", query: "Toyota Hiace white van", count: 2 },
  { key: "cat-commercial", query: "Toyota Hilux pickup truck white", count: 3 },
  { key: "cat-other", query: "armored cash in transit truck vehicle", count: 2 },
  { key: "lexus", query: "black Lexus LX luxury SUV", count: 2 },
  { key: "camry", query: "Toyota Camry sedan black", count: 2 },
  { key: "sprinter", query: "Mercedes-Benz Sprinter passenger van", count: 2 },
  { key: "coaster", query: "Toyota Coaster bus side view", count: 1 },
  { key: "man-truck", query: "MAN TGS heavy duty dump truck", count: 2 },
  { key: "showroom", query: "car salesman handing car keys customer dealership", count: 2 },
];

function runSearch(key: string, query: string, count: number): Promise<void> {
  return new Promise((resolve) => {
    const out = `${TMP_DIR}/${key}.json`;
    const proc = spawn("z-ai", ["image-search", "-q", query, "--count", String(count), "--gl", "us", "--no-rank"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    proc.stdout!.on("data", (d: Buffer) => (stdout += d.toString()));
    const timer = setTimeout(() => {
      try { proc.kill(); } catch {}
      // Parse whatever we captured — CLI prints JSON at the end
      extractJson(stdout, out);
      resolve();
    }, 180000);
    proc.on("exit", () => { clearTimeout(timer); extractJson(stdout, out); resolve(); });
    proc.on("error", () => { clearTimeout(timer); resolve(); });
  });
}

function extractJson(stdout: string, out: string) {
  if (!stdout.trim()) return;
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return;
  try {
    const json = JSON.parse(stdout.slice(start, end + 1));
    writeFileSync(out, JSON.stringify(json));
  } catch {}
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) return false; // too small, likely error page
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`Running ${searches.length} image searches (batches of 4)...`);
  const BATCH = 4;
  for (let i = 0; i < searches.length; i += BATCH) {
    const batch = searches.slice(i, i + BATCH).filter((s) => !existsSync(`${TMP_DIR}/${s.key}.json`));
    console.log(`Batch ${Math.floor(i / BATCH) + 1}: ${batch.map((b) => b.key).join(", ") || "(all cached)"}`);
    await Promise.all(batch.map((s) => runSearch(s.key, s.query, s.count)));
  }
  console.log("All searches settled. Downloading images...");

  const manifest: Record<string, string[]> = {};
  let ok = 0, fail = 0;

  for (const s of searches) {
    manifest[s.key] = [];
    const file = `${TMP_DIR}/${s.key}.json`;
    if (!existsSync(file)) { console.log(`[MISS] ${s.key}: no result file`); continue; }
    try {
      const data = JSON.parse(readFileSync(file, "utf8"));
      if (!data.success || !Array.isArray(data.results)) { console.log(`[MISS] ${s.key}: success=false`); continue; }
      let i = 0;
      for (const r of data.results) {
        const url: string | undefined = r.original_url;
        if (!url) continue;
        i++;
        const ext = url.toLowerCase().includes(".png") ? "png" : "jpg";
        const dest = `${OUT_DIR}/${s.key}-${i}.${ext}`;
        const good = await download(url, dest);
        if (good) { manifest[s.key].push(`/api/files/seed/${s.key}-${i}.${ext}`); ok++; }
        else { fail++; }
      }
      console.log(`[OK] ${s.key}: ${manifest[s.key].length}/${data.results?.length ?? 0} downloaded`);
    } catch (e) {
      console.log(`[ERR] ${s.key}: ${e}`);
    }
  }

  writeFileSync("/home/z/my-project/scripts/seed-images-manifest.json", JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Downloaded=${ok} Failed=${fail}`);
  console.log(JSON.stringify(manifest, null, 2));
}

main();
