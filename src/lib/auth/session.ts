import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "secondary_uid";

export async function getSessionUserId(): Promise<string | null> {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token.length > 0) {
      const u = await prisma.user.findFirst({
        where: { apiToken: token },
        select: { id: true },
      });
      if (u) return u.id;
    }
  }

  const jar = await cookies();
  const v = jar.get(SESSION_COOKIE)?.value;
  return v && v.length > 0 ? v : null;
}

export async function setSessionUserId(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
}
