import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });

  const completions = await prisma.missionCompletion.findMany({
    where: { userId: uid },
    orderBy: { completedAt: "desc" },
    take: 40,
    include: {
      mission: true,
    },
  });

  return NextResponse.json({
    history: completions.map((c) => ({
      id: c.id,
      xpReceived: c.xpReceived,
      completedAt: c.completedAt,
      wasSolo: c.wasSolo,
      wasUrgent: c.wasUrgent,
      wasExplosive: c.wasExplosive,
      mission: {
        title: c.mission.title,
        description: c.mission.description,
        memoryPhotoDataUrl: c.mission.memoryPhotoDataUrl,
        reactionEmoji: c.mission.reactionEmoji,
      },
    })),
  });
}
