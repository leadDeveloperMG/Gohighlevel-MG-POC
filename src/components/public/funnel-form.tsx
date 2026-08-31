"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FunnelForm({
  funnelSlug,
  stepSlug,
  utm,
}: {
  funnelSlug: string;
  stepSlug: string;
  utm: Record<string, string | undefined>;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/forms/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        funnelSlug,
        stepSlug,
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        ...utm,
      }),
    });
    if (!res.ok) {
      setError("Could not submit. Try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p className="mt-8 rounded-lg bg-emerald-50 p-4 text-emerald-800">You are on the list. We will be in touch.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3 rounded-xl border bg-white p-5 shadow-sm">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Input name="name" required placeholder="Name" />
      <Input name="email" type="email" required placeholder="Email" />
      <Input name="phone" placeholder="Phone" />
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </form>
  );
}
