export const ROLES = [
  "super_admin",
  "agency_admin",
  "agency_staff",
  "subaccount_admin",
  "subaccount_staff",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = {
  super_admin: 50,
  agency_admin: 40,
  agency_staff: 30,
  subaccount_admin: 20,
  subaccount_staff: 10,
};

export type Branding = {
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  domain?: string;
  senderName?: string;
  senderEmail?: string;
  smsNumber?: string;
};

export type TenantContext = {
  agencyId: string;
  subAccountId?: string;
  role: Role;
  userId: string;
};

export type WorkflowTrigger =
  | "lead.captured"
  | "tag.added"
  | "appointment.created"
  | "appointment.completed"
  | "appointment.no_show"
  | "opportunity.won"
  | "missed_call"
  | "payment.failed";

export type WorkflowChannel = "sms" | "email" | "voicemail" | "messenger";

export type JobType =
  | "workflow.step"
  | "appointment.reminder"
  | "missed_call.textback"
  | "usage.rollup"
  | "subscription.sync";
