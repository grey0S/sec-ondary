import { NextResponse } from "next/server";
import { setSessionUserId } from "@/lib/auth/session";
import { createUser } from "@/lib/users/bootstrap";

export async function POST(req: Request) {
  let displayName: string | undefined;
  let native = false;
  try {
    const body = (await req.json()) as { displayName?: string; platform?: string };
    displayName = body.displayName;
    native = body.platform === "ios" || body.platform === "native";
  } catch {
    /* empty */
  }
  const user = await createUser(displayName);
  if (!native) {
    await setSessionUserId(user.id);
  }
  return NextResponse.json({ user, apiToken: user.apiToken });
}
