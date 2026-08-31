export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UsageLedger } from "@/models/billing";
import { periodKey } from "@/lib/utils";
import { assertCron } from "@/lib/cron-auth";

export async function GET(req: Request) {
  const denied = assertCron(req);
  if (denied) return denied;
  await connectDB();
  const key = periodKey();
  const rollup = await UsageLedger.aggregate([
    { $match: { periodKey: key } },
    {
      $group: {
        _id: { subAccountId: "$subAccountId", type: "$type" },
        quantity: { $sum: "$quantity" },
        vendorCost: { $sum: "$vendorCost" },
        billedRate: { $sum: "$billedRate" },
      },
    },
  ]);
  return NextResponse.json({
    ok: true,
    periodKey: key,
    items: rollup,
    note: "Attach these as Stripe invoice items when STRIPE_SECRET_KEY is set.",
  });
}
