"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EnrollButton({ courseId, priceType }: { courseId: string; priceType: string }) {
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/public/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        name: form.get("name"),
        email: form.get("email"),
      }),
    });
    setDone(true);
  }

  if (done) return <p className="mt-6 text-emerald-700">Enrolled. Lessons are unlocked for this email.</p>;

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-2 sm:flex-row">
      <Input name="name" required placeholder="Name" />
      <Input name="email" type="email" required placeholder="Email" />
      <Button type="submit">{priceType === "free" ? "Enroll free" : "Checkout"}</Button>
    </form>
  );
}
