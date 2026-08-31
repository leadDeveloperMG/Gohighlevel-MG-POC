import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Contact } from "@/models/crm";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createContactAction } from "../actions";
import { formatDate } from "@/lib/utils";

export default async function ContactsPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const contacts = await Contact.find({ subAccountId }).sort({ createdAt: -1 }).limit(100).lean();

  return (
    <div>
      <PageHeader title="Contacts" description="Leads and customers for this location." />
      <form action={createContactAction} className="mb-6 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-5">
        <Input name="name" placeholder="Name" required />
        <Input name="email" placeholder="Email" type="email" />
        <Input name="phone" placeholder="Phone" />
        <Input name="tags" placeholder="tags, comma, separated" />
        <Button type="submit">Add contact</Button>
      </form>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Added</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={String(c._id)} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/contacts/${c._id}`} className="font-medium text-primary">
                    {c.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(c.tags as string[] | undefined)?.map((tag: string) => (
                      <Badge key={tag} tone="muted">
                        {tag}
                      </Badge>
                    ))}
                    {c.optedOut ? <Badge tone="danger">opted out</Badge> : null}
                  </div>
                </td>
                <td className="px-4 py-3">{c.email || "—"}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="px-4 py-3">{c.source || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
