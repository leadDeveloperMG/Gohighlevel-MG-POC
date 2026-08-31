"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Day = { date: string; label: string; slots: { start: string; label: string }[] };

export function BookingForm({ slug, days }: { slug: string; days: Day[] }) {
  const [start, setStart] = useState(days[0]?.slots[0]?.start || "");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/public/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        start,
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
      }),
    });
    if (!res.ok) {
      setError("That slot is no longer available.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p className="mt-8 rounded-lg bg-emerald-50 p-4 text-emerald-800">Booked. Check your inbox or phone for confirmation.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="space-y-3">
        {days.map((day) => (
          <div key={day.date}>
            <div className="text-sm font-medium">{day.label}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {day.slots.length === 0 ? (
                <span className="text-xs text-muted-foreground">No openings</span>
              ) : null}
              {day.slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setStart(slot.start)}
                  className={`rounded-md border px-3 py-1 text-sm ${start === slot.start ? "bg-primary text-white" : "bg-white"}`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Input name="name" required placeholder="Name" />
      <Input name="email" type="email" required placeholder="Email" />
      <Input name="phone" placeholder="Phone" />
      <Button type="submit" disabled={!start}>
        Confirm booking
      </Button>
    </form>
  );
}
