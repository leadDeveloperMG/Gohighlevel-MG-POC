export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Contact } from "@/models/crm";
import { Funnel, Form } from "@/models/funnel";
import { startWorkflowsForTrigger, processDueJobs } from "@/lib/queue";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const funnelSlug = String(body.funnelSlug || "");
  const stepSlug = String(body.stepSlug || "");
  const name = String(body.name || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const phone = String(body.phone || "").trim();
  if (!funnelSlug || !name) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  await connectDB();
  const funnel = await Funnel.findOne({ slug: funnelSlug });
  if (!funnel) return NextResponse.json({ error: "Funnel not found" }, { status: 404 });

  const step = funnel.steps.find((s: { slug: string }) => s.slug === stepSlug);
  if (step) {
    step.analytics = step.analytics || { views: 0, conversions: 0 };
    step.analytics.conversions = (step.analytics.conversions || 0) + 1;
    funnel.markModified("steps");
    await funnel.save();
  }

  const query: Record<string, unknown> = { subAccountId: funnel.subAccountId };
  if (email) query.email = email;
  else if (phone) query.phone = phone;

  const contact = await Contact.findOneAndUpdate(
    query,
    {
      $setOnInsert: {
        agencyId: funnel.agencyId,
        subAccountId: funnel.subAccountId,
        name,
        source: "funnel",
        funnelId: funnel._id,
        campaignId: body.campaignId || undefined,
        utm: {
          source: body.utm_source,
          medium: body.utm_medium,
          campaign: body.utm_campaign,
          content: body.utm_content,
          term: body.utm_term,
        },
      },
      $set: { name, email: email || undefined, phone: phone || undefined },
      $addToSet: { tags: "funnel-lead" },
    },
    { upsert: true, new: true },
  );

  await startWorkflowsForTrigger({
    trigger: "lead.captured",
    agencyId: String(funnel.agencyId),
    subAccountId: String(funnel.subAccountId),
    contactId: String(contact._id),
  });

  await processDueJobs(10);

  if (step?.formId) {
    await Form.findById(step.formId);
  }

  return NextResponse.json({ ok: true, contactId: String(contact._id) });
}
