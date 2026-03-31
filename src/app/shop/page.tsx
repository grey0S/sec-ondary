"use client";

import { useEffect, useState, useCallback } from "react";
import { currentRotationSlot, nextShopRotationAt } from "@/lib/game/rotation";

type Item = {
  id: string;
  name: string;
  description: string;
  type: string;
  costXp: number;
  owned: boolean;
  seasonTag?: string | null;
};

export default function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [xp, setXp] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [eta, setEta] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/shop", { credentials: "include" });
    if (!res.ok) return;
    const j = await res.json();
    setItems(j.items as Item[]);
    const me = await fetch("/api/me", { credentials: "include" });
    if (me.ok) {
      const u = await me.json();
      setXp(u.user.xp as number);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => {
      const left = nextShopRotationAt() - Date.now();
      const h = Math.floor(left / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      setEta(`${h}h ${m}m`);
    }, 30000);
    const left = nextShopRotationAt() - Date.now();
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    setEta(`${h}h ${m}m`);
    return () => clearInterval(t);
  }, [load]);

  const buy = async (id: string) => {
    setMsg(null);
    const res = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemId: id }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg((j as { error?: string }).error ?? "Error");
      return;
    }
    setMsg("Canje exitoso · solo cosméticos");
    await load();
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-xl font-black text-white">Tienda</h1>
          <p className="text-xs text-[#7a7da3] mt-1">Rotación cada 3 días · slot {currentRotationSlot() % 3}</p>
        </div>
        <p className="font-display text-[#00f5c8] text-sm">Tu XP: {xp}</p>
      </div>
      <p className="text-xs text-[#bf5fff]">Próxima rotación en ~{eta}</p>
      {msg && <p className="text-xs text-[#00f5c8]">{msg}</p>}
      <ul className="space-y-3">
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-2xl border border-white/10 bg-[#0f1020]/90 p-4 flex flex-col gap-2 neon-border"
          >
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-display font-bold text-white">{it.name}</p>
                <p className="text-xs text-[#7a7da3]">{it.description}</p>
                <p className="text-[10px] uppercase text-[#5c5f7a] mt-1">
                  {it.type}
                  {it.seasonTag ? ` · ${it.seasonTag}` : ""}
                </p>
              </div>
              <p className="font-display text-[#bf5fff] text-sm whitespace-nowrap">{it.costXp} XP</p>
            </div>
            <button
              type="button"
              disabled={it.owned}
              onClick={() => void buy(it.id)}
              className="rounded-xl bg-gradient-to-r from-[#bf5fff] to-[#00f5c8] py-2 font-display text-xs font-black text-black disabled:opacity-40"
            >
              {it.owned ? "En tu inventario" : "Canjear"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
