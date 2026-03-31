"use client";

import QRCode from "react-qr-code";

export function InstalarIOSClient({ installUrl }: { installUrl: string }) {
  const openApi =
    typeof window !== "undefined" ? `${window.location.origin}/api/health` : "/api/health";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#00f5c8]/35 bg-[#0f1020] p-6 neon-border text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#7a7da3] mb-4">Instalación (TestFlight / App Store)</p>
        <div className="inline-block bg-white p-4 rounded-xl">
          <QRCode value={installUrl} size={200} />
        </div>
        <p className="mt-4 text-xs break-all text-[#bf5fff]">{installUrl}</p>
        <p className="mt-2 text-[10px] text-[#7a7da3]">
          Configurá <code className="text-[#00f5c8]">NEXT_PUBLIC_IOS_INSTALL_URL</code> en Vercel/hosting con tu URL real.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#7a7da3] mb-3">Comprobar API del servidor</p>
        <div className="inline-block bg-white p-3 rounded-lg">
          <QRCode value={openApi} size={140} />
        </div>
        <p className="mt-2 text-[10px] text-[#7a7da3] break-all">{openApi}</p>
      </section>

      <section className="text-sm text-[#b9bcd6] space-y-3 leading-relaxed">
        <p className="font-display text-xs uppercase text-[#00f5c8]">Desde código (SwiftUI)</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>En Mac: <code className="text-white">brew install xcodegen</code></li>
          <li>
            <code className="text-white">cd ios && xcodegen generate</code>
          </li>
          <li>
            Abrí <code className="text-white">SecOndary.xcodeproj</code>, target SecOndary → Info → API_BASE_URL = tu URL
            HTTPS (Vercel) o IP local (ej. <code className="text-white">http://192.168.1.10:3000</code>).
          </li>
          <li>Run en simulador o iPhone (misma red Wi‑Fi que el servidor).</li>
        </ol>
      </section>
    </div>
  );
}
