import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";
import { newApiToken } from "@/lib/users/api-token";

const nanoUser = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const digits6 = customAlphabet("0123456789", 6);

async function uniqueSocialCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = digits6();
    const exists = await prisma.user.findUnique({ where: { socialCode6: code } });
    if (!exists) return code;
  }
  throw new Error("No se pudo generar código social único");
}

export async function createUser(displayName?: string) {
  const username = `agente_${nanoUser()}`;
  const socialCode6 = await uniqueSocialCode();
  return prisma.user.create({
    data: {
      displayName: displayName?.trim() || "Jugador",
      username,
      socialCode6,
      apiToken: newApiToken(),
    },
  });
}
