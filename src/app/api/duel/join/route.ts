import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const body = (await req.json()) as { inviteCode?: string; partnerId?: string };
  const code = body.inviteCode?.replace(/\D/g, "").slice(0, 6);
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Código de invitación inválido" }, { status: 400 });
  }
  if (!body.partnerId) {
    return NextResponse.json({ error: "partnerId requerido" }, { status: 400 });
  }
  if (body.partnerId === uid) {
    return NextResponse.json({ error: "Compañero inválido" }, { status: 400 });
  }

  if (!(await areFriends(uid, body.partnerId))) {
    return NextResponse.json({ error: "Debes ser amigo de tu compañero" }, { status: 400 });
  }

  const duel = await prisma.duel.findFirst({
    where: { invitedCode6: code, status: "PENDING" },
  });
  if (!duel) return NextResponse.json({ error: "Duelo no encontrado o ya iniciado" }, { status: 404 });

  const teamA = JSON.parse(duel.teamAUserIds) as string[];
  if (teamA.includes(uid) || teamA.includes(body.partnerId)) {
    return NextResponse.json({ error: "No puedes unirte a tu propio equipo" }, { status: 400 });
  }

  const now = new Date();
  const ends = new Date(now.getTime() + duel.durationDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.duel.update({
    where: { id: duel.id },
    data: {
      teamBUserIds: JSON.stringify([uid, body.partnerId]),
      status: "ACTIVE",
      startedAt: now,
      endsAt: ends,
    },
  });

  return NextResponse.json({ duel: updated });
}
