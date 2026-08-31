type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function completeChat(messages: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const last = messages.filter((m) => m.role === "user").at(-1)?.content || "";
    const reply = scriptedReply(last);
    return { ok: true, mocked: true, content: reply, tokens: 40 };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.4,
    }),
  });
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
    error?: { message?: string };
  };
  if (!res.ok) {
    return { ok: false, mocked: false, content: data.error?.message || "LLM error", tokens: 0 };
  }
  return {
    ok: true,
    mocked: false,
    content: data.choices?.[0]?.message?.content || "",
    tokens: data.usage?.total_tokens || 0,
  };
}

function scriptedReply(input: string) {
  const text = input.toLowerCase();
  if (text.includes("handoff") || text.includes("human") || text.includes("agent")) {
    return "I can connect you with a team member. Someone will follow up shortly.";
  }
  if (text.includes("book") || text.includes("appointment") || text.includes("schedule")) {
    return "I can book that. What day and time works best? Reply with something like Tuesday 2pm.";
  }
  if (/\b(mon|tue|wed|thu|fri|sat|sun|am|pm)\b/.test(text)) {
    return "Great — I can hold that slot. Reply YES to confirm the appointment.";
  }
  if (text.includes("yes") || text.includes("confirm")) {
    return "Confirmed. You will receive a reminder before your appointment.";
  }
  return "Thanks for reaching out. I can answer questions or book a time. What would you like to do?";
}
