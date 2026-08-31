import { NextResponse } from "next/server";

export function assertCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  const header = req.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
