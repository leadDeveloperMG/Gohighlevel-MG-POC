import { getBranding, brandingCssVars } from "@/lib/tenant";
import { ChatWidget } from "@/components/public/chat-widget";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let branding: { primaryColor: string; accentColor: string; senderName?: string; logoUrl?: string } = {
    primaryColor: "#0f766e",
    accentColor: "#14b8a6",
    senderName: "Studio",
  };
  try {
    branding = await getBranding();
  } catch {
    // ignore
  }

  return (
    <div style={brandingCssVars(branding)} className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-sm font-bold text-white">
              {(branding.senderName || "A").slice(0, 1)}
            </span>
          )}
          <span className="font-semibold">{branding.senderName}</span>
        </div>
      </header>
      {children}
      <ChatWidget />
    </div>
  );
}
