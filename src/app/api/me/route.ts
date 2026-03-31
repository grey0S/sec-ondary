import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { rankForXp, xpToLevel } from "@/lib/game/xp-ranks";
import { ensureUserApiToken } from "@/lib/users/api-token";

const USERNAME_COOLDOWN_DAYS = 15;

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  const apiToken = await ensureUserApiToken(uid);
  const rank = rankForXp(user.xp);
  const level = xpToLevel(user.xp);
  return NextResponse.json({ user: { ...user, apiToken }, rank, level, apiToken });
}

export async function PATCH(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });
  const body = (await req.json()) as { displayName?: string; username?: string };
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const data: { displayName?: string; username?: string; usernameChangedAt?: Date } = {};

  if (typeof body.displayName === "string" && body.displayName.trim()) {
    data.displayName = body.displayName.trim().slice(0, 40);
  }

  if (typeof body.username === "string" && body.username.trim()) {
    const next = body.username.trim().slice(0, 24).replace(/\s+/g, "_");
    if (user.usernameChangedAt) {
      const elapsed = Date.now() - user.usernameChangedAt.getTime();
      const ms = USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      if (elapsed < ms) {
        const left = Math.ceil((ms - elapsed) / (24 * 60 * 60 * 1000));
        return NextResponse.json(
          { error: `Espera ${left} día(s) más para cambiar el nombre de usuario.` },
          { status: 400 },
        );
      }
    }
    const taken = await prisma.user.findFirst({
      where: { username: next, NOT: { id: uid } },
    });
    if (taken) return NextResponse.json({ error: "Nombre de usuario en uso" }, { status: 400 });
    data.username = next;
    data.usernameChangedAt = new Date();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: uid }, data });
  const apiToken = await ensureUserApiToken(uid);
  const rank = rankForXp(updated.xp);
  const level = xpToLevel(updated.xp);
  return NextResponse.json({ user: { ...updated, apiToken }, rank, level, apiToken });
}
