export const dynamic = "force-dynamic";

import { addDays } from "date-fns";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Appointment, Calendar } from "@/models/calendar";
import { availableSlots } from "@/lib/slots";
import { BookingForm } from "@/components/public/booking-form";

export default async function BookingPage({ params }: { params: { calendarSlug: string } }) {
  await connectDB();
  const calendar = await Calendar.findOne({ slug: params.calendarSlug }).lean();
  if (!calendar) notFound();
  const from = new Date();
  const to = addDays(from, 7);
  const busy = await Appointment.find({
    calendarId: calendar._id,
    status: { $nin: ["canceled"] },
    startTime: { $gte: from, $lte: to },
  }).lean();

  const days = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(from, i);
    return {
      date: date.toISOString(),
      label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      slots: availableSlots(
        date,
        calendar.availabilityRules || [],
        busy as unknown as { startTime: Date; endTime: Date }[],
        calendar.slotDuration,
        calendar.bufferMinutes,
      ).map((s) => ({ start: s.start.toISOString(), label: s.label })),
    };
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold">{calendar.name}</h1>
      <p className="mt-2 text-muted-foreground">{calendar.slotDuration}-minute sessions.</p>
      <BookingForm slug={calendar.slug} days={days} />
    </main>
  );
}
