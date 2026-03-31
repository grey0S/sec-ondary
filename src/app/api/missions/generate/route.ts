import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateMissionWithAI, baseXpForPayload } from "@/lib/ai/generate-mission";

function parseTeam(json: string): string[] {
  try {
    const a = JSON.parse(json) as unknown;
    return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const body = (await req.json()) as {
    context?: string;
    urgent?: boolean;
    explosiveOnly?: boolean;
    competitive?: { duelId: string };
  };

  const context = typeof body.context === "string" ? body.context : "";
  const payload = await generateMissionWithAI(context, {
    urgent: body.urgent,
    explosiveOnly: body.explosiveOnly,
  });

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  if (payload.kind === "URGENT") {
    await prisma.mission.updateMany({
      where: { creatorUserId: uid, kind: "URGENT", completedAt: null },
      data: { completedAt: now },
    });
  }

  let competitiveDuelId: string | undefined;
  if (body.competitive?.duelId) {
    const duel = await prisma.duel.findUnique({ where: { id: body.competitive.duelId } });
    if (!duel || duel.status !== "ACTIVE") {
      return NextResponse.json({ error: "Duelo no disponible" }, { status: 400 });
    }
    const ends = duel.endsAt;
    if (!ends || ends < now) {
      return NextResponse.json({ error: "Duelo finalizado" }, { status: 400 });
    }
    const inDuel =
      duel.creatorId === uid ||
      parseTeam(duel.teamAUserIds).includes(uid) ||
      parseTeam(duel.teamBUserIds).includes(uid);
    if (!inDuel) {
      return NextResponse.json({ error: "No participas en este duelo" }, { status: 403 });
    }
    competitiveDuelId = duel.id;
  }

  const kind =
    competitiveDuelId != null ? "COMPETITIVE" : payload.kind === "URGENT" ? "URGENT" : "NORMAL";

  const mission = await prisma.mission.create({
    data: {
      creatorUserId: uid,
      title: payload.title,
      description: payload.description,
      difficulty: payload.difficulty,
      baseXp: baseXpForPayload(payload),
      minParticipants: competitiveDuelId ? Math.max(2, payload.minParticipants) : payload.minParticipants,
      maxParticipants: competitiveDuelId ? Math.max(2, payload.maxParticipants) : payload.maxParticipants,
      contextNote: context.slice(0, 200),
      kind,
      urgentDeadlineAt: kind === "URGENT" ? oneDay : null,
      expiresAt: kind === "URGENT" ? oneDay : sevenDays,
      competitiveDuelId,
    },
  });

  return NextResponse.json({ mission });
}
