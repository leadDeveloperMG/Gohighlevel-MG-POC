"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  CalendarDays,
  Workflow,
  Layers,
  Globe,
  GraduationCap,
  Megaphone,
  Star,
  CreditCard,
  Gauge,
  Bot,
  Settings,
  Building2,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { NAV_BY_ROLE } from "@/lib/rbac";

const ITEMS: { href: string; key: string; label: string; icon: typeof Users }[] = [
  { href: "/overview", key: "overview", label: "Overview", icon: LayoutDashboard },
  { href: "/agencies", key: "agencies", label: "Agencies", icon: Building2 },
  { href: "/contacts", key: "contacts", label: "Contacts", icon: Users },
  { href: "/pipeline", key: "pipeline", label: "Pipeline", icon: Kanban },
  { href: "/tasks", key: "tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", key: "calendar", label: "Calendar", icon: CalendarDays },
  { href: "/workflows", key: "workflows", label: "Workflows", icon: Workflow },
  { href: "/funnels", key: "funnels", label: "Funnels", icon: Layers },
  { href: "/sites", key: "sites", label: "Sites", icon: Globe },
  { href: "/courses", key: "courses", label: "Courses", icon: GraduationCap },
  { href: "/ads", key: "ads", label: "Ads", icon: Megaphone },
  { href: "/reviews", key: "reviews", label: "Reviews", icon: Star },
  { href: "/billing", key: "billing", label: "Billing", icon: CreditCard },
  { href: "/usage", key: "usage", label: "Usage", icon: Gauge },
  { href: "/ai", key: "ai", label: "AI", icon: Bot },
  { href: "/settings", key: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  role,
  brandName,
}: {
  role: Role;
  brandName: string;
}) {
  const pathname = usePathname();
  const allowed = new Set(NAV_BY_ROLE[role] || NAV_BY_ROLE.subaccount_staff);

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-sm font-bold text-white">
          {brandName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <div className="text-sm font-semibold leading-tight">{brandName}</div>
          <div className="text-[11px] text-white/50">Operating system</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
        {ITEMS.filter((item) => allowed.has(item.key)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-white/70 hover:bg-sidebar-accent hover:text-white",
                active && "bg-sidebar-accent text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
