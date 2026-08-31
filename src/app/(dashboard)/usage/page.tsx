import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { UsageLedger } from "@/models/billing";
import { Agency } from "@/models/agency";
import { saveMarkupAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { periodKey } from "@/lib/utils";

export default async function UsagePage() {
  const { agencyId, subAccountId, sub } = await getActiveLocation();
  await connectDB();
  const agency = await Agency.findById(agencyId);
  const key = periodKey();
  const rows = await UsageLedger.find({ subAccountId, periodKey: key }).sort({ createdAt: -1 }).limit(80).lean();
  const totals = rows.reduce(
    (acc, r) => {
      acc.vendor += r.vendorCost;
      acc.billed += r.billedRate;
      return acc;
    },
    { vendor: 0, billed: 0 },
  );

  return (
    <div>
      <PageHeader title="Usage ledger" description={`Period ${key}. Daily cron rolls these into Stripe invoice items when configured.`} />
      <div className="mb-4 text-sm text-muted-foreground">
        Vendor ${totals.vendor.toFixed(3)} · billed ${totals.billed.toFixed(3)}
      </div>
      <form action={saveMarkupAction} className="mb-6 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-5">
        <select name="scope" className="h-9 rounded-md border px-3 text-sm">
          <option value="agency">Agency markup</option>
          <option value="location">This location</option>
        </select>
        <Input name="sms" type="number" step="0.001" defaultValue={sub.usageMarkup?.sms ?? agency?.usageMarkup?.sms ?? 0.02} />
        <Input name="email" type="number" step="0.001" defaultValue={sub.usageMarkup?.email ?? agency?.usageMarkup?.email ?? 0.005} />
        <Input name="ai" type="number" step="0.001" defaultValue={sub.usageMarkup?.ai ?? agency?.usageMarkup?.ai ?? 0.02} />
        <Button type="submit">Save markup</Button>
      </form>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Vendor</th>
              <th className="px-4 py-2">Billed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r._id)} className="border-t">
                <td className="px-4 py-2 capitalize">{r.type}</td>
                <td className="px-4 py-2">{r.quantity}</td>
                <td className="px-4 py-2">${r.vendorCost.toFixed(4)}</td>
                <td className="px-4 py-2">${r.billedRate.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
