import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const planSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    interval: { type: String, enum: ["month", "year"], default: "month" },
    features: { type: Schema.Types.Mixed, default: {} },
    stripePriceId: String,
    stripeProductId: String,
    limits: {
      contacts: { type: Number, default: 1000 },
      users: { type: Number, default: 5 },
    },
  },
  { timestamps: true },
);

const subscriptionSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true, unique: true },
    planId: { type: Types.ObjectId, ref: "Plan", required: true },
    stripeSubscriptionId: String,
    status: {
      type: String,
      enum: ["active", "past_due", "canceled", "trialing"],
      default: "active",
    },
    currentPeriodEnd: Date,
    graceUntil: Date,
  },
  { timestamps: true },
);

const usageLedgerSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    type: { type: String, enum: ["sms", "email", "ai"], required: true },
    quantity: { type: Number, default: 1 },
    vendorCost: { type: Number, required: true },
    billedRate: { type: Number, required: true },
    periodKey: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

usageLedgerSchema.index({ subAccountId: 1, periodKey: 1, type: 1 });

export const Plan = defineModel("Plan", planSchema);
export const Subscription = defineModel("Subscription", subscriptionSchema);
export const UsageLedger = defineModel("UsageLedger", usageLedgerSchema);
