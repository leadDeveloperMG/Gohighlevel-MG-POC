import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Plan, Subscription } from "@/models/billing";
import { assignPlanAction, createPlanAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currency } from "@/lib/utils";

export default async function BillingPage() {
  const { agencyId, subAccountId, sub } = await getActiveLocation();
  await connectDB();
  const [plans, subscr] = await Promise.all([
    Plan.find({ agencyId }).lean(),
    Subscription.findOne({ subAccountId }).lean(),
  ]);

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Agency plans sync conceptually to Stripe Products. Webhooks update subscription status."
      />
      <div className="mb-4 text-sm">
        Location status <Badge>{sub.status}</Badge>
        {subscr ? (
          <span className="ml-2 text-muted-foreground">
            Subscription {subscr.status} · period end {subscr.currentPeriodEnd?.toDateString?.() || ""}
          </span>
        ) : null}
      </div>
      <form action={createPlanAction} className="mb-6 flex flex-wrap gap-2">
        <Input name="name" placeholder="Plan name" required />
        <Input name="price" type="number" placeholder="Price cents" required />
        <select name="interval" className="h-9 rounded-md border px-3 text-sm">
          <option value="month">month</option>
          <option value="year">year</option>
        </select>
        <Button type="submit">Add plan</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={String(plan._id)}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {currency(plan.price)}
                <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
              </p>
              <form action={assignPlanAction} className="mt-4">
                <input type="hidden" name="planId" value={String(plan._id)} />
                <Button type="submit" size="sm" variant="secondary">
                  Assign to this location
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
