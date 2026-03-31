import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "sec·ondary — misiones con amigos",
    short_name: "sec·ondary",
    description: "Misiones secundarias con IA. XP, rangos, rachas y modo 2vs2.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#070712",
    theme_color: "#070712",
    orientation: "portrait",
    lang: "es",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
