import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { AiBotConfig, AiConversation } from "@/models/ai";
import { saveBotConfigAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ContentStudio } from "@/components/dashboard/content-studio";
import { Badge } from "@/components/ui/badge";

export default async function AiPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const [config, conversations] = await Promise.all([
    AiBotConfig.findOne({ subAccountId }).lean(),
    AiConversation.find({ subAccountId }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return (
    <div>
      <PageHeader title="AI assistants" description="Conversational bot plus a content studio. Drafts never auto-publish." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={saveBotConfigAction} className="space-y-2 rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Bot persona</h2>
          <Textarea name="persona" defaultValue={config?.persona || ""} placeholder="Persona" />
          <Textarea name="qualifyingScript" defaultValue={config?.qualifyingScript || ""} placeholder="Qualifying script" />
          <Textarea name="brandVoice" defaultValue={config?.brandVoice || ""} placeholder="Brand voice" />
          <Button type="submit">Save bot</Button>
        </form>
        <div>
          <h2 className="mb-2 font-semibold">Content studio</h2>
          <ContentStudio />
        </div>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Conversations</h2>
      <div className="space-y-2">
        {conversations.map((c) => (
          <div key={String(c._id)} className="rounded-lg border bg-white px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span>{c.channel}</span>
              {c.handoffFlag ? <Badge tone="warn">handoff</Badge> : <Badge tone="muted">bot</Badge>}
            </div>
            <p className="mt-1 text-muted-foreground">{c.messages?.at(-1)?.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
