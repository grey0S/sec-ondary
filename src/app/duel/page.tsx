"use client";

import { useCallback, useEffect, useState } from "react";

type Duel = {
  id: string;
  status: string;
  durationDays: number;
  teamAUserIds: string;
  teamBUserIds: string;
  teamAXp: number;
  teamBXp: number;
  winnerTeam: number | null;
  invitedCode6: string | null;
  endsAt: string | null;
};

type Friend = { id: string; displayName: string };

export default function DuelPage() {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [duration, setDuration] = useState(3);
  const [partnerA, setPartnerA] = useState("");
  const [invite, setInvite] = useState("");
  const [partnerB, setPartnerB] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [duelId, setDuelId] = useState("");
  const [compLoading, setCompLoading] = useState(false);

  const load = useCallback(async () => {
    const [d, f] = await Promise.all([
      fetch("/api/duel", { credentials: "include" }),
      fetch("/api/friends", { credentials: "include" }),
    ]);
    if (d.ok) {
      const j = await d.json();
      setDuels(j.duels as Duel[]);
    }
    if (f.ok) {
      const j = await f.json();
      setFriends(j.friends as Friend[]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createDuel = async () => {
    setMsg(null);
    const res = await fetch("/api/duel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ durationDays: duration, partnerId: partnerA }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg((j as { error?: string }).error ?? "Error");
      return;
    }
    setLastCode((j as { inviteCode?: string }).inviteCode ?? null);
    setMsg("Duelo creado. Pasá el código al rival.");
    await load();
  };

  const joinDuel = async () => {
    setMsg(null);
    const res = await fetch("/api/duel/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ inviteCode: invite, partnerId: partnerB }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg((j as { error?: string }).error ?? "Error");
      return;
    }
    setMsg("¡Duelo activo! Generá misiones competitivas desde Inicio.");
    await load();
  };

  const genCompetitive = async () => {
    if (!duelId) {
      setMsg("Pegá el id del duelo activo (copiá de la lista).");
      return;
    }
    setCompLoading(true);
    setMsg(null);
    const res = await fetch("/api/missions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ context: "duelo 2vs2 competitivo", competitive: { duelId } }),
    });
    const j = await res.json().catch(() => ({}));
    setCompLoading(false);
    if (!res.ok) {
      setMsg((j as { error?: string }).error ?? "Error");
      return;
    }
    setMsg("Misión competitiva generada. Ambos del equipo deben completarla juntos.");
  };

  return (
    <div className="space-y-6 pb-8">
      <h1 className="font-display text-xl font-black text-white">Modo 2 vs 2</h1>
      <p className="text-xs text-[#7a7da3]">
        Duración 1–7 días. Las misiones competitivas suman XP al equipo solo si los dos integrantes completan juntos.
      </p>
      {msg && <p className="text-xs text-[#00f5c8]">{msg}</p>}
      {lastCode && (
        <p className="font-mono text-lg text-[#bf5fff]">
          Código invitación: <span className="text-white">{lastCode}</span>
        </p>
      )}

      <section className="rounded-2xl border border-[#00f5c8]/30 bg-[#0f1020] p-4 space-y-3 neon-border">
        <h2 className="font-display text-xs uppercase text-[#7a7da3]">Crear duelo</h2>
        <label className="text-[10px] text-[#7a7da3]">Duración (días)</label>
        <input
          type="number"
          min={1}
          max={7}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1"
        />
        <label className="text-[10px] text-[#7a7da3]">Compañero equipo A (id)</label>
        <select
          value={partnerA}
          onChange={(e) => setPartnerA(e.target.value)}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-2 text-sm"
        >
          <option value="">Elegí amigo…</option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.displayName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void createDuel()}
          className="w-full rounded-xl bg-[#00f5c8] py-2 font-display text-sm font-black text-black"
        >
          Crear e invitar
        </button>
      </section>

      <section className="rounded-2xl border border-[#bf5fff]/30 bg-[#0f1020] p-4 space-y-3 neon-border-magenta">
        <h2 className="font-display text-xs uppercase text-[#7a7da3]">Unirse con código</h2>
        <input
          value={invite}
          onChange={(e) => setInvite(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Código 6 dígitos"
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-2 font-mono"
        />
        <select
          value={partnerB}
          onChange={(e) => setPartnerB(e.target.value)}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-2 text-sm"
        >
          <option value="">Tu compañero equipo B</option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.displayName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void joinDuel()}
          className="w-full rounded-xl border border-[#bf5fff] py-2 font-display text-sm text-[#bf5fff]"
        >
          Unirse al duelo
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
        <h2 className="font-display text-xs uppercase text-[#7a7da3]">Misión competitiva</h2>
        <input
          value={duelId}
          onChange={(e) => setDuelId(e.target.value)}
          placeholder="ID del duelo (copiar abajo)"
          className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-2 text-xs font-mono"
        />
        <button
          type="button"
          disabled={compLoading}
          onClick={() => void genCompetitive()}
          className="w-full rounded-xl bg-white/10 py-2 text-sm disabled:opacity-50"
        >
          Generar misión 2vs2
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <h2 className="font-display text-xs uppercase text-[#7a7da3] mb-2">Tus duelos</h2>
        <ul className="space-y-3 text-xs">
          {duels.map((d) => {
            let summary = "";
            if (d.status === "ENDED") {
              const w = d.winnerTeam === 0 ? "Equipo A" : d.winnerTeam === 1 ? "Equipo B" : "Empate";
              summary = ` · Ganador: ${w} · Δ ${d.teamAXp} vs ${d.teamBXp} XP`;
            }
            return (
              <li key={d.id} className="border border-white/5 rounded-lg p-2">
                <p className="font-mono text-[10px] text-[#7a7da3] break-all">{d.id}</p>
                <p>
                  {d.status} · {d.durationDays}d{summary}
                </p>
                {d.invitedCode6 && d.status === "PENDING" && <p className="text-[#bf5fff]">Código: {d.invitedCode6}</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
