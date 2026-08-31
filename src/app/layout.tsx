import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { getBranding, brandingCssVars } from "@/lib/tenant";

const font = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Agency operating system",
  description: "Multi-tenant CRM, automation, billing, and funnels.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let branding: { primaryColor: string; accentColor: string; senderName?: string; logoUrl?: string } = {
    primaryColor: "#0f766e",
    accentColor: "#14b8a6",
    senderName: "AgencyOS",
  };
  try {
    branding = await getBranding();
  } catch {
    // Mongo unavailable during first boot / build
  }

  return (
    <html lang="en">
      <body className={`${font.variable} font-sans antialiased`} style={brandingCssVars(branding)}>
        {children}
      </body>
    </html>
  );
}
