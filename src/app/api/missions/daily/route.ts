import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateMissionWithAI, baseXpForPayload } from "@/lib/ai/generate-mission";
import { utcDayString } from "@/lib/time/utc-day";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  let context = "";
  try {
    const body = (await req.json()) as { context?: string };
    context = typeof body.context === "string" ? body.context : "";
  } catch {
    /* optional body */
  }

  const today = utcDayString();
  const start = new Date(`${today}T00:00:00.000Z`);
  const end = new Date(`${today}T23:59:59.999Z`);

  const existing = await prisma.mission.findFirst({
    where: {
      creatorUserId: uid,
      kind: "NORMAL",
      createdAt: { gte: start, lte: end },
    },
  });
  if (existing) {
    return NextResponse.json({ mission: existing, reused: true });
  }

  const payload = await generateMissionWithAI(context || "un nuevo día para misiones con amigos", {});
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const mission = await prisma.mission.create({
    data: {
      creatorUserId: uid,
      title: payload.title,
      description: payload.description,
      difficulty: payload.difficulty,
      baseXp: baseXpForPayload(payload),
      minParticipants: payload.minParticipants,
      maxParticipants: payload.maxParticipants,
      contextNote: context.slice(0, 200),
      kind: "NORMAL",
      expiresAt: sevenDays,
    },
  });

  return NextResponse.json({ mission, reused: false });
}
