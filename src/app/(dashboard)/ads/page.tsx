import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { AdAccount, AdCampaign } from "@/models/ads";
import { connectAdAccountAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currency } from "@/lib/utils";

export default async function AdsPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const [accounts, campaigns] = await Promise.all([
    AdAccount.find({ subAccountId }).lean(),
    AdCampaign.find({ subAccountId }).lean(),
  ]);

  return (
    <div>
      <PageHeader
        title="Paid ads"
        description="Connect Meta or Google. Tokens are encrypted at rest. Live OAuth is used when app credentials exist."
      />
      <form action={connectAdAccountAction} className="mb-6 flex flex-wrap gap-2">
        <select name="provider" className="h-9 rounded-md border px-3 text-sm">
          <option value="meta">Meta</option>
          <option value="google">Google</option>
        </select>
        <Input name="accountId" placeholder="Ad account ID" />
        <Input name="accountName" placeholder="Account name" />
        <Button type="submit">Connect / sync</Button>
      </form>
      <div className="mb-6 flex gap-2 text-sm">
        {accounts.map((a) => (
          <span key={String(a._id)} className="rounded-md border bg-white px-3 py-1">
            {a.provider} · {a.connected ? "connected" : "disconnected"}
          </span>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {campaigns.map((c) => (
          <Card key={String(c._id)}>
            <CardHeader>
              <CardTitle>{c.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>Spend {currency(c.spend)}</div>
              <div>{c.leadsCount} leads</div>
              <div>Pipeline {currency(c.pipelineValue)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
