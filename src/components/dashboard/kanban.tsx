"use client";

import { useState, useTransition } from "react";
import { moveOpportunityAction } from "@/app/(dashboard)/actions";

type CardItem = {
  id: string;
  title: string;
  value: number;
  contactName: string;
  status: string;
};

type Column = { id: string; name: string; cards: CardItem[] };

export function KanbanBoard({ columns }: { columns: Column[] }) {
  const [cols, setCols] = useState(columns);
  const [, startTransition] = useTransition();

  function onDrop(stageId: string, opportunityId: string) {
    setCols((prev) => {
      const moving = prev.flatMap((c) => c.cards).find((c) => c.id === opportunityId);
      if (!moving) return prev;
      return prev.map((col) => ({
        ...col,
        cards:
          col.id === stageId
            ? [...col.cards.filter((c) => c.id !== opportunityId), moving]
            : col.cards.filter((c) => c.id !== opportunityId),
      }));
    });
    const form = new FormData();
    form.set("opportunityId", opportunityId);
    form.set("stageId", stageId);
    const won = stageId.toLowerCase().includes("won");
    form.set("status", won ? "won" : "open");
    startTransition(() => {
      void moveOpportunityAction(form);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {cols.map((col) => (
        <div
          key={col.id}
          className="w-72 shrink-0 rounded-xl bg-slate-100 p-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const id = e.dataTransfer.getData("text/plain");
            if (id) onDrop(col.id, id);
          }}
        >
          <div className="mb-3 flex items-center justify-between text-sm font-medium">
            <span>{col.name}</span>
            <span className="text-muted-foreground">{col.cards.length}</span>
          </div>
          <div className="space-y-2">
            {col.cards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
                className="cursor-grab rounded-lg border bg-white p-3 shadow-sm"
              >
                <div className="font-medium">{card.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{card.contactName}</div>
                <div className="mt-2 text-sm">${(card.value / 100).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
