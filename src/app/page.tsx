"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DIFFICULTY_LABEL } from "@/lib/labels";
import { ShareMissionCard, captureShareCard } from "@/components/ShareMissionCard";
import type { DifficultyKey } from "@/lib/labels";

type MissionKind = "NORMAL" | "URGENT" | "COMPETITIVE";

type Mission = {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyKey;
  baseXp: number;
  minParticipants: number;
  maxParticipants: number;
  kind: MissionKind;
  urgentDeadlineAt: string | null;
  expiresAt: string;
  completedAt: string | null;
};

type Friend = { id: string; displayName: string; username: string };

export default function HomePage() {
  const [me, setMe] = useState<{
    user: { id: string; displayName: string; xp: number; soloStreak: number; groupStreak: number };
    level: number;
    rank: { name: string };
  } | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [urgent, setUrgent] = useState<Mission | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelFlash, setLevelFlash] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  const [completeFor, setCompleteFor] = useState<Mission | null>(null);
  const [selectedP, setSelectedP] = useState<Record<string, boolean>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [reaction, setReaction] = useState("⚡");
  const [shareXp, setShareXp] = useState<number | null>(null);
  const [shareTitle, setShareTitle] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [mRes, uRes, fRes] = await Promise.all([
      fetch("/api/missions/active", { credentials: "include" }),
      fetch("/api/me", { credentials: "include" }),
      fetch("/api/friends", { credentials: "include" }),
    ]);
    if (mRes.ok) {
      const j = (await mRes.json()) as { missions: Mission[]; urgent: Mission | null };
      setMissions(j.missions);
      setUrgent(j.urgent ?? null);
    }
    if (uRes.ok) setMe(await uRes.json());
    if (fRes.ok) {
      const fj = (await fRes.json()) as { friends: Friend[] };
      setFriends(fj.friends);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetch("/api/missions/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      }).catch(() => null);
      await refresh();
    })();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const urgentLeft = useMemo(() => {
    if (!urgent?.urgentDeadlineAt) return null;
    const end = new Date(urgent.urgentDeadlineAt).getTime();
    return Math.max(0, end - nowTick);
  }, [urgent, nowTick]);

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const onGenerate = async (opts: { urgent?: boolean; explosive?: boolean }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/missions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          context,
          urgent: opts.urgent,
          explosiveOnly: opts.explosive,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setToast((e as { error?: string }).error ?? "Error al generar");
        return;
      }
      setToast(opts.urgent ? "¡Misión urgente lista!" : "Nueva misión desbloqueada");
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const openComplete = (m: Mission) => {
    setCompleteFor(m);
    const init: Record<string, boolean> = {};
    if (me) init[me.user.id] = true;
    friends.forEach((f) => {
      init[f.id] = false;
    });
    setSelectedP(init);
    setPhoto(null);
    setReaction("⚡");
  };

  const toggleP = (id: string) => {
    setSelectedP((p) => ({ ...p, [id]: !p[id] }));
  };

  const submitComplete = async () => {
    if (!completeFor || !me) return;
    const ids = Object.entries(selectedP)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const prevLevel = me.level;
    const res = await fetch(`/api/missions/${completeFor.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        participantIds: ids,
        memoryPhotoDataUrl: photo,
        reactionEmoji: reaction,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setToast((j as { error?: string }).error ?? "No se pudo completar");
      return;
    }
    const xpYou = (j as { xpByUser?: Record<string, number> }).xpByUser?.[me.user.id] ?? 0;
    setCompleteFor(null);
    setToast("¡Misión completada! XP otorgada.");
    setShareTitle(completeFor.title);
    setShareXp(xpYou);
    await refresh();
    const uRes = await fetch("/api/me", { credentials: "include" });
    if (uRes.ok) {
      const nu = await uRes.json();
      setMe(nu);
      if (nu.level > prevLevel) {
        setLevelFlash(true);
        setTimeout(() => setLevelFlash(false), 2000);
      }
    }
  };

  const onShareImage = async () => {
    const blob = await captureShareCard();
    if (!blob || !shareTitle) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sec-ondary-mision.png";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Tarjeta descargada. Súbela a Instagram o TikTok desde tu galería.");
  };

  const dailyMission = missions.find((m) => m.kind === "NORMAL");

  return (
    <div className="space-y-6 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-white">
            sec<span className="text-[#00f5c8]">·</span>ondary
          </h1>
          <p className="text-xs text-[#7a7da3] mt-1 uppercase tracking-[0.2em]">Misiones secundarias IA</p>
        </div>
        {me && (
          <div className="text-right">
            <p className="font-display text-[#bf5fff] text-sm font-bold">Nv. {me.level}</p>
            <p className="text-[10px] text-[#7a7da3]">{me.rank.name}</p>
            <p className="text-xs text-[#00f5c8]">{me.user.xp} XP</p>
          </div>
        )}
      </header>

      <AnimatePresence>
        {levelFlash && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-4 top-24 z-[60] mx-auto max-w-sm rounded-2xl border border-[#bf5fff]/60 bg-black/80 px-4 py-3 text-center font-display text-[#00f5c8] neon-border-magenta animate-level-pop"
          >
            ¡Subiste de nivel!
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <button
          type="button"
          onClick={() => setToast(null)}
          className="w-full text-left rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#e8e9ff]"
        >
          {toast}
        </button>
      )}

      <section className="rounded-2xl border border-[#ff3d7a]/40 bg-[#ff3d7a]/5 p-4 neon-border-magenta">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[#ff3d7a] uppercase tracking-widest">Misión urgente</h2>
          {urgentLeft != null && <span className="font-mono text-lg text-white">{formatMs(urgentLeft)}</span>}
        </div>
        {urgent ? (
          <div className="mt-3 space-y-2">
            <p className="font-display text-white font-bold leading-snug">{urgent.title}</p>
            <p className="text-sm text-[#b9bcd6]">{urgent.description}</p>
            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-[#7a7da3]">
              <span>Bonus XP</span>
              <span>{DIFFICULTY_LABEL[urgent.difficulty]}</span>
            </div>
            <button
              type="button"
              onClick={() => openComplete(urgent)}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#ff3d7a] to-[#bf5fff] py-2.5 font-display text-sm font-bold text-white"
            >
              Completar
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-[#7a7da3]">No hay misión urgente activa. Generá una nueva (24h).</p>
            <button
              type="button"
              disabled={loading}
              onClick={() => onGenerate({ urgent: true })}
              className="w-full rounded-xl border border-[#ff3d7a]/60 py-2 font-display text-sm text-[#ff3d7a] disabled:opacity-50"
            >
              Generar urgente
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#00f5c8]/35 bg-[#0f1020]/80 p-4 neon-border">
        <h2 className="font-display text-sm font-bold text-[#00f5c8] uppercase tracking-widest">Misión del día</h2>
        {dailyMission ? (
          <div className="mt-3 space-y-2">
            <p className="font-display text-lg font-bold text-white">{dailyMission.title}</p>
            <p className="text-sm text-[#b9bcd6]">{dailyMission.description}</p>
            <p className="text-[10px] text-[#7a7da3] uppercase">
              {DIFFICULTY_LABEL[dailyMission.difficulty]} · expira en 7 días
            </p>
            <button
              type="button"
              onClick={() => openComplete(dailyMission)}
              className="mt-2 w-full rounded-xl bg-[#00f5c8]/20 border border-[#00f5c8]/50 py-2.5 font-display text-sm font-bold text-[#00f5c8]"
            >
              Completar
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#7a7da3]">Generando misión diaria…</p>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label className="block text-[10px] uppercase tracking-widest text-[#7a7da3]">Contexto para la IA</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Ej: en casa un domingo lluvioso, de noche, en el shopping…"
          rows={3}
          className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-[#5c5f7a] outline-none focus:border-[#00f5c8]/50"
        />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onGenerate({})}
            className="rounded-xl bg-gradient-to-r from-[#00f5c8] to-[#2ad1ff] py-3 font-display text-sm font-black text-black disabled:opacity-50"
          >
            Nueva misión aleatoria
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onGenerate({ explosive: true })}
            className="rounded-xl border border-[#bf5fff] py-2.5 font-display text-xs font-bold text-[#bf5fff] disabled:opacity-50"
          >
            Pedir misión explosiva (grupo)
          </button>
        </div>
      </section>

      {missions.filter((m) => m !== dailyMission && m !== urgent).length > 0 && (
        <section className="space-y-2">
          <h3 className="font-display text-xs uppercase tracking-widest text-[#7a7da3]">Otras activas</h3>
          {missions
            .filter((m) => m !== dailyMission && m !== urgent)
            .map((m) => (
              <div key={m.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="font-display text-sm font-bold text-white">{m.title}</p>
                <p className="text-xs text-[#7a7da3] line-clamp-2">{m.description}</p>
                <button
                  type="button"
                  onClick={() => openComplete(m)}
                  className="mt-2 text-xs text-[#00f5c8] underline-offset-2 hover:underline"
                >
                  Completar
                </button>
              </div>
            ))}
        </section>
      )}

      {me && shareTitle != null && shareXp != null && (
        <section className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
          <p className="font-display text-xs uppercase text-[#7a7da3]">Compartir en redes</p>
          <div className="flex justify-center">
            <ShareMissionCard
              missionTitle={shareTitle}
              xp={shareXp}
              level={me.level}
              includePhoto={photo}
            />
          </div>
          <button
            type="button"
            onClick={onShareImage}
            className="w-full rounded-xl bg-white/10 border border-white/20 py-2 text-sm"
          >
            Descargar tarjeta (Stories / TikTok)
          </button>
        </section>
      )}

      {completeFor && me && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#00f5c8]/40 bg-[#0a0b16] p-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-bold text-white mb-2">Completar misión</h3>
            <p className="text-xs text-[#7a7da3] mb-3">{completeFor.title}</p>
            <p className="text-[10px] uppercase text-[#7a7da3] mb-1">Participantes</p>
            <div className="space-y-2 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!selectedP[me.user.id]} onChange={() => toggleP(me.user.id)} />
                Tú ({me.user.displayName})
              </label>
              {friends.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!selectedP[f.id]} onChange={() => toggleP(f.id)} />
                  {f.displayName}
                </label>
              ))}
            </div>
            <p className="text-[10px] uppercase text-[#7a7da3] mb-1">Reacción rápida</p>
            <input
              value={reaction}
              onChange={(e) => setReaction(e.target.value.slice(0, 4))}
              className="mb-3 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-lg"
            />
            <p className="text-[10px] uppercase text-[#7a7da3] mb-1">Foto recuerdo (opcional)</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const r = new FileReader();
                r.onload = () => setPhoto(typeof r.result === "string" ? r.result : null);
                r.readAsDataURL(file);
              }}
              className="mb-3 w-full text-xs"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCompleteFor(null)}
                className="flex-1 rounded-xl border border-white/20 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submitComplete()}
                className="flex-1 rounded-xl bg-[#00f5c8] py-2 text-sm font-bold text-black"
              >
                Aprobar y ganar XP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
