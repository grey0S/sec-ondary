"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";

type Me = {
  user: { displayName: string; username: string; socialCode6: string; xp: number; soloStreak: number; groupStreak: number };
  rank: { name: string };
  level: number;
};

type Friend = { id: string; displayName: string; username: string; xp: number };
type Row = { userId: string; weeklyXp: number; displayName: string; username: string; isYou: boolean };

function SocialInner() {
  const params = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [ranking, setRanking] = useState<Row[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      fetch("/api/me", { credentials: "include" }),
      fetch("/api/friends", { credentials: "include" }),
      fetch("/api/social/weekly", { credentials: "include" }),
    ]);
    if (a.ok) setMe(await a.json());
    if (b.ok) {
      const j = await b.json();
      setFriends(j.friends as Friend[]);
    }
    if (c.ok) {
      const j = await c.json();
      setRanking(j.ranking as Row[]);
    }
  }, []);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const pre = params.get("add");
    if (pre && pre.length === 6) setCode(pre);
  }, [params]);

  const addFriend = async () => {
    setMsg(null);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ socialCode6: code }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg((j as { error?: string }).error ?? "Error");
      return;
    }
    setMsg("¡Amistad lista!");
    setCode("");
    await load();
  };

  const qrValue = me && origin ? `${origin}/social?add=${me.user.socialCode6}` : "";

  return (
    <div className="space-y-6 pb-8">
      <h1 className="font-display text-xl font-black text-white">Social</h1>
      <p className="text-xs text-[#7a7da3]">Código de 6 dígitos y QR para sumar amigos. Ranking semanal del grupo.</p>

      {me && (
        <section className="rounded-2xl border border-[#00f5c8]/35 bg-[#0f1020] p-4 neon-border flex flex-col items-center gap-3">
          <p className="font-display text-xs uppercase tracking-widest text-[#7a7da3]">Tu código</p>
          <p className="font-mono text-3xl tracking-[0.4em] text-[#00f5c8]">{me.user.socialCode6}</p>
          {qrValue && (
            <div className="bg-white p-3 rounded-xl">
              <QRCode value={qrValue} size={160} />
            </div>
          )}
          <p className="text-[10px] text-center text-[#7a7da3]">sec·ondary · {me.user.username}</p>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
        <label className="text-[10px] uppercase text-[#7a7da3]">Agregar por código</label>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 font-mono tracking-widest"
          />
          <button
            type="button"
            onClick={() => void addFriend()}
            className="rounded-xl bg-[#bf5fff] px-4 font-display text-sm font-bold text-black"
          >
            Add
          </button>
        </div>
        {msg && <p className="text-xs text-[#00f5c8]">{msg}</p>}
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <h2 className="font-display text-xs uppercase tracking-widest text-[#7a7da3] mb-3">Ranking semanal (amigos)</h2>
        <ul className="space-y-2">
          {ranking.map((r, i) => (
            <li
              key={r.userId}
              className={`flex justify-between text-sm rounded-lg px-2 py-1 ${r.isYou ? "bg-[#00f5c8]/10 border border-[#00f5c8]/30" : ""}`}
            >
              <span>
                <span className="text-[#7a7da3] mr-2">#{i + 1}</span>
                {r.displayName}
              </span>
              <span className="font-display text-[#bf5fff]">{r.weeklyXp} XP</span>
            </li>
          ))}
          {ranking.length === 0 && <li className="text-xs text-[#7a7da3]">Sin datos esta semana.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <h2 className="font-display text-xs uppercase tracking-widest text-[#7a7da3] mb-3">Progreso de amigos</h2>
        <ul className="space-y-2 text-sm">
          {friends.map((f) => (
            <li key={f.id} className="flex justify-between border-b border-white/5 pb-2">
              <span>{f.displayName}</span>
              <span className="text-[#00f5c8]">{f.xp} XP</span>
            </li>
          ))}
          {friends.length === 0 && <li className="text-xs text-[#7a7da3]">Todavía no tenés amigos agregados.</li>}
        </ul>
      </section>
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#7a7da3]">Cargando…</p>}>
      <SocialInner />
    </Suspense>
  );
}
