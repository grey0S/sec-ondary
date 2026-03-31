import type { Metadata } from "next";
import { InstalarPWAClient } from "./ui";

export const metadata: Metadata = {
  title: "Instalar PWA — sec·ondary",
  description: "Añadí sec·ondary a la pantalla de inicio en iPhone (Safari).",
};

export default function InstalarPWAPage() {
  return (
    <div className="min-h-screen bg-[#070712] text-[#e8e9ff] px-4 py-10 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-black text-white mb-2">
        sec<span className="text-[#00f5c8]">·</span>ondary como app (PWA)
      </h1>
      <p className="text-sm text-[#7a7da3] mb-8">
        En iPhone no hay “Instalar” como en Android: abrís la web en <strong className="text-white">Safari</strong> y la
        añadís al inicio. Este QR abre la app en el mismo origen que estés usando (local o Vercel).
      </p>
      <InstalarPWAClient />
    </div>
  );
}
