import type { Metadata, Viewport } from "next";
import { DM_Sans, Orbitron } from "next/font/google";
import "./globals.css";
import { GameNav } from "@/components/GameNav";
import { SessionGate } from "@/components/SessionGate";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["500", "700", "900"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "sec·ondary — misiones con amigos",
  description: "Misiones secundarias generadas por IA. XP, rangos, rachas y modo 2vs2.",
  applicationName: "sec·ondary",
  appleWebApp: {
    capable: true,
    title: "sec·ondary",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#070712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${orbitron.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-24 relative">
        <div className="pointer-events-none fixed inset-0 scanlines opacity-35 z-0" aria-hidden />
        <main className="flex-1 relative z-10 px-4 pt-6 max-w-lg mx-auto w-full">
          <SessionGate>{children}</SessionGate>
        </main>
        <GameNav />
      </body>
    </html>
  );
}
