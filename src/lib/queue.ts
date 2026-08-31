import { Job } from "@/models/job";
import { Workflow, WorkflowRun, Message, Review } from "@/models/workflow";
import { Contact } from "@/models/crm";
import { Appointment, Calendar } from "@/models/calendar";
import { SubAccount } from "@/models/agency";
import { sendSms } from "@/lib/services/twilio";
import { sendEmail } from "@/lib/services/mail";
import { recordUsage } from "@/lib/usage";
import type { JobType } from "@/types";

type EnqueueInput = {
  type: JobType;
  runAt?: Date;
  agencyId?: string;
  subAccountId?: string;
  payload?: Record<string, unknown>;
  providerEventId?: string;
};

export async function enqueueJob(input: EnqueueInput) {
  if (input.providerEventId) {
    const existing = await Job.findOne({ providerEventId: input.providerEventId });
    if (existing) return existing;
  }
  return Job.create({
    type: input.type,
    runAt: input.runAt || new Date(),
    agencyId: input.agencyId,
    subAccountId: input.subAccountId,
    payload: input.payload || {},
    providerEventId: input.providerEventId,
  });
}

export async function processDueJobs(limit = 25) {
  const now = new Date();
  const jobs = await Job.find({ status: "pending", runAt: { $lte: now } })
    .sort({ runAt: 1 })
    .limit(limit);

  const results = [];
  for (const job of jobs) {
    job.status = "processing";
    job.attempts += 1;
    await job.save();
    try {
      await handleJob(job.type, job.payload as Record<string, unknown>, {
        agencyId: job.agencyId ? String(job.agencyId) : "",
        subAccountId: job.subAccountId ? String(job.subAccountId) : "",
      });
      job.status = "done";
      job.lastError = undefined;
    } catch (error) {
      job.status = job.attempts >= 5 ? "failed" : "pending";
      job.runAt = new Date(Date.now() + job.attempts * 30_000);
      job.lastError = error instanceof Error ? error.message : "Job failed";
    }
    await job.save();
    results.push({ id: String(job._id), status: job.status });
  }
  return results;
}

async function handleJob(
  type: string,
  payload: Record<string, unknown>,
  ids: { agencyId: string; subAccountId: string },
) {
  if (type === "workflow.step") {
    await executeWorkflowStep(payload);
    return;
  }
  if (type === "appointment.reminder") {
    await sendAppointmentReminder(payload);
    return;
  }
  if (type === "missed_call.textback") {
    await sendMissedCallText(payload, ids);
    return;
  }
}

function interpolate(template: string, contact: { name?: string; email?: string; phone?: string }, extra: Record<string, string> = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const map: Record<string, string> = {
      name: contact.name || "there",
      email: contact.email || "",
      phone: contact.phone || "",
      ...extra,
    };
    return map[key] ?? "";
  });
}

async function executeWorkflowStep(payload: Record<string, unknown>) {
  const run = await WorkflowRun.findById(payload.runId);
  const workflow = await Workflow.findById(payload.workflowId);
  if (!run || !workflow || run.status !== "running") return;

  const stepIndex = Number(payload.stepIndex || 0);
  const step = workflow.steps[stepIndex];
  if (!step) {
    run.status = "completed";
    await run.save();
    return;
  }

  const contact = run.contactId ? await Contact.findById(run.contactId) : null;
  if (contact?.optedOut) {
    run.status = "stopped";
    run.history.push({ stepIndex, status: "stopped", at: new Date(), detail: "Contact opted out" });
    await run.save();
    return;
  }

  const extra: Record<string, string> = {};
  if (payload.reviewLink) extra.reviewLink = String(payload.reviewLink);
  const contactFields = {
    name: contact?.name as string | undefined,
    email: contact?.email as string | undefined,
    phone: contact?.phone as string | undefined,
  };
  const body = interpolate(step.template || "", contactFields, extra);
  const fromName = payload.senderName ? String(payload.senderName) : undefined;

  let status = "sent";
  let providerMessageId = "";
  let detail = "";

  if (step.channel === "sms" && contact?.phone) {
    const result = await sendSms({ to: contact.phone, body });
    status = result.ok ? "sent" : "failed";
    providerMessageId = result.providerMessageId || "";
    detail = result.mocked ? "mocked" : result.error || "sent";
    if (result.ok) {
      await recordUsage({
        agencyId: String(workflow.agencyId),
        subAccountId: String(workflow.subAccountId),
        type: "sms",
      });
    }
  } else if (step.channel === "email" && contact?.email) {
    const result = await sendEmail({
      to: contact.email,
      subject: interpolate(step.subject || "A note for you", contactFields, extra),
      html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
      fromName,
    });
    status = result.ok ? "sent" : "failed";
    providerMessageId = result.providerMessageId || "";
    detail = result.mocked ? "mocked" : result.error || "sent";
    if (result.ok) {
      await recordUsage({
        agencyId: String(workflow.agencyId),
        subAccountId: String(workflow.subAccountId),
        type: "email",
      });
    }
  } else {
    status = "sent";
    detail = `${step.channel} queued (no recipient or channel stub)`;
    providerMessageId = `stub-${Date.now()}`;
  }

  await Message.create({
    agencyId: workflow.agencyId,
    subAccountId: workflow.subAccountId,
    contactId: contact?._id,
    channel: step.channel,
    direction: "outbound",
    body,
    subject: step.subject,
    providerMessageId,
    status,
  });

  run.history.push({ stepIndex, status, at: new Date(), detail });
  run.currentStep = stepIndex + 1;
  await run.save();

  const next = workflow.steps[stepIndex + 1];
  if (!next) {
    run.status = "completed";
    await run.save();
    return;
  }

  await enqueueJob({
    type: "workflow.step",
    runAt: new Date(Date.now() + (next.delaySeconds || 0) * 1000),
    agencyId: String(workflow.agencyId),
    subAccountId: String(workflow.subAccountId),
    payload: { ...payload, stepIndex: stepIndex + 1 },
  });
}

async function sendAppointmentReminder(payload: Record<string, unknown>) {
  const appointment = await Appointment.findById(payload.appointmentId);
  if (!appointment || appointment.status === "canceled") return;
  const contact = appointment.contactId ? await Contact.findById(appointment.contactId) : null;
  const when = new Date(appointment.startTime).toLocaleString();
  const body = `Reminder: your appointment is at ${when}. Reply STOP to opt out.`;

  if (contact?.phone && !contact.optedOut) {
    const result = await sendSms({ to: contact.phone, body });
    await Message.create({
      agencyId: appointment.agencyId,
      subAccountId: appointment.subAccountId,
      contactId: contact._id,
      channel: "sms",
      body,
      status: result.ok ? "sent" : "failed",
      providerMessageId: result.providerMessageId,
    });
    if (result.ok) {
      await recordUsage({
        agencyId: String(appointment.agencyId),
        subAccountId: String(appointment.subAccountId),
        type: "sms",
      });
    }
  }
  if (contact?.email && !contact.optedOut) {
    await sendEmail({
      to: contact.email,
      subject: "Appointment reminder",
      html: `<p>${body}</p>`,
    });
    await recordUsage({
      agencyId: String(appointment.agencyId),
      subAccountId: String(appointment.subAccountId),
      type: "email",
    });
  }
}

async function sendMissedCallText(
  payload: Record<string, unknown>,
  ids: { agencyId: string; subAccountId: string },
) {
  const phone = String(payload.from || "");
  if (!phone) return;
  let contact = await Contact.findOne({ subAccountId: ids.subAccountId, phone });
  if (!contact) {
    contact = await Contact.create({
      agencyId: ids.agencyId,
      subAccountId: ids.subAccountId,
      name: payload.name ? String(payload.name) : `Caller ${phone.slice(-4)}`,
      phone,
      source: "missed_call",
    });
  }
  if (contact.optedOut) return;

  const body = String(payload.body || "Sorry we missed your call! How can we help?");
  const result = await sendSms({ to: phone, body });
  await Message.create({
    agencyId: ids.agencyId,
    subAccountId: ids.subAccountId,
    contactId: contact._id,
    channel: "sms",
    body,
    status: result.ok ? "sent" : "failed",
    providerMessageId: result.providerMessageId,
  });
  if (result.ok) {
    await recordUsage({ agencyId: ids.agencyId, subAccountId: ids.subAccountId, type: "sms" });
  }
}

export async function startWorkflowsForTrigger(input: {
  trigger: string;
  agencyId: string;
  subAccountId: string;
  contactId?: string;
  extra?: Record<string, string>;
}) {
  const workflows = await Workflow.find({
    subAccountId: input.subAccountId,
    trigger: input.trigger,
    active: true,
  });

  const sub = await SubAccount.findById(input.subAccountId);
  const reviewLink = sub?.googleReviewUrl || sub?.facebookReviewUrl || "";

  for (const workflow of workflows) {
    const run = await WorkflowRun.create({
      agencyId: input.agencyId,
      subAccountId: input.subAccountId,
      workflowId: workflow._id,
      contactId: input.contactId,
      currentStep: 0,
      status: "running",
      history: [],
    });

    const first = workflow.steps[0];
    await enqueueJob({
      type: "workflow.step",
      runAt: new Date(Date.now() + (first?.delaySeconds || 0) * 1000),
      agencyId: input.agencyId,
      subAccountId: input.subAccountId,
      payload: {
        runId: String(run._id),
        workflowId: String(workflow._id),
        stepIndex: 0,
        reviewLink,
        senderName: sub?.name,
        ...input.extra,
      },
    });

    if (input.trigger === "opportunity.won" || input.trigger === "appointment.completed") {
      if (reviewLink) {
        await Review.create({
          agencyId: input.agencyId,
          subAccountId: input.subAccountId,
          contactId: input.contactId,
          platform: sub?.googleReviewUrl ? "google" : "facebook",
          requestSentAt: new Date(),
          link: reviewLink,
          token: String(run._id),
        });
      }
    }
  }
}

export async function scheduleAppointmentReminders(appointmentId: string) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return;
  const calendar = await Calendar.findById(appointment.calendarId);
  const start = new Date(appointment.startTime).getTime();
  for (const hours of [24, 1]) {
    const runAt = new Date(start - hours * 60 * 60 * 1000);
    if (runAt.getTime() > Date.now()) {
      await enqueueJob({
        type: "appointment.reminder",
        runAt,
        agencyId: String(appointment.agencyId),
        subAccountId: String(appointment.subAccountId),
        payload: { appointmentId, calendarId: String(calendar?._id), hours },
      });
    }
  }
}
