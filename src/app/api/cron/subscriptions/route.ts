export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Subscription } from "@/models/billing";
import { SubAccount } from "@/models/agency";
import { assertCron } from "@/lib/cron-auth";

export async function GET(req: Request) {
  const denied = assertCron(req);
  if (denied) return denied;
  await connectDB();
  const pastDue = await Subscription.find({ status: "past_due" });
  let restricted = 0;
  for (const sub of pastDue) {
    const location = await SubAccount.findById(sub.subAccountId);
    if (!location) continue;
    const grace = location.graceUntil ? new Date(location.graceUntil).getTime() : 0;
    if (grace && grace < Date.now()) {
      location.status = "restricted";
      await location.save();
      restricted += 1;
    }
  }
  return NextResponse.json({ ok: true, checked: pastDue.length, restricted });
}
