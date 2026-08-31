import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Site } from "@/models/funnel";

export const dynamic = "force-dynamic";

export default async function SitePage({
  params,
}: {
  params: { siteSlug: string; page?: string[] };
}) {
  await connectDB();
  const site = await Site.findOne({ slug: params.siteSlug }).lean();
  if (!site) notFound();
  const segments = params.page || [];
  const isBlogIndex = segments[0] === "blog" && !segments[1];
  const isBlogPost = segments[0] === "blog" && segments[1];
  const pageSlug = segments[0] && segments[0] !== "blog" ? segments[0] : "home";

  if (isBlogIndex) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Blog</h1>
        <div className="mt-6 space-y-4">
          {site.blogPosts
            .filter((p: { status?: string }) => p.status === "published")
            .map((p: { slug: string; title?: string; excerpt?: string }) => (
              <Link key={p.slug} href={`/s/${site.slug}/blog/${p.slug}`} className="block rounded-lg border bg-white p-4">
                <h2 className="font-medium">{p.title}</h2>
                <p className="text-sm text-muted-foreground">{p.excerpt}</p>
              </Link>
            ))}
        </div>
      </main>
    );
  }

  if (isBlogPost) {
    const post = site.blogPosts.find((p: { slug: string; status?: string }) => p.slug === segments[1] && p.status === "published");
    if (!post) notFound();
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-4xl font-semibold">{post.title}</h1>
        <article className="prose mt-6 whitespace-pre-wrap">{post.body}</article>
      </main>
    );
  }

  const page = site.pages.find((p: { slug: string }) => p.slug === pageSlug) || site.pages[0];
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <nav className="mb-8 flex gap-4 text-sm">
        {site.nav?.map((item: { href: string; label: string }) => (
          <Link key={item.href} href={`/s/${site.slug}${item.href === "/" ? "" : item.href}`}>
            {item.label}
          </Link>
        ))}
      </nav>
      <h1 className="text-4xl font-semibold">{page.title}</h1>
      <article className="mt-6 whitespace-pre-wrap text-lg leading-relaxed">{page.body}</article>
    </main>
  );
}
