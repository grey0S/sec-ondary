import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { weekKeyUTC } from "@/lib/game/week-key";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const weekStart = weekKeyUTC();
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: uid }, { addresseeId: uid }],
    },
  });

  const friendIds = new Set<string>();
  for (const f of friendships) {
    friendIds.add(f.requesterId === uid ? f.addresseeId : f.requesterId);
  }
  friendIds.add(uid);

  const ids = [...friendIds];

  const completions = await prisma.missionCompletion.groupBy({
    by: ["userId"],
    where: {
      userId: { in: ids },
      completedAt: { gte: start, lt: end },
    },
    _sum: { xpReceived: true },
  });

  const users = await prisma.user.findMany({ where: { id: { in: ids } } });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  const ranking = completions
    .map((c) => ({
      userId: c.userId,
      weeklyXp: c._sum.xpReceived ?? 0,
      displayName: byId[c.userId]?.displayName ?? "?",
      username: byId[c.userId]?.username ?? "?",
      isYou: c.userId === uid,
    }))
    .sort((a, b) => b.weeklyXp - a.weeklyXp);

  return NextResponse.json({ weekStart, ranking });
}
