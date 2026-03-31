import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const tokenAlphabet = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 48);

export function newApiToken(): string {
  return tokenAlphabet();
}

export async function ensureUserApiToken(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) throw new Error("Usuario no encontrado");
  if (u.apiToken) return u.apiToken;
  const apiToken = newApiToken();
  await prisma.user.update({ where: { id: userId }, data: { apiToken } });
  return apiToken;
}
