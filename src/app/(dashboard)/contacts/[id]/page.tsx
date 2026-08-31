import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Contact, Note, Task } from "@/models/crm";
import { Message } from "@/models/workflow";
import { addNoteAction, addTaskAction } from "../../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const contact = await Contact.findOne({ _id: params.id, subAccountId }).lean();
  if (!contact) notFound();
  const [notes, tasks, messages] = await Promise.all([
    Note.find({ contactId: contact._id }).sort({ createdAt: -1 }).lean(),
    Task.find({ contactId: contact._id }).sort({ createdAt: -1 }).lean(),
    Message.find({ contactId: contact._id }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);

  return (
    <div>
      <PageHeader
        title={contact.name}
        description={`${contact.email || "No email"} · ${contact.phone || "No phone"}`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(contact.tags as string[] | undefined)?.map((t: string) => (
          <Badge key={t}>{t}</Badge>
        ))}
        {contact.source ? <Badge tone="muted">{contact.source}</Badge> : null}
        {contact.optedOut ? <Badge tone="danger">STOP / opted out</Badge> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {messages.map((m) => (
              <div key={String(m._id)} className="rounded-md border p-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {m.channel} · {m.direction} · {m.status}
                  </span>
                  <span>{formatDateTime(m.createdAt)}</span>
                </div>
                <p className="mt-1">{m.body}</p>
              </div>
            ))}
            {notes.map((n) => (
              <div key={String(n._id)} className="rounded-md bg-slate-50 p-3">
                <div className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)} · note</div>
                <p className="mt-1">{n.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add note</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addNoteAction} className="space-y-2">
                <input type="hidden" name="contactId" value={String(contact._id)} />
                <Textarea name="body" required placeholder="Note" />
                <Button type="submit" size="sm">
                  Save note
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addTaskAction} className="space-y-2">
                <input type="hidden" name="contactId" value={String(contact._id)} />
                <Input name="title" placeholder="Follow up" required />
                <Input name="dueDate" type="date" />
                <Button type="submit" size="sm" variant="secondary">
                  Add task
                </Button>
              </form>
              <ul className="mt-3 space-y-1 text-sm">
                {tasks.map((t) => (
                  <li key={String(t._id)} className="flex justify-between">
                    <span>{t.title}</span>
                    <span className="text-muted-foreground">{t.status}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
