import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Workflow, WorkflowRun } from "@/models/workflow";
import {
  addWorkflowStepAction,
  createWorkflowAction,
  enqueueMissedCallTestAction,
  toggleWorkflowAction,
} from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TRIGGERS = [
  "lead.captured",
  "appointment.created",
  "appointment.completed",
  "appointment.no_show",
  "opportunity.won",
  "missed_call",
  "payment.failed",
  "tag.added",
];

export default async function WorkflowsPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const [workflows, runs] = await Promise.all([
    Workflow.find({ subAccountId }).sort({ createdAt: -1 }).lean(),
    WorkflowRun.find({ subAccountId }).sort({ createdAt: -1 }).limit(12).lean(),
  ]);

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Triggered sequences. Jobs run immediately or via the 5-minute cron."
        actions={
          <form action={enqueueMissedCallTestAction}>
            <Button variant="outline" type="submit">
              Queue missed-call text-back
            </Button>
          </form>
        }
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createWorkflowAction} className="grid gap-2 md:grid-cols-2">
            <Input name="name" placeholder="Name" required />
            <select name="trigger" className="h-9 rounded-md border px-3 text-sm">
              {TRIGGERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select name="channel" className="h-9 rounded-md border px-3 text-sm">
              <option value="sms">sms</option>
              <option value="email">email</option>
              <option value="voicemail">voicemail</option>
              <option value="messenger">messenger</option>
            </select>
            <Input name="delaySeconds" type="number" defaultValue={0} />
            <Input name="subject" placeholder="Email subject" />
            <Textarea
              name="template"
              className="md:col-span-2"
              defaultValue="Hi {{name}}, thanks for reaching out. Reply STOP to opt out."
            />
            <Button type="submit" className="md:col-span-2">
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {workflows.map((wf) => (
          <Card key={String(wf._id)}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{wf.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{wf.trigger}</p>
              </div>
              <form action={toggleWorkflowAction}>
                <input type="hidden" name="workflowId" value={String(wf._id)} />
                <Button size="sm" variant={wf.active ? "secondary" : "default"} type="submit">
                  {wf.active ? "Active" : "Paused"}
                </Button>
              </form>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="space-y-2 text-sm">
                {wf.steps.map((step: { channel?: string; delaySeconds?: number; template?: string }, i: number) => (
                  <li key={i} className="rounded-md bg-slate-50 px-3 py-2">
                    {i + 1}. {step.channel} after {step.delaySeconds}s — {step.template}
                  </li>
                ))}
              </ol>
              <form action={addWorkflowStepAction} className="grid gap-2 md:grid-cols-4">
                <input type="hidden" name="workflowId" value={String(wf._id)} />
                <select name="channel" className="h-9 rounded-md border px-3 text-sm">
                  <option value="sms">sms</option>
                  <option value="email">email</option>
                </select>
                <Input name="delaySeconds" type="number" defaultValue={3600} />
                <Input name="template" placeholder="Step template" className="md:col-span-2" />
                <Button type="submit" variant="outline" size="sm">
                  Add step
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Recent runs</h2>
      <div className="space-y-2 text-sm">
        {runs.map((run) => (
          <div key={String(run._id)} className="flex justify-between rounded-md border bg-white px-3 py-2">
            <span>Step {run.currentStep}</span>
            <Badge tone={run.status === "completed" ? "success" : "muted"}>{run.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
