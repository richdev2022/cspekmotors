import assert from "node:assert/strict";
import test from "node:test";

const { mediaTypeFromMime, publicMediaUrl, validateUpload } = await import("../src/lib/media.ts");

test("accepts the uploaded JPEG vehicle image and keeps its serving URL reachable", () => {
  const validation = validateUpload(
    { name: "howo-trucks.jpg", type: "image/jpeg", size: 720 * 1024 },
    "image",
  );

  assert.equal(validation.ok, true);
  assert.equal(mediaTypeFromMime("image/jpeg"), "IMAGE");
  assert.equal(publicMediaUrl("/api/files/vehicles/howo-trucks.jpg"), "http://localhost:3000/api/files/vehicles/howo-trucks.jpg");
});

test("rejects unsupported image formats before storage", () => {
  const validation = validateUpload(
    { name: "howo-trucks.gif", type: "image/gif", size: 720 * 1024 },
    "image",
  );

  assert.equal(validation.ok, false);
});
