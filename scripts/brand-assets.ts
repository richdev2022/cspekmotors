/**
 * C-SPEK MOTORS LTD — brand asset pipeline
 * Copies the two uploaded logos into public/brand and derives:
 *  - favicon.png (32) + favicon-512.png (cropped emblem, square)
 *  - apple-touch-icon.png (180, emblem on white)
 *  - og-image.png (1200x630, dark background + silver logo)
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const UPLOAD = "/home/z/my-project/upload";
const PUBLIC = "/home/z/my-project/public";
const BRAND = path.join(PUBLIC, "brand");

fs.mkdirSync(BRAND, { recursive: true });

const LIGHT_SRC = path.join(UPLOAD, "Cspek motors.png");            // black text — for white/light backgrounds
const DARK_SRC = path.join(UPLOAD, "Cspek motors on dark background.png"); // silver text — for dark backgrounds

async function main() {
  // 1. Copy originals
  fs.copyFileSync(LIGHT_SRC, path.join(BRAND, "logo-light-bg.png"));
  fs.copyFileSync(DARK_SRC, path.join(BRAND, "logo-dark-bg.png"));

  // 2. Emblem crop (car + swoosh = top ~60% of the artwork) from the light logo
  const meta = await sharp(LIGHT_SRC).metadata();
  const w = meta.width!, h = meta.height!;
  const emblemTop = Math.round(h * 0.02);
  const emblemH = Math.round(h * 0.58);
  // NOTE: sharp applies trim() BEFORE extract(), so run them as two separate passes
  const emblemRaw = await sharp(LIGHT_SRC)
    .extract({ left: 0, top: emblemTop, width: w, height: emblemH })
    .png()
    .toBuffer();
  const emblemBuf = await sharp(emblemRaw).trim().png().toBuffer();
  const emblemMeta = await sharp(emblemBuf).metadata();
  console.log("emblem:", emblemMeta.width, "x", emblemMeta.height);

  // 3. Square emblem (transparent padding) → favicon-512
  const emblem512 = await sharp(emblemBuf)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND, "emblem-512.png"), emblem512);
  fs.writeFileSync(path.join(PUBLIC, "favicon-512.png"), emblem512);

  // 4. favicon.png 32x32
  fs.writeFileSync(
    path.join(PUBLIC, "favicon.png"),
    await sharp(emblemBuf).resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  );

  // 5. apple-touch-icon.png — emblem on white, 180x180
  fs.writeFileSync(
    path.join(PUBLIC, "apple-touch-icon.png"),
    await sharp({ create: { width: 180, height: 180, channels: 4, background: "#ffffff" } })
      .composite([{ input: await sharp(emblemBuf).resize(164, 164, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), gravity: "center" }])
      .png()
      .toBuffer()
  );

  // 6. og-image.png — 1200x630 dark canvas + silver (dark-bg) logo centered
  const darkMeta = await sharp(DARK_SRC).metadata();
  const logoW = 920;
  const logoH = Math.round((darkMeta.height! / darkMeta.width!) * logoW);
  const darkLogo = await sharp(DARK_SRC).resize(logoW, logoH).png().toBuffer();
  fs.writeFileSync(
    path.join(PUBLIC, "og-image.png"),
    await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#09090b" } })
      .composite([
        { input: darkLogo, top: Math.round((630 - logoH) / 2), left: Math.round((1200 - logoW) / 2) },
      ])
      .png()
      .toBuffer()
  );

  // 7. JSON-LD organization logo — square emblem on white
  fs.writeFileSync(
    path.join(BRAND, "emblem-square.png"),
    await sharp({ create: { width: 512, height: 512, channels: 4, background: "#ffffff" } })
      .composite([{ input: await sharp(emblemBuf).resize(460, 460, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), gravity: "center" }])
      .png()
      .toBuffer()
  );

  console.log("✅ brand assets generated in", BRAND);
}

main().catch((e) => { console.error(e); process.exit(1); });
