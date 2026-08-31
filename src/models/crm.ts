import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const contactSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    tags: [String],
    source: String,
    optedOut: { type: Boolean, default: false },
    customFields: { type: Schema.Types.Mixed, default: {} },
    campaignId: String,
    funnelId: { type: Types.ObjectId, ref: "Funnel" },
    utm: {
      source: String,
      medium: String,
      campaign: String,
      content: String,
      term: String,
    },
  },
  { timestamps: true },
);

contactSchema.index({ subAccountId: 1, createdAt: -1 });
contactSchema.index({ subAccountId: 1, email: 1 });
contactSchema.index({ subAccountId: 1, phone: 1 });

const pipelineSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true, index: true },
    name: { type: String, required: true },
    stages: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        order: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true },
);

const opportunitySchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    pipelineId: { type: Types.ObjectId, ref: "Pipeline", required: true },
    stageId: { type: String, required: true },
    contactId: { type: Types.ObjectId, ref: "Contact", required: true },
    title: String,
    value: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "won", "lost"], default: "open" },
    adCampaignId: { type: Types.ObjectId, ref: "AdCampaign" },
  },
  { timestamps: true },
);

opportunitySchema.index({ subAccountId: 1, pipelineId: 1, stageId: 1 });

const taskSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    contactId: { type: Types.ObjectId, ref: "Contact" },
    opportunityId: { type: Types.ObjectId, ref: "Opportunity" },
    assigneeId: { type: Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    dueDate: Date,
    status: { type: String, enum: ["open", "done"], default: "open" },
  },
  { timestamps: true },
);

taskSchema.index({ subAccountId: 1, createdAt: -1 });

const noteSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    contactId: { type: Types.ObjectId, ref: "Contact", required: true },
    authorId: { type: Types.ObjectId, ref: "User" },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

noteSchema.index({ contactId: 1, createdAt: -1 });

export const Contact = defineModel("Contact", contactSchema);
export const Pipeline = defineModel("Pipeline", pipelineSchema);
export const Opportunity = defineModel("Opportunity", opportunitySchema);
export const Task = defineModel("Task", taskSchema);
export const Note = defineModel("Note", noteSchema);
