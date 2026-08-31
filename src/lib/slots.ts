import { addMinutes, format, isBefore, startOfDay } from "date-fns";

type Rule = { weekday: number; start: string; end: string };
type Busy = { startTime: Date; endTime: Date };

export function availableSlots(
  date: Date,
  rules: Rule[],
  busy: Busy[],
  slotDuration: number,
  bufferMinutes = 0,
) {
  const weekday = date.getDay();
  const rule = rules.find((r) => r.weekday === weekday);
  if (!rule) return [];
  const [sh, sm] = rule.start.split(":").map(Number);
  const [eh, em] = rule.end.split(":").map(Number);
  const day = startOfDay(date);
  let cursor = new Date(day);
  cursor.setHours(sh, sm, 0, 0);
  const end = new Date(day);
  end.setHours(eh, em, 0, 0);
  const now = new Date();
  const slots: { start: Date; end: Date; label: string }[] = [];

  while (isBefore(addMinutes(cursor, slotDuration), addMinutes(end, 1))) {
    const slotEnd = addMinutes(cursor, slotDuration);
    const overlaps = busy.some(
      (b) => cursor < new Date(b.endTime) && slotEnd > new Date(b.startTime),
    );
    if (!overlaps && cursor > now) {
      slots.push({
        start: new Date(cursor),
        end: slotEnd,
        label: format(cursor, "h:mm a"),
      });
    }
    cursor = addMinutes(cursor, slotDuration + bufferMinutes);
  }
  return slots;
}
