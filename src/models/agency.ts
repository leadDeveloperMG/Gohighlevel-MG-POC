import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const brandingSchema = new Schema(
  {
    logoUrl: String,
    primaryColor: { type: String, default: "#0f766e" },
    accentColor: { type: String, default: "#14b8a6" },
    domain: String,
    senderName: String,
    senderEmail: String,
    smsNumber: String,
  },
  { _id: false },
);

const agencySchema = new Schema(
  {
    name: { type: String, required: true },
    branding: { type: brandingSchema, default: () => ({}) },
    ownerUserId: { type: Types.ObjectId, ref: "User" },
    domainVerified: { type: Boolean, default: false },
    usageMarkup: {
      sms: { type: Number, default: 0.02 },
      email: { type: Number, default: 0.005 },
      ai: { type: Number, default: 0.02 },
    },
  },
  { timestamps: true },
);

agencySchema.index({ "branding.domain": 1 }, { unique: true, sparse: true });

const subAccountSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true, index: true },
    name: { type: String, required: true },
    planId: { type: Types.ObjectId, ref: "Plan" },
    branding: { type: brandingSchema, default: () => ({}) },
    timezone: { type: String, default: "America/New_York" },
    status: {
      type: String,
      enum: ["active", "past_due", "canceled", "restricted"],
      default: "active",
    },
    googleReviewUrl: String,
    facebookReviewUrl: String,
    graceUntil: Date,
    usageMarkup: {
      sms: Number,
      email: Number,
      ai: Number,
    },
  },
  { timestamps: true },
);

subAccountSchema.index({ agencyId: 1, name: 1 });

export const Agency = defineModel("Agency", agencySchema);
export const SubAccount = defineModel("SubAccount", subAccountSchema);
