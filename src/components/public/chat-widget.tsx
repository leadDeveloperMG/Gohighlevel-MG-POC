"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatWidget({ subAccountId }: { subAccountId?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [input, setInput] = useState("");

  async function send() {
    if (!input.trim()) return;
    const next = [...messages, { role: "user" as const, content: input }];
    setMessages(next);
    setInput("");
    const res = await fetch("/api/public/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, conversationId, subAccountId }),
    });
    const data = await res.json();
    setConversationId(data.conversationId);
    setMessages([...next, { role: "assistant", content: data.reply }]);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="mb-2 w-80 rounded-xl border bg-white p-3 shadow-xl">
          <div className="mb-2 text-sm font-medium">Chat</div>
          <div className="mb-2 max-h-64 space-y-2 overflow-y-auto text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <span className="inline-block rounded-lg bg-slate-100 px-2 py-1">{m.content}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message" />
            <Button type="button" size="sm" onClick={send}>
              Send
            </Button>
          </div>
        </div>
      ) : null}
      <Button type="button" onClick={() => setOpen((v) => !v)}>
        {open ? "Close" : "Chat"}
      </Button>
    </div>
  );
}
