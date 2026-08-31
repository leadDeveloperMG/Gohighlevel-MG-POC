"use client";

import { useState } from "react";
import { generateContentAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ContentStudio() {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function onGenerate(formData: FormData) {
    setBusy(true);
    const result = await generateContentAction(formData);
    setDraft(result || "");
    setBusy(false);
  }

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <form action={onGenerate} className="grid gap-2">
        <select name="kind" className="h-9 rounded-md border px-3 text-sm">
          <option value="email">Email copy</option>
          <option value="social">Social post</option>
          <option value="review">Review response</option>
        </select>
        <Textarea name="prompt" required placeholder="Describe what you need" />
        <Button type="submit" disabled={busy}>
          {busy ? "Generating…" : "Generate draft"}
        </Button>
      </form>
      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Editable draft — nothing is published automatically." />
      <p className="text-xs text-muted-foreground">
        Publish/send is always a separate explicit action in this phase.
      </p>
    </div>
  );
}
