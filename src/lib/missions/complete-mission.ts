import type { Mission, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DUEL_WIN_BONUS_XP,
  streakMultiplier,
  splitXpEvenly,
  URGENT_XP_MULTIPLIER,
} from "@/lib/game/xp-ranks";
import { addDaysUtc, utcDayString } from "@/lib/time/utc-day";

function parseIds(json: string): string[] {
  try {
    const a = JSON.parse(json) as unknown;
    return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseTeam(json: string): string[] {
  const a = parseIds(json);
  return a.slice(0, 2);
}

export type CompleteMissionInput = {
  missionId: string;
  creatorUserId: string;
  participantIds: string[];
  memoryPhotoDataUrl?: string | null;
  reactionEmoji?: string | null;
};

export async function completeMission(input: CompleteMissionInput) {
  const { missionId, creatorUserId, participantIds, memoryPhotoDataUrl, reactionEmoji } = input;

  const unique = [...new Set(participantIds)].filter(Boolean);
  if (unique.length === 0) throw new Error("Participantes requeridos");

  return prisma.$transaction(async (tx) => {
    const mission = await tx.mission.findFirst({
      where: { id: missionId, creatorUserId, completedAt: null },
    });
    if (!mission) throw new Error("Misión no encontrada o ya completada");

    if (mission.urgentDeadlineAt && mission.urgentDeadlineAt < new Date()) {
      throw new Error("La misión urgente expiró");
    }
    if (mission.expiresAt < new Date()) throw new Error("La misión expiró");

    if (!unique.includes(creatorUserId)) throw new Error("El creador debe participar");

    if (unique.length < mission.minParticipants || unique.length > mission.maxParticipants) {
      throw new Error("Cantidad de participantes no válida para esta misión");
    }

    if (mission.difficulty === "EXPLOSIVE" && unique.length < 2) {
      throw new Error("La Misión Explosiva solo se completa en grupo");
    }

    const isSolo = unique.length === 1;

    if (mission.competitiveDuelId) {
      const duel = await tx.duel.findUnique({ where: { id: mission.competitiveDuelId } });
      if (!duel || duel.status !== "ACTIVE" || !duel.endsAt || duel.endsAt < new Date()) {
        throw new Error("Duelo no activo");
      }
      const teamA = parseTeam(duel.teamAUserIds);
      const teamB = parseTeam(duel.teamBUserIds);
      const set = new Set(unique);
      const fullA = teamA.length === 2 && teamA.every((id) => set.has(id));
      const fullB = teamB.length === 2 && teamB.every((id) => set.has(id));
      if (!fullA && !fullB) {
        throw new Error("En modo 2vs2 ambos jugadores del mismo equipo deben completar juntos");
      }
    }

    const urgentMult = mission.kind === "URGENT" ? URGENT_XP_MULTIPLIER : 1;
    const basePool = Math.round(mission.baseXp * urgentMult);

    const users = await tx.user.findMany({ where: { id: { in: unique } } });
    if (users.length !== unique.length) throw new Error("Participante inválido");

    const xpShares = splitXpEvenly(basePool, unique.length);

    const today = utcDayString();

    const updates: { user: User; xpGain: number; idx: number }[] = [];

    for (let i = 0; i < unique.length; i++) {
      const uid = unique[i];
      const user = users.find((u) => u.id === uid)!;
      let mult = 1;
      if (isSolo) mult *= streakMultiplier(user.soloStreak);
      else mult *= streakMultiplier(user.groupStreak);

      const xpGain = Math.max(1, Math.round(xpShares[i] * mult));
      updates.push({ user, xpGain, idx: i });
    }

    await tx.mission.update({
      where: { id: mission.id },
      data: {
        completedAt: new Date(),
        participantIds: JSON.stringify(unique),
        memoryPhotoDataUrl: memoryPhotoDataUrl ?? undefined,
        reactionEmoji: reactionEmoji ?? undefined,
      },
    });

    for (const { user, xpGain } of updates) {
      let soloStreak = user.soloStreak;
      let groupStreak = user.groupStreak;
      let lastSolo = user.lastSoloMissionDay;
      let lastGroup = user.lastGroupMissionDay;
      const soloBest = user.soloStreakBest;
      const groupBest = user.groupStreakBest;

      if (isSolo) {
        if (lastSolo !== today) {
          if (lastSolo && lastSolo === addDaysUtc(today, -1)) soloStreak += 1;
          else soloStreak = 1;
          lastSolo = today;
        }
      } else {
        if (lastGroup !== today) {
          if (lastGroup && lastGroup === addDaysUtc(today, -1)) groupStreak += 1;
          else groupStreak = 1;
          lastGroup = today;
        }
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          xp: user.xp + xpGain,
          soloStreak,
          groupStreak,
          lastSoloMissionDay: lastSolo,
          lastGroupMissionDay: lastGroup,
          soloStreakBest: Math.max(soloBest, soloStreak),
          groupStreakBest: Math.max(groupBest, groupStreak),
        },
      });

      await tx.missionCompletion.create({
        data: {
          missionId: mission.id,
          userId: user.id,
          xpReceived: xpGain,
          wasSolo: isSolo,
          wasUrgent: mission.kind === "URGENT",
          wasExplosive: mission.difficulty === "EXPLOSIVE",
        },
      });
    }

    if (mission.competitiveDuelId) {
      const duel = await tx.duel.findUnique({ where: { id: mission.competitiveDuelId } });
      if (duel && duel.status === "ACTIVE") {
        const teamA = parseTeam(duel.teamAUserIds);
        const teamB = parseTeam(duel.teamBUserIds);
        const set = new Set(unique);
        const teamAXpAdd = teamA.length === 2 && teamA.every((id) => set.has(id)) ? basePool : 0;
        const teamBXpAdd = teamB.length === 2 && teamB.every((id) => set.has(id)) ? basePool : 0;
        await tx.duel.update({
          where: { id: duel.id },
          data: {
            teamAXp: duel.teamAXp + teamAXpAdd,
            teamBXp: duel.teamBXp + teamBXpAdd,
          },
        });
      }
    }

    return { mission, participants: unique, xpByUser: Object.fromEntries(updates.map((u) => [u.user.id, u.xpGain])) };
  });
}

export async function finalizeDuelsIfEnded() {
  const now = new Date();
  const duels = await prisma.duel.findMany({
    where: { status: "ACTIVE", endsAt: { lt: now } },
  });
  for (const d of duels) {
    let winnerTeam: number | null = null;
    if (d.teamAXp > d.teamBXp) winnerTeam = 0;
    else if (d.teamBXp > d.teamAXp) winnerTeam = 1;
    const teamA = parseTeam(d.teamAUserIds);
    const bonusIds = winnerTeam === 0 ? teamA : winnerTeam === 1 ? parseTeam(d.teamBUserIds) : [];
    await prisma.duel.update({
      where: { id: d.id },
      data: { status: "ENDED", winnerTeam },
    });
    if (bonusIds.length) {
      const badgeId = `duel_win_${d.id.slice(0, 8)}`;
      for (const uid of bonusIds) {
        const u = await prisma.user.findUnique({ where: { id: uid } });
        if (!u) continue;
        let badges: string[] = [];
        try {
          badges = JSON.parse(u.victoryBadges) as string[];
        } catch {
          badges = [];
        }
        if (!badges.includes(badgeId)) badges.push(badgeId);
        await prisma.user.update({
          where: { id: uid },
          data: {
            xp: u.xp + DUEL_WIN_BONUS_XP,
            victoryBadges: JSON.stringify(badges),
          },
        });
      }
    }
  }
}
