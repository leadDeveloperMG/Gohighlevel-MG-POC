export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Subscription } from "@/models/billing";
import { SubAccount } from "@/models/agency";
import { startWorkflowsForTrigger } from "@/lib/queue";
import { validateStripeSignature } from "@/lib/services/stripe";
import { Job } from "@/models/job";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!validateStripeSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw || "{}") as {
    id?: string;
    type?: string;
    data?: { object?: Record<string, unknown> };
  };

  await connectDB();
  if (event.id) {
    const dup = await Job.findOne({ providerEventId: event.id });
    if (dup) return NextResponse.json({ ok: true, deduped: true });
    await Job.create({
      type: "subscription.sync",
      status: "done",
      providerEventId: event.id,
      payload: { type: event.type },
    });
  }

  const obj = event.data?.object || {};
  const stripeSubId = String(obj.id || obj.subscription || "");
  const metadata = (obj.metadata || {}) as Record<string, string>;
  const subAccountId = metadata.subAccountId;

  if (event.type?.startsWith("customer.subscription") && (stripeSubId || subAccountId)) {
    const statusRaw = String(obj.status || "active");
    const status = ["active", "past_due", "canceled", "trialing"].includes(statusRaw)
      ? statusRaw
      : "active";
    const query = stripeSubId ? { stripeSubscriptionId: stripeSubId } : { subAccountId };
    const subscr = await Subscription.findOneAndUpdate(query, { status }, { new: true });
    if (subscr) {
      const location = await SubAccount.findById(subscr.subAccountId);
      if (location) {
        location.status = status === "past_due" ? "past_due" : status === "canceled" ? "canceled" : "active";
        if (status === "past_due") {
          location.graceUntil = new Date(Date.now() + 3 * 86400000);
          await startWorkflowsForTrigger({
            trigger: "payment.failed",
            agencyId: String(location.agencyId),
            subAccountId: String(location._id),
          });
        }
        await location.save();
      }
    }
  }

  return NextResponse.json({ ok: true });
}
