import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { finalizeDuelsIfEnded } from "@/lib/missions/complete-mission";

const digits6 = customAlphabet("0123456789", 6);

async function uniqueInvite(): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const c = digits6();
    const d = await prisma.duel.findFirst({ where: { invitedCode6: c } });
    if (!d) return c;
  }
  return digits6();
}

async function areFriends(a: string, b: string): Promise<boolean> {
  const f = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
  return !!f;
}

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  await finalizeDuelsIfEnded();

  const duels = await prisma.duel.findMany({
    where: {
      OR: [
        { creatorId: uid },
        { teamAUserIds: { contains: uid } },
        { teamBUserIds: { contains: uid } },
      ],
    },
    orderBy: { id: "desc" },
    take: 12,
  });

  return NextResponse.json({ duels });
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const body = (await req.json()) as { durationDays?: number; partnerId?: string };
  const durationDays = Math.min(7, Math.max(1, Math.floor(Number(body.durationDays) || 1)));
  const partnerId = body.partnerId;

  if (!partnerId) {
    return NextResponse.json({ error: "partnerId requerido (tu compañero de equipo)" }, { status: 400 });
  }
  if (partnerId === uid) {
    return NextResponse.json({ error: "El compañero no puede ser tu mismo usuario" }, { status: 400 });
  }

  if (!(await areFriends(uid, partnerId))) {
    return NextResponse.json({ error: "Debes ser amigo de tu compañero de equipo" }, { status: 400 });
  }

  const code = await uniqueInvite();
  const duel = await prisma.duel.create({
    data: {
      creatorId: uid,
      durationDays,
      teamAUserIds: JSON.stringify([uid, partnerId]),
      teamBUserIds: JSON.stringify([]),
      invitedCode6: code,
      status: "PENDING",
    },
  });

  return NextResponse.json({ duel, inviteCode: code });
}
