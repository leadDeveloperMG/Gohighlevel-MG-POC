import { UsageLedger } from "@/models/billing";
import { Agency, SubAccount } from "@/models/agency";
import { periodKey } from "@/lib/utils";

const VENDOR_COST = { sms: 0.0079, email: 0.0008, ai: 0.002 } as const;

export async function recordUsage(input: {
  agencyId: string;
  subAccountId: string;
  type: "sms" | "email" | "ai";
  quantity?: number;
  meta?: Record<string, unknown>;
}) {
  const quantity = input.quantity ?? 1;
  const [agency, sub] = await Promise.all([
    Agency.findById(input.agencyId),
    SubAccount.findById(input.subAccountId),
  ]);
  const billed =
    sub?.usageMarkup?.[input.type] ??
    agency?.usageMarkup?.[input.type] ??
    VENDOR_COST[input.type] * 2;

  await UsageLedger.create({
    agencyId: input.agencyId,
    subAccountId: input.subAccountId,
    type: input.type,
    quantity,
    vendorCost: VENDOR_COST[input.type] * quantity,
    billedRate: billed * quantity,
    periodKey: periodKey(),
    meta: input.meta || {},
  });
}
