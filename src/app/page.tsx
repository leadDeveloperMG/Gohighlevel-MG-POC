import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/overview");

  return (
    <main className="min-h-screen bg-[hsl(222_47%_11%)] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-sm">A</span>
          AgencyOS
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-md px-3 py-1.5 text-sm text-white/80 hover:text-white">
            Sign in
          </Link>
          <Link href="/register" className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900">
            Start agency
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <p className="text-sm uppercase tracking-[0.2em] text-teal-300">White-label agency platform</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight">
          Run every client location from one operating system.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/70">
          CRM, pipelines, funnels, booking, workflows, billing, and AI — scoped per agency and
          sub-account, ready for Vercel and MongoDB.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/register" className="rounded-md bg-teal-500 px-5 py-2.5 text-sm font-medium text-white">
            Create your agency
          </Link>
          <Link href="/login" className="rounded-md border border-white/20 px-5 py-2.5 text-sm">
            Use demo login
          </Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ["CRM & pipeline", "Contacts, notes, tasks, and a drag-and-drop opportunity board."],
            ["Automation", "Event-triggered SMS/email workflows with a Mongo-backed job queue."],
            ["Public surfaces", "Funnels, booking pages, sites, and courses under your branding."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-medium">{title}</h2>
              <p className="mt-2 text-sm text-white/65">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
