import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Funnel } from "@/models/funnel";
import { saveFunnelAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FunnelsPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const funnels = await Funnel.find({ subAccountId }).sort({ createdAt: -1 }).lean();

  return (
    <div>
      <PageHeader title="Funnels" description="Ordered steps with form capture, A/B weights, and step analytics." />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveFunnelAction} className="grid gap-2">
            <Input name="name" placeholder="Funnel name" required />
            <Input name="headline" placeholder="Headline" />
            <Textarea name="body" placeholder="Page copy" />
            <Button type="submit">Create funnel</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {funnels.map((f) => (
          <Card key={String(f._id)}>
            <CardHeader>
              <CardTitle>{f.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {f.steps.map((step: { slug: string; name?: string; type?: string; analytics?: { views?: number; conversions?: number } }) => (
                <div key={step.slug} className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span>
                    {step.name || step.slug} · {step.type}
                  </span>
                  <span>
                    {step.analytics?.views || 0} views / {step.analytics?.conversions || 0} conv
                  </span>
                </div>
              ))}
              <Link className="text-primary underline" href={`/f/${f.slug}/${f.steps[0]?.slug || "welcome"}`}>
                Open public step
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
