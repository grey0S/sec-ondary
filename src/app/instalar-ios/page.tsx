import type { Metadata } from "next";
import { InstalarIOSClient } from "./ui";

export const metadata: Metadata = {
  title: "Instalar sec·ondary en iPhone",
  description: "QR y enlace para probar la app iOS nativa (SwiftUI).",
};

export default function InstalarIOSPage() {
  const installUrl =
    process.env.NEXT_PUBLIC_IOS_INSTALL_URL?.trim() ||
    "https://testflight.apple.com/join/REEMPLAZA-TU-CODIGO";

  return (
    <div className="min-h-screen bg-[#070712] text-[#e8e9ff] px-4 py-10 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-black text-white mb-2">
        sec<span className="text-[#00f5c8]">·</span>ondary en iOS
      </h1>
      <p className="text-sm text-[#7a7da3] mb-8">
        Escaneá el código para abrir el enlace de instalación (TestFlight o App Store). Si aún no publicaste la
        build, seguí las instrucciones debajo desde una Mac con Xcode.
      </p>
      <InstalarIOSClient installUrl={installUrl} />
    </div>
  );
}
