import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warn" | "danger" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        tone === "default" && "bg-teal-50 text-teal-800",
        tone === "success" && "bg-emerald-50 text-emerald-800",
        tone === "warn" && "bg-amber-50 text-amber-800",
        tone === "danger" && "bg-rose-50 text-rose-800",
        tone === "muted" && "bg-slate-100 text-slate-600",
        className,
      )}
      {...props}
    />
  );
}
