import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Appointment, Calendar } from "@/models/calendar";
import { createCalendarAction, updateAppointmentStatusAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function CalendarPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const [calendars, appointments] = await Promise.all([
    Calendar.find({ subAccountId }).lean(),
    Appointment.find({ subAccountId }).sort({ startTime: -1 }).limit(40).lean(),
  ]);

  return (
    <div>
      <PageHeader title="Calendar" description="Availability calendars and appointment statuses." />
      <form action={createCalendarAction} className="mb-6 flex gap-2">
        <Input name="name" placeholder="Calendar name" required />
        <Input name="slotDuration" type="number" defaultValue={30} className="w-28" />
        <Button type="submit">Create calendar</Button>
      </form>
      <div className="mb-6 flex flex-wrap gap-2">
        {calendars.map((cal) => (
          <Link
            key={String(cal._id)}
            href={`/book/${cal.slug}`}
            className="rounded-md border bg-white px-3 py-2 text-sm"
            target="_blank"
          >
            Public book · {cal.name}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        {appointments.map((a) => (
          <div key={String(a._id)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-4 py-3">
            <div>
              <div className="font-medium">{a.guestName || "Guest"}</div>
              <div className="text-xs text-muted-foreground">{formatDateTime(a.startTime)}</div>
            </div>
            <Badge tone={a.status === "completed" ? "success" : a.status === "no_show" ? "danger" : "default"}>
              {a.status}
            </Badge>
            <form action={updateAppointmentStatusAction} className="flex gap-2">
              <input type="hidden" name="appointmentId" value={String(a._id)} />
              <select name="status" className="h-9 rounded-md border px-2 text-sm" defaultValue={a.status}>
                <option value="booked">booked</option>
                <option value="confirmed">confirmed</option>
                <option value="completed">completed</option>
                <option value="no_show">no_show</option>
                <option value="canceled">canceled</option>
              </select>
              <Button size="sm" type="submit">
                Update
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
