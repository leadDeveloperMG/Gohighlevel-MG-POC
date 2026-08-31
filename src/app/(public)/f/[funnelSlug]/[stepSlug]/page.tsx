import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Funnel } from "@/models/funnel";
import { FunnelForm } from "@/components/public/funnel-form";

export const dynamic = "force-dynamic";

export default async function FunnelStepPage({
  params,
  searchParams,
}: {
  params: { funnelSlug: string; stepSlug: string };
  searchParams: Record<string, string | undefined>;
}) {
  await connectDB();
  const funnel = await Funnel.findOne({ slug: params.funnelSlug });
  if (!funnel) notFound();
  const step = funnel.steps.find((s: { slug: string }) => s.slug === params.stepSlug);
  if (!step) notFound();

  step.analytics = step.analytics || { views: 0, conversions: 0 };
  step.analytics.views = (step.analytics.views || 0) + 1;
  funnel.markModified("steps");
  await funnel.save();

  const content = step.content || {};

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-teal-700">{funnel.name}</p>
      <h1 className="mt-2 text-4xl font-semibold">{content.headline || step.name || "Let's talk"}</h1>
      <p className="mt-3 text-muted-foreground">{content.body || "Share your details and we will follow up shortly."}</p>
      <FunnelForm
        funnelSlug={funnel.slug}
        stepSlug={step.slug}
        utm={{
          utm_source: searchParams.utm_source,
          utm_medium: searchParams.utm_medium,
          utm_campaign: searchParams.utm_campaign,
          campaignId: searchParams.campaignId,
        }}
      />
    </main>
  );
}
