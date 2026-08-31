import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { SubAccount } from "@/models/agency";
import { requireTenant, resolveWorkingSubAccount } from "@/lib/session";
import { assertTenant } from "@/lib/rbac";

export async function getActiveLocation() {
  const ctx = await requireTenant();
  await connectDB();
  const preferred = cookies().get("locationId")?.value;
  const subAccountId = await resolveWorkingSubAccount(ctx, preferred);
  if (!subAccountId) {
    throw new Error("No sub-account available");
  }
  const sub = await SubAccount.findById(subAccountId);
  if (!sub) throw new Error("Sub-account not found");
  const agencyId = String(sub.agencyId);
  assertTenant({ ...ctx, agencyId: ctx.agencyId || agencyId }, agencyId, subAccountId);
  return {
    ctx: { ...ctx, agencyId: ctx.agencyId || agencyId, subAccountId },
    sub,
    agencyId,
    subAccountId,
  };
}
