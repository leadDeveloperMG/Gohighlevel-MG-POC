export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { processDueJobs } from "@/lib/queue";
import { assertCron } from "@/lib/cron-auth";

export async function GET(req: Request) {
  const denied = assertCron(req);
  if (denied) return denied;
  await connectDB();
  const results = await processDueJobs(50);
  return NextResponse.json({ ok: true, processed: results.length, results });
}
