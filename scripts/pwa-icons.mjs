import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "public", "icons");
mkdirSync(out, { recursive: true });

const bg = { r: 7, g: 7, b: 18, alpha: 1 };
const accent = { r: 0, g: 245, b: 200, alpha: 1 };

async function icon(size) {
  const border = Math.max(2, Math.floor(size * 0.06));
  const inner = size - border * 2;
  const svg = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="rgb(${bg.r},${bg.g},${bg.b})" rx="${size * 0.22}"/>
    <rect x="${border}" y="${border}" width="${inner}" height="${inner}" fill="none" stroke="rgb(${accent.r},${accent.g},${accent.b})" stroke-width="${Math.max(2, size / 64)}" rx="${inner * 0.18}"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="${size * 0.2}" fill="rgb(${accent.r},${accent.g},${accent.b})">sec</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const sizes = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
];

for (const [name, s] of sizes) {
  const buf = await icon(s);
  await sharp(buf).resize(s, s).png().toFile(join(out, name));
  console.log("OK", name);
}
