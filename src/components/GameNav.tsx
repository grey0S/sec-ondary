"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Base" },
  { href: "/social", label: "Social" },
  { href: "/shop", label: "Tienda" },
  { href: "/duel", label: "2vs2" },
  { href: "/profile", label: "Perfil" },
];

export function GameNav() {
  const path = usePathname();
  if (path === "/instalar-ios" || path === "/instalar-pwa") return null;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-[#080818]/95 backdrop-blur-md">
      <div className="max-w-lg mx-auto flex justify-around py-2 px-1">
        {links.map((l) => {
          const active = path === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`font-display text-[10px] uppercase tracking-widest px-2 py-2 rounded-lg transition-colors ${
                active
                  ? "text-[#00f5c8] bg-white/5 neon-border"
                  : "text-[#7a7da3] hover:text-white/80"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
