import QRCode from "qrcode";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || process.argv[2] || "http://localhost:3000";
const target = `${url}/`;
const out = join(__dirname, "..", "public", "pwa-install-qr.png");

mkdirSync(dirname(out), { recursive: true });
await QRCode.toFile(out, target, { type: "png", width: 512, margin: 2 });
console.log("QR PWA guardado:", out);
console.log("URL codificada:", target);
