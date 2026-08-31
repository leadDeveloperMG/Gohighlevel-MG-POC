import Link from "next/link";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <div className="hidden brand-gradient p-10 text-white md:flex md:flex-col md:justify-between">
        <div className="text-lg font-semibold">AgencyOS</div>
        <div>
          <h2 className="text-3xl font-semibold">Operate every location from one login.</h2>
          <p className="mt-3 max-w-md text-white/80">
            Demo accounts are created by <code className="text-white">npm run seed</code>.
          </p>
        </div>
        <p className="text-sm text-white/70">White-label CRM · Workflows · Billing</p>
      </div>
      <div className="flex items-center justify-center p-8">
        <form action={loginAction} className="w-full max-w-sm space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use your agency credentials.</p>
          </div>
          {searchParams.error ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{searchParams.error}</p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="admin@macrogen.local" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button className="w-full" type="submit">
            Continue
          </Button>
          <p className="text-sm text-muted-foreground">
            New agency?{" "}
            <Link href="/register" className="text-primary underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
