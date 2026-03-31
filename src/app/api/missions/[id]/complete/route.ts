import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { completeMission } from "@/lib/missions/complete-mission";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "No session" }, { status: 401 });
  const { id } = await ctx.params;

  const body = (await req.json()) as {
    participantIds?: string[];
    memoryPhotoDataUrl?: string | null;
    reactionEmoji?: string | null;
  };

  const participantIds = Array.isArray(body.participantIds) ? body.participantIds : [];

  try {
    const result = await completeMission({
      missionId: id,
      creatorUserId: uid,
      participantIds,
      memoryPhotoDataUrl: body.memoryPhotoDataUrl,
      reactionEmoji: body.reactionEmoji,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
