import QRCode from "qrcode";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.NEXT_PUBLIC_IOS_INSTALL_URL || process.argv[2] || "https://testflight.apple.com/join/REEMPLAZA-TU-CODIGO";
const out = join(__dirname, "..", "public", "ios-install-qr.png");

mkdirSync(dirname(out), { recursive: true });
await QRCode.toFile(out, url, { type: "png", width: 512, margin: 2 });
console.log("QR guardado:", out);
console.log("URL:", url);
