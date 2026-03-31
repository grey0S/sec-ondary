import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const rows = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: uid }, { addresseeId: uid }],
    },
    include: {
      requester: true,
      addressee: true,
    },
  });

  const friends = rows.map((f) => {
    const other = f.requesterId === uid ? f.addressee : f.requester;
    return {
      id: other.id,
      displayName: other.displayName,
      username: other.username,
      socialCode6: other.socialCode6,
      xp: other.xp,
    };
  });

  return NextResponse.json({ friends });
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const body = (await req.json()) as { socialCode6?: string };
  const code = body.socialCode6?.replace(/\D/g, "").slice(0, 6);
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Código de 6 dígitos requerido" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { socialCode6: code } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.id === uid) {
    return NextResponse.json({ error: "No puedes agregarte a ti mismo" }, { status: 400 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: uid, addresseeId: target.id },
        { requesterId: target.id, addresseeId: uid },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return NextResponse.json({ friendship: existing, already: true });
    }
    const updated = await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ friendship: updated });
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: uid, addresseeId: target.id, status: "ACCEPTED" },
  });

  return NextResponse.json({ friendship });
}
