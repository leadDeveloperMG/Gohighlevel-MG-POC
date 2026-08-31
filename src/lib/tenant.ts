import type { CSSProperties } from "react";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { Agency, SubAccount } from "@/models/agency";
import type { Branding } from "@/types";

const DEFAULT_BRANDING: Branding = {
  primaryColor: "#0f766e",
  accentColor: "#14b8a6",
  senderName: "AgencyOS",
};

export function hostFromHeaders() {
  const h = headers();
  return (
    h.get("x-forwarded-host") ||
    h.get("host") ||
    process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, "") ||
    "localhost:3000"
  ).split(":")[0];
}

export async function resolveAgencyByHost(hostname?: string) {
  await connectDB();
  const host = hostname || hostFromHeaders();
  const agency = await Agency.findOne({ "branding.domain": host });
  if (agency) return agency;
  const bySub = await SubAccount.findOne({ "branding.domain": host });
  if (bySub) {
    return Agency.findById(bySub.agencyId);
  }
  return Agency.findOne().sort({ createdAt: 1 });
}

export async function getBranding(hostname?: string): Promise<Branding> {
  const agency = await resolveAgencyByHost(hostname);
  if (!agency) return DEFAULT_BRANDING;
  return {
    logoUrl: agency.branding?.logoUrl,
    primaryColor: agency.branding?.primaryColor || DEFAULT_BRANDING.primaryColor,
    accentColor: agency.branding?.accentColor || DEFAULT_BRANDING.accentColor,
    domain: agency.branding?.domain,
    senderName: agency.branding?.senderName || agency.name,
    senderEmail: agency.branding?.senderEmail,
    smsNumber: agency.branding?.smsNumber,
  };
}

export function brandingCssVars(branding: Branding) {
  return {
    "--brand-primary": branding.primaryColor,
    "--brand-accent": branding.accentColor,
  } as CSSProperties;
}
