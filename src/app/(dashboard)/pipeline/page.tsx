import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Contact, Opportunity, Pipeline } from "@/models/crm";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { PageHeader } from "@/components/ui/page-header";
import { createOpportunityAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function PipelinePage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  let pipeline = await Pipeline.findOne({ subAccountId }).lean();
  if (!pipeline) {
    const { agencyId } = await getActiveLocation();
    const created = await Pipeline.create({
      agencyId,
      subAccountId,
      name: "Sales",
      stages: [
        { id: "new", name: "New", order: 0 },
        { id: "contacted", name: "Contacted", order: 1 },
        { id: "booked", name: "Booked", order: 2 },
        { id: "won", name: "Won", order: 3 },
      ],
    });
    pipeline = created.toObject() as unknown as typeof pipeline;
  }
  if (!pipeline) throw new Error("Pipeline missing");
  const [opps, contacts] = await Promise.all([
    Opportunity.find({ subAccountId, pipelineId: pipeline._id }).lean(),
    Contact.find({ subAccountId }).sort({ name: 1 }).lean(),
  ]);
  const contactMap = Object.fromEntries(contacts.map((c) => [String(c._id), c.name]));
  const columns = [...pipeline.stages]
    .sort((a, b) => a.order - b.order)
    .map((stage) => ({
      id: stage.id,
      name: stage.name,
      cards: opps
        .filter((o) => o.stageId === stage.id)
        .map((o) => ({
          id: String(o._id),
          title: o.title || "Deal",
          value: o.value || 0,
          contactName: contactMap[String(o.contactId)] || "Contact",
          status: o.status,
        })),
    }));

  return (
    <div>
      <PageHeader title={pipeline.name} description="Drag cards between stages. Moving into Won fires a review workflow." />
      <form action={createOpportunityAction} className="mb-6 flex flex-wrap gap-2">
        <select name="contactId" className="h-9 rounded-md border px-3 text-sm" required>
          <option value="">Select contact</option>
          {contacts.map((c) => (
            <option key={String(c._id)} value={String(c._id)}>
              {c.name}
            </option>
          ))}
        </select>
        <Input name="title" placeholder="Deal title" className="w-48" />
        <Input name="value" type="number" placeholder="Value (cents)" className="w-36" />
        <Button type="submit">Add deal</Button>
      </form>
      <KanbanBoard columns={columns} />
    </div>
  );
}
