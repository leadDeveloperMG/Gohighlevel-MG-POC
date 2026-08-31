import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Agency, SubAccount } from "@/models/agency";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AgenciesPage() {
  const session = await auth();
  if (session?.user.role !== "super_admin") redirect("/overview");
  await connectDB();
  const agencies = await Agency.find().sort({ createdAt: -1 }).lean();
  const counts = await SubAccount.aggregate([{ $group: { _id: "$agencyId", n: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

  return (
    <div>
      <PageHeader title="Agencies" description="Platform operator view of every tenant." />
      <div className="grid gap-4 md:grid-cols-2">
        {agencies.map((a) => (
          <Card key={String(a._id)}>
            <CardHeader>
              <CardTitle>{a.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {countMap[String(a._id)] || 0} locations · domain {a.branding?.domain || "default"}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
