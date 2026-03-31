import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.shopItem.count();
  if (count > 0) return;

  const items = [
    { name: "Neón violeta", description: "Marco de perfil", type: "FRAME", costXp: 200, rotationSlot: 0 },
    { name: "Título: Caos controlado", description: "Título visible", type: "TITLE", costXp: 350, rotationSlot: 0 },
    { name: "Badge pixel", description: "Insignia retro", type: "BADGE", costXp: 150, rotationSlot: 0 },
    { name: "Aura glitch", description: "Efecto de perfil", type: "EFFECT", costXp: 500, rotationSlot: 1 },
    { name: "Rango decorativo: Nova", description: "Solo cosmético", type: "DECO_RANK", costXp: 400, rotationSlot: 1 },
    { name: "Sticker victoria", description: "Colección limitada", type: "BADGE", costXp: 280, rotationSlot: 2, seasonTag: "beta" },
  ];

  for (const it of items) {
    await prisma.shopItem.create({ data: it });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
