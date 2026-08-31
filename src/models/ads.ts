import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const adAccountSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    provider: { type: String, enum: ["meta", "google"], required: true },
    accountId: String,
    accountName: String,
    oauthTokens: String,
    connected: { type: Boolean, default: false },
  },
  { timestamps: true },
);

adAccountSchema.index({ subAccountId: 1, provider: 1 });

const adCampaignSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    adAccountId: { type: Types.ObjectId, ref: "AdAccount", required: true },
    externalId: String,
    name: { type: String, required: true },
    spend: { type: Number, default: 0 },
    leadsCount: { type: Number, default: 0 },
    pipelineValue: { type: Number, default: 0 },
    syncedAt: Date,
  },
  { timestamps: true },
);

adCampaignSchema.index({ subAccountId: 1, createdAt: -1 });

export const AdAccount = defineModel("AdAccount", adAccountSchema);
export const AdCampaign = defineModel("AdCampaign", adCampaignSchema);
