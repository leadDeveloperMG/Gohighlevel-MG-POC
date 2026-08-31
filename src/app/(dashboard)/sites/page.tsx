import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Site } from "@/models/funnel";
import { saveSiteAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SitesPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const sites = await Site.find({ subAccountId }).sort({ createdAt: -1 }).lean();

  return (
    <div>
      <PageHeader title="Client sites" description="Multi-page sites and blog posts with SEO fields." />
      <form action={saveSiteAction} className="mb-6 grid gap-2 rounded-xl border bg-white p-4">
        <Input name="name" placeholder="Site name" required />
        <Input name="seoDescription" placeholder="SEO description" />
        <Textarea name="body" placeholder="Home page body" />
        <Textarea name="postBody" placeholder="First blog post body" />
        <Button type="submit">Create site</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {sites.map((site) => (
          <Card key={String(site._id)}>
            <CardHeader>
              <CardTitle>{site.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {site.pages.map((p: { slug: string; title?: string }) => (
                <div key={p.slug}>Page · {p.title}</div>
              ))}
              {site.blogPosts.map((p: { slug: string; title?: string; status?: string }) => (
                <div key={p.slug} className="flex items-center gap-2">
                  Blog · {p.title} <Badge tone={p.status === "published" ? "success" : "muted"}>{p.status}</Badge>
                </div>
              ))}
              <Link className="text-primary underline" href={`/s/${site.slug}`}>
                View site
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
