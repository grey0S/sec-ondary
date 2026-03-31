"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { useMemo } from "react";

export function InstalarPWAClient() {
  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const pwaUrl = origin ? `${origin}/` : "";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#00f5c8]/35 bg-[#0f1020] p-6 neon-border text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#7a7da3] mb-4">Abrir en Safari (mismo sitio)</p>
        {pwaUrl ? (
          <div className="inline-block bg-white p-4 rounded-xl">
            <QRCode value={pwaUrl} size={220} />
          </div>
        ) : (
          <p className="text-sm text-[#7a7da3]">Cargando…</p>
        )}
        <p className="mt-4 text-xs break-all text-[#bf5fff]">{pwaUrl || "—"}</p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#b9bcd6] space-y-3">
        <p className="font-display text-xs uppercase text-[#00f5c8]">Pasos en iPhone</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Escaneá el QR con la cámara (o abrí esta URL en Safari).</li>
          <li>
            Tocá el botón <strong className="text-white">Compartir</strong>{" "}
            <span className="opacity-70">(cuadrado con flecha)</span>.
          </li>
          <li>
            Elegí <strong className="text-white">Añadir a la pantalla de Inicio</strong> → Añadir.
          </li>
          <li>La app abre en pantalla completa (modo standalone) como una app nativa.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-[10px] uppercase text-[#7a7da3] mb-2">QR estático (repo)</p>
        <p className="text-xs text-[#7a7da3] mb-3">
          Tras desplegar en internet, regenerá el PNG con tu URL pública:
        </p>
        <code className="block text-[11px] text-[#00f5c8] break-all bg-black/40 p-2 rounded-lg">
          npm run qr:pwa -- https://tu-dominio.com
        </code>
        <div className="mt-4 relative mx-auto h-[200px] w-[200px]">
          <Image
            src="/pwa-install-qr.png"
            alt="Código QR para abrir la PWA"
            fill
            className="object-contain"
            sizes="200px"
            unoptimized
          />
        </div>
        <p className="text-[10px] text-[#5c5f7a] mt-2 text-center">public/pwa-install-qr.png (placeholder)</p>
      </section>
    </div>
  );
}
