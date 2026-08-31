"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { writeAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { startWorkflowsForTrigger, scheduleAppointmentReminders, enqueueJob } from "@/lib/queue";
import { Agency, SubAccount } from "@/models/agency";
import { Contact, Pipeline, Opportunity, Task, Note } from "@/models/crm";
import { Form, Funnel, Site } from "@/models/funnel";
import { Calendar, Appointment } from "@/models/calendar";
import { Workflow } from "@/models/workflow";
import { Plan, Subscription } from "@/models/billing";
import { AdAccount, AdCampaign } from "@/models/ads";
import { Course, CommunityPost } from "@/models/course";
import { AiBotConfig } from "@/models/ai";
import { encryptAtRest } from "@/lib/crypto";
import { completeChat } from "@/lib/services/openai";
import { recordUsage } from "@/lib/usage";

export async function switchLocationAction(formData: FormData) {
  const locationId = String(formData.get("locationId") || "");
  cookies().set("locationId", locationId, { path: "/", httpOnly: false });
  revalidatePath("/", "layout");
}

export async function createContactAction(formData: FormData) {
  const { ctx, agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const contact = await Contact.create({
    agencyId,
    subAccountId,
    name: String(formData.get("name") || "New lead"),
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    tags: String(formData.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    source: String(formData.get("source") || "manual"),
  });
  await writeAudit(ctx, "contact.create", String(contact._id));
  await startWorkflowsForTrigger({
    trigger: "lead.captured",
    agencyId,
    subAccountId,
    contactId: String(contact._id),
  });
  revalidatePath("/contacts");
  redirect(`/contacts/${contact._id}`);
}

export async function addNoteAction(formData: FormData) {
  const { ctx, agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const contactId = String(formData.get("contactId"));
  await Note.create({
    agencyId,
    subAccountId,
    contactId,
    authorId: ctx.userId,
    body: String(formData.get("body") || ""),
  });
  revalidatePath(`/contacts/${contactId}`);
}

export async function addTaskAction(formData: FormData) {
  const { ctx, agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  await Task.create({
    agencyId,
    subAccountId,
    contactId: formData.get("contactId") || undefined,
    title: String(formData.get("title") || "Task"),
    dueDate: formData.get("dueDate") ? new Date(String(formData.get("dueDate"))) : undefined,
    assigneeId: ctx.userId,
  });
  revalidatePath("/tasks");
  const contactId = formData.get("contactId");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

export async function toggleTaskAction(formData: FormData) {
  await getActiveLocation();
  await connectDB();
  const id = String(formData.get("taskId"));
  const task = await Task.findById(id);
  if (task) {
    task.status = task.status === "done" ? "open" : "done";
    await task.save();
  }
  revalidatePath("/tasks");
}

export async function moveOpportunityAction(formData: FormData) {
  const { ctx, agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const id = String(formData.get("opportunityId"));
  const stageId = String(formData.get("stageId"));
  const status = String(formData.get("status") || "open") as "open" | "won" | "lost";
  const opp = await Opportunity.findOne({ _id: id, subAccountId });
  if (!opp) return;
  const before = { stageId: opp.stageId, status: opp.status };
  opp.stageId = stageId;
  opp.status = status;
  await opp.save();
  await writeAudit(ctx, "opportunity.move", id, before, { stageId, status });
  if (status === "won") {
    await startWorkflowsForTrigger({
      trigger: "opportunity.won",
      agencyId,
      subAccountId,
      contactId: String(opp.contactId),
    });
  }
  revalidatePath("/pipeline");
}

export async function createOpportunityAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const pipeline = await Pipeline.findOne({ subAccountId });
  if (!pipeline) return;
  await Opportunity.create({
    agencyId,
    subAccountId,
    pipelineId: pipeline._id,
    stageId: pipeline.stages[0]?.id,
    contactId: String(formData.get("contactId")),
    title: String(formData.get("title") || "Deal"),
    value: Number(formData.get("value") || 0),
  });
  revalidatePath("/pipeline");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const id = String(formData.get("appointmentId"));
  const status = String(formData.get("status"));
  const appt = await Appointment.findOne({ _id: id, subAccountId });
  if (!appt) return;
  appt.status = status;
  await appt.save();
  if (status === "completed") {
    await startWorkflowsForTrigger({
      trigger: "appointment.completed",
      agencyId,
      subAccountId,
      contactId: appt.contactId ? String(appt.contactId) : undefined,
    });
  }
  if (status === "no_show") {
    await startWorkflowsForTrigger({
      trigger: "appointment.no_show",
      agencyId,
      subAccountId,
      contactId: appt.contactId ? String(appt.contactId) : undefined,
    });
  }
  revalidatePath("/calendar");
}

export async function createWorkflowAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  await Workflow.create({
    agencyId,
    subAccountId,
    name: String(formData.get("name") || "New workflow"),
    trigger: String(formData.get("trigger") || "lead.captured"),
    active: true,
    steps: [
      {
        type: "message",
        channel: String(formData.get("channel") || "sms"),
        delaySeconds: Number(formData.get("delaySeconds") || 0),
        template: String(formData.get("template") || "Hi {{name}}, thanks for reaching out."),
        subject: String(formData.get("subject") || "Following up"),
      },
    ],
  });
  revalidatePath("/workflows");
}

export async function addWorkflowStepAction(formData: FormData) {
  await getActiveLocation();
  await connectDB();
  const workflow = await Workflow.findById(String(formData.get("workflowId")));
  if (!workflow) return;
  workflow.steps.push({
    type: "message",
    channel: String(formData.get("channel") || "email"),
    delaySeconds: Number(formData.get("delaySeconds") || 0),
    template: String(formData.get("template") || ""),
    subject: String(formData.get("subject") || ""),
  });
  await workflow.save();
  revalidatePath("/workflows");
}

export async function toggleWorkflowAction(formData: FormData) {
  await getActiveLocation();
  await connectDB();
  const wf = await Workflow.findById(String(formData.get("workflowId")));
  if (wf) {
    wf.active = !wf.active;
    await wf.save();
  }
  revalidatePath("/workflows");
}

export async function saveFunnelAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const name = String(formData.get("name") || "Funnel");
  const slug = slugify(String(formData.get("slug") || name)) + "-" + Date.now().toString(36);
  const form = await Form.create({
    agencyId,
    subAccountId,
    name: `${name} form`,
    schema: [
      { id: "name", label: "Name", type: "text", required: true },
      { id: "email", label: "Email", type: "email", required: true },
      { id: "phone", label: "Phone", type: "tel", required: false },
    ],
  });
  await Funnel.create({
    agencyId,
    subAccountId,
    name,
    slug,
    steps: [
      {
        slug: "welcome",
        name: "Welcome",
        type: "form",
        formId: form._id,
        content: {
          headline: String(formData.get("headline") || "Get the guide"),
          body: String(formData.get("body") || "Leave your details and we will follow up."),
        },
        variants: [
          { id: "a", name: "Control", weight: 70, content: {} },
          { id: "b", name: "Variant", weight: 30, content: {} },
        ],
        analytics: { views: 0, conversions: 0 },
      },
    ],
  });
  revalidatePath("/funnels");
}

export async function saveSiteAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const name = String(formData.get("name") || "Site");
  await Site.create({
    agencyId,
    subAccountId,
    name,
    slug: slugify(name) + "-" + Date.now().toString(36),
    nav: [
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog" },
    ],
    pages: [
      {
        slug: "home",
        title: name,
        body: String(formData.get("body") || "Welcome to our site."),
        seoTitle: name,
        seoDescription: String(formData.get("seoDescription") || ""),
      },
    ],
    blogPosts: [
      {
        slug: "hello",
        title: "Hello from the studio",
        excerpt: "First post",
        body: String(formData.get("postBody") || "Published thoughts."),
        status: "published",
        publishedAt: new Date(),
      },
    ],
  });
  revalidatePath("/sites");
}

export async function saveBrandingAction(formData: FormData) {
  const { ctx, agencyId } = await getActiveLocation();
  await connectDB();
  const agency = await Agency.findById(agencyId);
  if (!agency) return;
  const before = agency.branding;
  agency.branding = {
    ...agency.branding,
    logoUrl: String(formData.get("logoUrl") || "") || undefined,
    primaryColor: String(formData.get("primaryColor") || agency.branding?.primaryColor),
    accentColor: String(formData.get("accentColor") || agency.branding?.accentColor),
    domain: String(formData.get("domain") || "") || undefined,
    senderName: String(formData.get("senderName") || agency.name),
    senderEmail: String(formData.get("senderEmail") || "") || undefined,
    smsNumber: String(formData.get("smsNumber") || "") || undefined,
  };
  await agency.save();
  await writeAudit(ctx, "branding.update", agencyId, before, agency.branding);
  revalidatePath("/settings");
}

export async function saveReviewLinksAction(formData: FormData) {
  const { sub } = await getActiveLocation();
  sub.googleReviewUrl = String(formData.get("googleReviewUrl") || "") || undefined;
  sub.facebookReviewUrl = String(formData.get("facebookReviewUrl") || "") || undefined;
  await sub.save();
  revalidatePath("/reviews");
}

export async function createPlanAction(formData: FormData) {
  const { ctx, agencyId } = await getActiveLocation();
  await connectDB();
  const plan = await Plan.create({
    agencyId,
    name: String(formData.get("name") || "Starter"),
    price: Number(formData.get("price") || 0),
    interval: String(formData.get("interval") || "month"),
    features: { funnels: true, workflows: true },
  });
  await writeAudit(ctx, "plan.create", String(plan._id));
  revalidatePath("/billing");
}

export async function assignPlanAction(formData: FormData) {
  const { ctx, agencyId, subAccountId, sub } = await getActiveLocation();
  await connectDB();
  const planId = String(formData.get("planId"));
  sub.planId = new Types.ObjectId(planId);
  sub.status = "active";
  await sub.save();
  await Subscription.findOneAndUpdate(
    { subAccountId },
    {
      agencyId,
      subAccountId,
      planId,
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    },
    { upsert: true },
  );
  await writeAudit(ctx, "subscription.assign", subAccountId, undefined, { planId });
  revalidatePath("/billing");
}

export async function saveMarkupAction(formData: FormData) {
  const { ctx, agencyId, sub } = await getActiveLocation();
  await connectDB();
  const scope = String(formData.get("scope") || "agency");
  const markup = {
    sms: Number(formData.get("sms") || 0),
    email: Number(formData.get("email") || 0),
    ai: Number(formData.get("ai") || 0),
  };
  if (scope === "location") {
    sub.usageMarkup = markup;
    await sub.save();
  } else {
    await Agency.findByIdAndUpdate(agencyId, { usageMarkup: markup });
  }
  await writeAudit(ctx, "usage.markup", scope, undefined, markup);
  revalidatePath("/usage");
}

export async function connectAdAccountAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const provider = String(formData.get("provider") || "meta") as "meta" | "google";
  const account = await AdAccount.findOneAndUpdate(
    { subAccountId, provider },
    {
      agencyId,
      subAccountId,
      provider,
      accountId: String(formData.get("accountId") || "demo"),
      accountName: String(formData.get("accountName") || `${provider} ads`),
      oauthTokens: encryptAtRest("mock-refresh-token"),
      connected: true,
    },
    { upsert: true, new: true },
  );
  const existing = await AdCampaign.countDocuments({ adAccountId: account._id });
  if (!existing) {
    await AdCampaign.create({
      agencyId,
      subAccountId,
      adAccountId: account._id,
      name: "Lead gen — search",
      spend: 124000,
      leadsCount: 37,
      pipelineValue: 890000,
      syncedAt: new Date(),
    });
  }
  revalidatePath("/ads");
}

export async function saveCourseAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const title = String(formData.get("title") || "New course");
  await Course.create({
    agencyId,
    subAccountId,
    title,
    slug: slugify(title) + "-" + Date.now().toString(36),
    description: String(formData.get("description") || ""),
    priceType: String(formData.get("priceType") || "free"),
    price: Number(formData.get("price") || 0),
    modules: [
      {
        title: "Getting started",
        lessons: [
          { title: "Welcome", type: "text", body: "Welcome to the course." },
          { title: "First lesson", type: "text", body: "Here is the first lesson." },
        ],
      },
    ],
  });
  revalidatePath("/courses");
}

export async function addCommunityPostAction(formData: FormData) {
  const { ctx, agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  await CommunityPost.create({
    agencyId,
    subAccountId,
    courseId: formData.get("courseId") || undefined,
    authorId: ctx.userId,
    authorName: "Team",
    title: String(formData.get("title") || "Post"),
    body: String(formData.get("body") || ""),
  });
  revalidatePath("/courses");
}

export async function saveBotConfigAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  await AiBotConfig.findOneAndUpdate(
    { subAccountId },
    {
      agencyId,
      subAccountId,
      persona: String(formData.get("persona") || ""),
      qualifyingScript: String(formData.get("qualifyingScript") || ""),
      brandVoice: String(formData.get("brandVoice") || ""),
      channelsEnabled: ["web", "sms", "messenger"],
    },
    { upsert: true },
  );
  revalidatePath("/ai");
}

export async function generateContentAction(formData: FormData) {
  const { agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const kind = String(formData.get("kind") || "email");
  const prompt = String(formData.get("prompt") || "");
  const config = await AiBotConfig.findOne({ subAccountId });
  const result = await completeChat([
    {
      role: "system",
      content: `You write ${kind} drafts. Brand voice: ${config?.brandVoice || "professional and warm"}. Return only the draft.`,
    },
    { role: "user", content: prompt },
  ]);
  await recordUsage({
    agencyId,
    subAccountId,
    type: "ai",
    quantity: Math.max(1, Math.round((result.tokens || 40) / 1000)),
    meta: { kind },
  });
  return result.content;
}

export async function createCalendarAction(formData: FormData) {
  const { ctx, agencyId, subAccountId } = await getActiveLocation();
  await connectDB();
  const name = String(formData.get("name") || "Consults");
  await Calendar.create({
    agencyId,
    subAccountId,
    ownerUserId: ctx.userId,
    name,
    slug: slugify(name) + "-" + Date.now().toString(36),
    slotDuration: Number(formData.get("slotDuration") || 30),
    bufferMinutes: 0,
    availabilityRules: [
      { weekday: 1, start: "09:00", end: "17:00" },
      { weekday: 2, start: "09:00", end: "17:00" },
      { weekday: 3, start: "09:00", end: "17:00" },
      { weekday: 4, start: "09:00", end: "17:00" },
      { weekday: 5, start: "09:00", end: "17:00" },
    ],
  });
  revalidatePath("/calendar");
}

export async function enqueueMissedCallTestAction() {
  const { agencyId, subAccountId } = await getActiveLocation();
  await enqueueJob({
    type: "missed_call.textback",
    runAt: new Date(),
    agencyId,
    subAccountId,
    payload: { from: "+15555550100", body: "Sorry we missed your call — how can we help?" },
  });
  revalidatePath("/workflows");
}

export { scheduleAppointmentReminders };
