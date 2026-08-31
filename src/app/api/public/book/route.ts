export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { connectDB } from "@/lib/db";
import { Calendar, Appointment } from "@/models/calendar";
import { Contact } from "@/models/crm";
import { scheduleAppointmentReminders, startWorkflowsForTrigger, processDueJobs } from "@/lib/queue";

export async function POST(req: Request) {
  const body = await req.json();
  const slug = String(body.slug || "");
  const startIso = String(body.start || "");
  const name = String(body.name || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const phone = String(body.phone || "").trim();
  if (!slug || !startIso || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectDB();
  const calendar = await Calendar.findOne({ slug });
  if (!calendar) return NextResponse.json({ error: "Calendar not found" }, { status: 404 });

  const startTime = new Date(startIso);
  const endTime = addMinutes(startTime, calendar.slotDuration);
  const clash = await Appointment.findOne({
    calendarId: calendar._id,
    status: { $nin: ["canceled"] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });
  if (clash) return NextResponse.json({ error: "Slot taken" }, { status: 409 });

  let contact = email
    ? await Contact.findOne({ subAccountId: calendar.subAccountId, email })
    : null;
  if (!contact) {
    contact = await Contact.create({
      agencyId: calendar.agencyId,
      subAccountId: calendar.subAccountId,
      name,
      email,
      phone,
      source: "booking",
    });
  }

  const appointment = await Appointment.create({
    agencyId: calendar.agencyId,
    subAccountId: calendar.subAccountId,
    calendarId: calendar._id,
    contactId: contact._id,
    guestName: name,
    guestEmail: email,
    guestPhone: phone,
    startTime,
    endTime,
    status: "booked",
  });

  await startWorkflowsForTrigger({
    trigger: "appointment.created",
    agencyId: String(calendar.agencyId),
    subAccountId: String(calendar.subAccountId),
    contactId: String(contact._id),
  });
  await scheduleAppointmentReminders(String(appointment._id));
  await processDueJobs(10);

  return NextResponse.json({ ok: true, appointmentId: String(appointment._id) });
}
