import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { currentRotationSlot } from "@/lib/game/rotation";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const slot = currentRotationSlot() % 3;
  const items = await prisma.shopItem.findMany({
    where: { rotationSlot: slot },
    orderBy: { costXp: "asc" },
  });

  const purchases = await prisma.userPurchase.findMany({ where: { userId: uid } });
  const owned = new Set(purchases.map((p) => p.itemId));

  return NextResponse.json({
    rotationSlot: slot,
    items: items.map((i) => ({ ...i, owned: owned.has(i.id) })),
  });
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const body = (await req.json()) as { itemId?: string };
  if (!body.itemId) return NextResponse.json({ error: "itemId requerido" }, { status: 400 });

  const slot = currentRotationSlot() % 3;
  const item = await prisma.shopItem.findFirst({
    where: { id: body.itemId, rotationSlot: slot },
  });
  if (!item) return NextResponse.json({ error: "Ítem no disponible en esta rotación" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || user.xp < item.costXp) {
    return NextResponse.json({ error: "XP insuficiente" }, { status: 400 });
  }

  let inventory: string[] = [];
  try {
    inventory = JSON.parse(user.ownedInventory) as string[];
  } catch {
    inventory = [];
  }
  if (inventory.includes(item.id)) {
    return NextResponse.json({ error: "Ya posees este ítem" }, { status: 400 });
  }

  const cosmetic: { equippedTitle?: string; equippedFrame?: string } = {};
  if (item.type === "TITLE") cosmetic.equippedTitle = item.name;
  if (item.type === "FRAME") cosmetic.equippedFrame = item.name;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.userPurchase.create({ data: { userId: uid, itemId: item.id } });
      return tx.user.update({
        where: { id: uid },
        data: {
          xp: user.xp - item.costXp,
          ownedInventory: JSON.stringify([...inventory, item.id]),
          ...cosmetic,
        },
      });
    });
    return NextResponse.json({ ok: true, user: updated, item });
  } catch {
    return NextResponse.json({ error: "No se pudo completar la compra" }, { status: 400 });
  }
}
