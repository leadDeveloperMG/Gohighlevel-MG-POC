import { ROLE_RANK, type Role, type TenantContext } from "@/types";

export function hasMinRole(role: Role, min: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export function canAccessAgency(ctx: TenantContext, agencyId: string) {
  if (ctx.role === "super_admin") return true;
  return ctx.agencyId === agencyId;
}

export function canAccessSubAccount(
  ctx: TenantContext,
  agencyId: string,
  subAccountId?: string,
) {
  if (!canAccessAgency(ctx, agencyId)) return false;
  if (hasMinRole(ctx.role, "agency_staff")) return true;
  if (!subAccountId) return false;
  return ctx.subAccountId === subAccountId;
}

export function assertTenant(
  ctx: TenantContext,
  agencyId: string,
  subAccountId?: string,
) {
  if (!canAccessSubAccount(ctx, agencyId, subAccountId)) {
    throw new Error("Forbidden");
  }
}

export const NAV_BY_ROLE: Record<Role, string[]> = {
  super_admin: [
    "overview",
    "agencies",
    "contacts",
    "pipeline",
    "calendar",
    "workflows",
    "funnels",
    "sites",
    "courses",
    "ads",
    "reviews",
    "billing",
    "usage",
    "ai",
    "settings",
  ],
  agency_admin: [
    "overview",
    "contacts",
    "pipeline",
    "calendar",
    "workflows",
    "funnels",
    "sites",
    "courses",
    "ads",
    "reviews",
    "billing",
    "usage",
    "ai",
    "settings",
  ],
  agency_staff: [
    "overview",
    "contacts",
    "pipeline",
    "calendar",
    "workflows",
    "funnels",
    "sites",
    "courses",
    "ads",
    "reviews",
    "ai",
  ],
  subaccount_admin: [
    "overview",
    "contacts",
    "pipeline",
    "calendar",
    "workflows",
    "funnels",
    "sites",
    "courses",
    "ads",
    "reviews",
    "billing",
    "usage",
    "ai",
    "settings",
  ],
  subaccount_staff: [
    "overview",
    "contacts",
    "pipeline",
    "calendar",
    "tasks",
    "reviews",
  ],
};
