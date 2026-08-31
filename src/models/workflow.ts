import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const workflowSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    name: { type: String, required: true },
    trigger: { type: String, required: true },
    active: { type: Boolean, default: true },
    steps: [
      {
        type: { type: String, default: "message" },
        channel: { type: String, enum: ["sms", "email", "voicemail", "messenger"] },
        delaySeconds: { type: Number, default: 0 },
        template: String,
        subject: String,
      },
    ],
  },
  { timestamps: true },
);

workflowSchema.index({ subAccountId: 1, trigger: 1, active: 1 });

const workflowRunSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    workflowId: { type: Types.ObjectId, ref: "Workflow", required: true },
    contactId: { type: Types.ObjectId, ref: "Contact" },
    currentStep: { type: Number, default: 0 },
    status: { type: String, enum: ["running", "completed", "failed", "stopped"], default: "running" },
    history: [
      {
        stepIndex: Number,
        status: String,
        at: Date,
        detail: String,
      },
    ],
  },
  { timestamps: true },
);

const messageSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    contactId: { type: Types.ObjectId, ref: "Contact" },
    channel: { type: String, required: true },
    direction: { type: String, enum: ["outbound", "inbound"], default: "outbound" },
    body: String,
    subject: String,
    providerMessageId: String,
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "failed", "clicked", "opened"],
      default: "queued",
    },
  },
  { timestamps: true },
);

messageSchema.index({ subAccountId: 1, createdAt: -1 });
messageSchema.index({ contactId: 1, createdAt: -1 });

const reviewSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    contactId: { type: Types.ObjectId, ref: "Contact" },
    platform: { type: String, enum: ["google", "facebook"], required: true },
    requestSentAt: Date,
    clickedAt: Date,
    openedAt: Date,
    rating: Number,
    link: String,
    token: String,
  },
  { timestamps: true },
);

reviewSchema.index({ subAccountId: 1, createdAt: -1 });

export const Workflow = defineModel("Workflow", workflowSchema);
export const WorkflowRun = defineModel("WorkflowRun", workflowRunSchema);
export const Message = defineModel("Message", messageSchema);
export const Review = defineModel("Review", reviewSchema);
