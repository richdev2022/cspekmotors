import assert from "node:assert/strict";
import test from "node:test";

const { mediaTypeFromMime, publicMediaUrl, validateUpload } = await import("../src/lib/media.ts");
const { getUploadRoot } = await import("../src/lib/upload-root.ts");

test("accepts the uploaded JPEG vehicle image and keeps its serving URL reachable", () => {
  const validation = validateUpload(
    { name: "howo-trucks.jpg", type: "image/jpeg", size: 720 * 1024 },
    "image",
  );

  assert.equal(validation.ok, true);
  assert.equal(mediaTypeFromMime("image/jpeg"), "IMAGE");
  assert.equal(publicMediaUrl("/api/files/vehicles/howo-trucks.jpg"), "/api/files/vehicles/howo-trucks.jpg");
  assert.equal(publicMediaUrl("https://www.cspekmotors.com/api/files/vehicles/howo-trucks.jpg"), "/api/files/vehicles/howo-trucks.jpg");
  const uploadedCdnUrl = "https://cdn.builder.io/api/v1/image/assets%2Fd90e7320ff704043aeff0f65289577bd%2F6fa5dcc18271442c962131f561c5ad51?format=webp&width=800&height=1200";
  assert.equal(publicMediaUrl(uploadedCdnUrl), uploadedCdnUrl);
});

test("rejects unsupported image formats before storage", () => {
  const validation = validateUpload(
    { name: "howo-trucks.gif", type: "image/gif", size: 720 * 1024 },
    "image",
  );

  assert.equal(validation.ok, false);
});

test("resolves a writable root in serverless environments", () => {
  const previousVercel = process.env.VERCEL;
  const previousUploadDir = process.env.UPLOAD_DIR;
  process.env.VERCEL = "1";
  delete process.env.UPLOAD_DIR;

  assert.match(getUploadRoot(), /cspek-uploads$/);

  if (previousVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = previousVercel;
  if (previousUploadDir === undefined) delete process.env.UPLOAD_DIR;
  else process.env.UPLOAD_DIR = previousUploadDir;
});
