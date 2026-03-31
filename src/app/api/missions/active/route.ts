import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { finalizeDuelsIfEnded } from "@/lib/missions/complete-mission";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  await finalizeDuelsIfEnded();

  const now = new Date();
  const missions = await prisma.mission.findMany({
    where: {
      creatorUserId: uid,
      completedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  const urgent = missions.find((m) => m.kind === "URGENT");
  const daily = missions.find((m) => m.kind === "NORMAL");

  return NextResponse.json({ missions, urgent, daily: daily ?? null });
}
