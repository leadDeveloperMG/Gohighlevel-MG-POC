import { getActiveLocation } from "@/lib/current-location";
import { connectDB } from "@/lib/db";
import { Agency } from "@/models/agency";
import { saveBrandingAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SettingsPage() {
  const { agencyId } = await getActiveLocation();
  await connectDB();
  const agency = await Agency.findById(agencyId);

  return (
    <div>
      <PageHeader
        title="White-label settings"
        description="Branding applies to dashboards, public pages, email from-name, and SMS identity. Add a CNAME to your custom domain pointing at this Vercel project."
      />
      <form action={saveBrandingAction} className="max-w-xl space-y-3 rounded-xl border bg-white p-5">
        <div>
          <Label>Logo URL</Label>
          <Input name="logoUrl" defaultValue={agency?.branding?.logoUrl || ""} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Primary color</Label>
            <Input name="primaryColor" defaultValue={agency?.branding?.primaryColor || "#0f766e"} />
          </div>
          <div>
            <Label>Accent color</Label>
            <Input name="accentColor" defaultValue={agency?.branding?.accentColor || "#14b8a6"} />
          </div>
        </div>
        <div>
          <Label>Custom domain</Label>
          <Input name="domain" placeholder="app.youragency.com" defaultValue={agency?.branding?.domain || ""} />
          <p className="mt-1 text-xs text-muted-foreground">
            DNS: CNAME {agency?.branding?.domain || "app.youragency.com"} → cname.vercel-dns.com. Verification is
            manual in this phase.
          </p>
        </div>
        <div>
          <Label>Sender name</Label>
          <Input name="senderName" defaultValue={agency?.branding?.senderName || agency?.name || ""} />
        </div>
        <div>
          <Label>Sender email</Label>
          <Input name="senderEmail" defaultValue={agency?.branding?.senderEmail || ""} />
        </div>
        <div>
          <Label>SMS number</Label>
          <Input name="smsNumber" defaultValue={agency?.branding?.smsNumber || ""} />
        </div>
        <Button type="submit">Save branding</Button>
      </form>
    </div>
  );
}
