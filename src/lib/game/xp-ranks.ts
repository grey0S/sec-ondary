import type { Difficulty } from "@prisma/client";

export const BASE_XP: Record<Difficulty, number> = {
  VERY_EASY: 25,
  EASY: 45,
  MEDIUM: 85,
  HARD: 140,
  EXPLOSIVE: 340,
};

export const URGENT_XP_MULTIPLIER = 1.25;

export const DUEL_WIN_BONUS_XP = 120;

export type RankInfo = { id: string; name: string; minXp: number };

export const RANKS: RankInfo[] = [
  { id: "novato", name: "Novato", minXp: 0 },
  { id: "explorador", name: "Explorador", minXp: 400 },
  { id: "aventurero", name: "Aventurero", minXp: 1200 },
  { id: "heroe", name: "Héroe", minXp: 3500 },
  { id: "leyenda", name: "Leyenda", minXp: 9000 },
  { id: "mito", name: "Mito", minXp: 22000 },
  { id: "prime", name: "Sec·ondary Prime", minXp: 50000 },
];

export function xpToLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
}

export function rankForXp(xp: number): RankInfo {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) current = r;
  }
  return current;
}

/** Multiplicador por racha individual o grupal (mismo algoritmo, contadores distintos). */
export function streakMultiplier(streakDays: number): number {
  if (streakDays <= 0) return 1;
  const bonus = Math.min(0.25, Math.floor(streakDays / 3) * 0.05);
  return 1 + bonus;
}

export function splitXpEvenly(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const rem = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}
