export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AiBotConfig, AiConversation } from "@/models/ai";
import { SubAccount } from "@/models/agency";
import { completeChat } from "@/lib/services/openai";
import { recordUsage } from "@/lib/usage";
import { startWorkflowsForTrigger } from "@/lib/queue";
import { Calendar, Appointment } from "@/models/calendar";
import { Contact } from "@/models/crm";
import { addMinutes } from "date-fns";

export async function POST(req: Request) {
  const body = await req.json();
  const message = String(body.message || "").trim();
  const subAccountId = String(body.subAccountId || "");
  if (!message) return NextResponse.json({ error: "Empty" }, { status: 400 });

  await connectDB();
  const sub = subAccountId
    ? await SubAccount.findById(subAccountId)
    : await SubAccount.findOne();
  if (!sub) return NextResponse.json({ error: "No location" }, { status: 404 });

  const config = await AiBotConfig.findOne({ subAccountId: sub._id });
  let convo = body.conversationId
    ? await AiConversation.findById(body.conversationId)
    : null;
  if (!convo) {
    convo = await AiConversation.create({
      agencyId: sub.agencyId,
      subAccountId: sub._id,
      channel: "web",
      messages: [],
    });
  }

  convo.messages.push({ role: "user", content: message, at: new Date() });
  const history = convo.messages.map((m: { role?: string; content?: string }) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content || "",
  }));

  const result = await completeChat([
    {
      role: "system",
      content: `${config?.persona || "Helpful assistant."}\n${config?.qualifyingScript || ""}\nIf the user says human/handoff, agree to escalate.`,
    },
    ...history,
  ]);

  const low = /handoff|human|agent/i.test(message) || !result.ok;
  if (low) convo.handoffFlag = true;
  convo.messages.push({
    role: "assistant",
    content: result.content,
    at: new Date(),
    lowConfidence: low,
  });
  await convo.save();

  await recordUsage({
    agencyId: String(sub.agencyId),
    subAccountId: String(sub._id),
    type: "ai",
    quantity: 1,
  });

  if (/\byes\b|confirm/i.test(message) && config?.calendarId) {
    const calendar = await Calendar.findById(config.calendarId);
    if (calendar) {
      const start = new Date(Date.now() + 86400000);
      start.setHours(10, 0, 0, 0);
      const contact = await Contact.create({
        agencyId: sub.agencyId,
        subAccountId: sub._id,
        name: "Chat lead",
        source: "ai-bot",
      });
      await Appointment.create({
        agencyId: sub.agencyId,
        subAccountId: sub._id,
        calendarId: calendar._id,
        contactId: contact._id,
        guestName: "Chat lead",
        startTime: start,
        endTime: addMinutes(start, calendar.slotDuration),
        status: "booked",
      });
      await startWorkflowsForTrigger({
        trigger: "appointment.created",
        agencyId: String(sub.agencyId),
        subAccountId: String(sub._id),
        contactId: String(contact._id),
      });
    }
  }

  return NextResponse.json({
    conversationId: String(convo._id),
    reply: result.content,
    handoff: convo.handoffFlag,
  });
}
