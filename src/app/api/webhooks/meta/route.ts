export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Contact, Opportunity, Pipeline } from "@/models/crm";
import { AdAccount, AdCampaign } from "@/models/ads";
import { startWorkflowsForTrigger } from "@/lib/queue";
import { Job } from "@/models/job";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const eventId = String(body.entry?.[0]?.id || body.id || `meta-${Date.now()}`);
  await connectDB();
  const dup = await Job.findOne({ providerEventId: eventId });
  if (dup) return NextResponse.json({ ok: true, deduped: true });
  await Job.create({ type: "workflow.step", status: "done", providerEventId: eventId, payload: { source: "meta" } });

  const lead = body.entry?.[0]?.changes?.[0]?.value || body.lead || {};
  const email = lead.email || lead.field_data?.find?.((f: { name: string }) => f.name === "email")?.values?.[0];
  const name = lead.full_name || lead.name || "Ad lead";
  const phone = lead.phone_number || lead.phone;
  const account = await AdAccount.findOne({ provider: "meta" });
  if (!account) return NextResponse.json({ ok: true });

  const contact = await Contact.create({
    agencyId: account.agencyId,
    subAccountId: account.subAccountId,
    name,
    email,
    phone,
    source: "meta_lead_ad",
    campaignId: lead.campaign_id,
  });

  const pipeline = await Pipeline.findOne({ subAccountId: account.subAccountId });
  if (pipeline) {
    await Opportunity.create({
      agencyId: account.agencyId,
      subAccountId: account.subAccountId,
      pipelineId: pipeline._id,
      stageId: pipeline.stages[0]?.id,
      contactId: contact._id,
      title: "Meta lead",
      adCampaignId: (await AdCampaign.findOne({ adAccountId: account._id }))?._id,
    });
  }

  await startWorkflowsForTrigger({
    trigger: "lead.captured",
    agencyId: String(account.agencyId),
    subAccountId: String(account.subAccountId),
    contactId: String(contact._id),
  });

  return NextResponse.json({ ok: true });
}
