import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Contact, Opportunity, Task } from "@/models/crm";
import { Appointment } from "@/models/calendar";
import { UsageLedger } from "@/models/billing";
import { Job } from "@/models/job";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime } from "@/lib/utils";

export default async function OverviewPage() {
  const { subAccountId, sub } = await getActiveLocation();
  await connectDB();
  const [contacts, opps, tasks, appts, usage, jobs] = await Promise.all([
    Contact.countDocuments({ subAccountId }),
    Opportunity.countDocuments({ subAccountId, status: "open" }),
    Task.countDocuments({ subAccountId, status: "open" }),
    Appointment.find({ subAccountId }).sort({ startTime: -1 }).limit(5).lean(),
    UsageLedger.aggregate([
      { $match: { subAccountId: sub._id } },
      { $group: { _id: "$type", billed: { $sum: "$billedRate" }, qty: { $sum: "$quantity" } } },
    ]),
    Job.find({ subAccountId }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const stats = [
    ["Contacts", contacts],
    ["Open deals", opps],
    ["Open tasks", tasks],
    ["Location", sub.status],
  ];

  return (
    <div>
      <PageHeader title={sub.name} description="Location snapshot across CRM, calendar, and usage." />
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold capitalize">{value}</CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming / recent appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {appts.length === 0 ? <p className="text-muted-foreground">No appointments yet.</p> : null}
            {appts.map((a) => (
              <div key={String(a._id)} className="flex justify-between border-b pb-2 last:border-0">
                <span>{a.guestName || "Guest"}</span>
                <span className="text-muted-foreground">{formatDateTime(a.startTime)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usage this period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {usage.length === 0 ? <p className="text-muted-foreground">No metered usage yet.</p> : null}
            {usage.map((row) => (
              <div key={row._id} className="flex justify-between">
                <span className="capitalize">{row._id}</span>
                <span>
                  {row.qty} units · ${row.billed.toFixed(2)} billed
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Job queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {jobs.map((job) => (
              <div key={String(job._id)} className="flex justify-between">
                <span>{job.type}</span>
                <span className="capitalize text-muted-foreground">{job.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
