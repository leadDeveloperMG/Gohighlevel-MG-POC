import Link from "next/link";
import { registerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form action={registerAction} className="w-full space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Create your agency</h1>
          <p className="mt-1 text-sm text-muted-foreground">You will be the agency admin.</p>
        </div>
        {searchParams.error ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{searchParams.error}</p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="agencyName">Agency name</Label>
          <Input id="agencyName" name="agencyName" required placeholder="MacroGen" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        <Button className="w-full" type="submit">
          Create agency
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have access?{" "}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
