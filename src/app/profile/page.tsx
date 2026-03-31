"use client";

import { useEffect, useState, useCallback } from "react";

type Me = {
  user: {
    id: string;
    displayName: string;
    username: string;
    usernameChangedAt: string | null;
    xp: number;
    soloStreak: number;
    soloStreakBest: number;
    groupStreak: number;
    groupStreakBest: number;
    equippedTitle: string | null;
    equippedFrame: string | null;
  };
  rank: { name: string };
  level: number;
};

type Hist = {
  id: string;
  xpReceived: number;
  completedAt: string;
  wasSolo: boolean;
  wasUrgent: boolean;
  wasExplosive: boolean;
  mission: { title: string; memoryPhotoDataUrl: string | null; reactionEmoji: string | null };
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [history, setHistory] = useState<Hist[]>([]);
  const [uname, setUname] = useState("");
  const [dname, setDname] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      fetch("/api/me", { credentials: "include" }),
      fetch("/api/missions/history", { credentials: "include" }),
    ]);
    if (a.ok) {
      const j = await a.json();
      setMe(j as Me);
      setUname((j as Me).user.username);
      setDname((j as Me).user.displayName);
    }
    if (b.ok) {
      const j = await b.json();
      setHistory(j.history as Hist[]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setMsg(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: uname, displayName: dname }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg((j as { error?: string }).error ?? "Error");
      return;
    }
    setMsg("Perfil actualizado");
    await load();
  };

  const cooldownDays = 15;
  let daysLeft = 0;
  if (me?.user.usernameChangedAt) {
    const ms = cooldownDays * 24 * 60 * 60 * 1000 - (Date.now() - new Date(me.user.usernameChangedAt).getTime());
    daysLeft = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="font-display text-xl font-black text-white">Perfil</h1>
      {me && (
        <div className="rounded-2xl border border-white/10 bg-[#0f1020] p-4 space-y-2 neon-border">
          <p className="font-display text-2xl text-[#00f5c8]">
            Nv. {me.level}{" "}
            <span className="text-sm text-[#bf5fff]">
              {me.user.equippedTitle ? `· ${me.user.equippedTitle}` : ""}
            </span>
          </p>
          <p className="text-sm text-[#7a7da3]">
            Rango: <span className="text-white">{me.rank.name}</span>
          </p>
          <p className="text-sm">XP total: {me.user.xp}</p>
          <p className="text-xs text-[#7a7da3]">
            Marco: {me.user.equippedFrame ?? "ninguno"} · Rachas: solo {me.user.soloStreak} (best {me.user.soloStreakBest}) ·
            grupo {me.user.groupStreak} (best {me.user.groupStreakBest})
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="font-display text-xs uppercase text-[#7a7da3]">Editar</h2>
        <label className="text-[10px] text-[#7a7da3]">Nombre visible</label>
        <input
          value={dname}
          onChange={(e) => setDname(e.target.value)}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-2 text-sm"
        />
        <label className="text-[10px] text-[#7a7da3]">Usuario (cooldown {cooldownDays}d)</label>
        <input
          value={uname}
          onChange={(e) => setUname(e.target.value)}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-2 text-sm"
        />
        {daysLeft > 0 && <p className="text-xs text-[#ff3d7a]">Próximo cambio de usuario en ~{daysLeft} día(s).</p>}
        <button
          type="button"
          onClick={() => void save()}
          className="w-full rounded-xl bg-[#bf5fff] py-2 font-display text-sm font-bold text-black"
        >
          Guardar
        </button>
        {msg && <p className="text-xs text-[#00f5c8]">{msg}</p>}
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <h2 className="font-display text-xs uppercase text-[#7a7da3] mb-3">Historial · recuerdos</h2>
        <ul className="space-y-3">
          {history.map((h) => (
            <li key={h.id} className="border-b border-white/5 pb-3">
              <p className="font-display text-sm text-white">{h.mission.title}</p>
              <p className="text-[10px] text-[#7a7da3]">
                +{h.xpReceived} XP · {h.wasSolo ? "solo" : "grupo"}
                {h.wasUrgent ? " · urgente" : ""}
                {h.wasExplosive ? " · explosiva" : ""}{" "}
                {h.mission.reactionEmoji ? h.mission.reactionEmoji : ""}
              </p>
              {h.mission.memoryPhotoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={h.mission.memoryPhotoDataUrl}
                  alt=""
                  className="mt-2 rounded-lg max-h-32 object-cover border border-white/10"
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
