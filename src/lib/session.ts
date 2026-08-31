import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SubAccount } from "@/models/agency";
import type { Role, TenantContext } from "@/types";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireTenant(): Promise<TenantContext> {
  const session = await requireSession();
  const user = session.user;
  return {
    userId: user.id,
    role: user.role as Role,
    agencyId: user.agencyId || "",
    subAccountId: user.subAccountId,
  };
}

export async function resolveWorkingSubAccount(
  ctx: TenantContext,
  preferredId?: string,
) {
  await connectDB();
  if (ctx.subAccountId && ctx.role.startsWith("subaccount")) {
    return ctx.subAccountId;
  }

  if (preferredId) {
    const match = await SubAccount.findOne({
      _id: preferredId,
      ...(ctx.role === "super_admin" ? {} : { agencyId: ctx.agencyId }),
    });
    if (match) return String(match._id);
  }

  const first = await SubAccount.findOne(
    ctx.role === "super_admin" ? {} : { agencyId: ctx.agencyId },
  ).sort({ createdAt: 1 });
  return first ? String(first._id) : undefined;
}
