export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Contact } from "@/models/crm";
import { Message } from "@/models/workflow";
import { SubAccount } from "@/models/agency";
import { enqueueJob, startWorkflowsForTrigger, processDueJobs } from "@/lib/queue";
import { validateTwilioSignature } from "@/lib/services/twilio";

export async function POST(req: Request) {
  const form = await req.formData();
  const params = Object.fromEntries(form.entries()) as Record<string, string>;
  const signature = req.headers.get("x-twilio-signature") || undefined;
  if (!validateTwilioSignature(req.url, params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  await connectDB();
  const from = params.From || params.from || "";
  const body = (params.Body || params.body || "").trim();
  const callStatus = (params.CallStatus || params.DialCallStatus || "").toLowerCase();
  const eventId = params.CallSid || params.MessageSid || `${from}-${Date.now()}`;

  const sub = await SubAccount.findOne({
    $or: [{ "branding.smsNumber": params.To }, {}],
  }).sort({ createdAt: 1 });
  if (!sub) return NextResponse.json({ ok: true });

  if (["no-answer", "busy", "failed", "canceled"].includes(callStatus)) {
    await enqueueJob({
      type: "missed_call.textback",
      runAt: new Date(),
      agencyId: String(sub.agencyId),
      subAccountId: String(sub._id),
      providerEventId: eventId,
      payload: { from, body: "Sorry we missed your call — how can we help?" },
    });
    await startWorkflowsForTrigger({
      trigger: "missed_call",
      agencyId: String(sub.agencyId),
      subAccountId: String(sub._id),
    });
    await processDueJobs(5);
    return NextResponse.json({ ok: true });
  }

  if (!from) return NextResponse.json({ ok: true });

  let contact = await Contact.findOne({ subAccountId: sub._id, phone: from });
  if (!contact) {
    contact = await Contact.create({
      agencyId: sub.agencyId,
      subAccountId: sub._id,
      name: `SMS ${from.slice(-4)}`,
      phone: from,
      source: "sms",
    });
  }

  if (/^stop$/i.test(body)) {
    contact.optedOut = true;
    await contact.save();
  }

  await Message.create({
    agencyId: sub.agencyId,
    subAccountId: sub._id,
    contactId: contact._id,
    channel: "sms",
    direction: "inbound",
    body,
    providerMessageId: eventId,
    status: "delivered",
  });

  return new NextResponse("<Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
