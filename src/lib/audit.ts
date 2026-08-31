import { AuditLog } from "@/models/job";
import type { TenantContext } from "@/types";

export async function writeAudit(
  ctx: Partial<TenantContext>,
  action: string,
  target?: string,
  before?: unknown,
  after?: unknown,
) {
  await AuditLog.create({
    agencyId: ctx.agencyId || undefined,
    subAccountId: ctx.subAccountId || undefined,
    userId: ctx.userId || undefined,
    action,
    target,
    before,
    after,
  });
}
