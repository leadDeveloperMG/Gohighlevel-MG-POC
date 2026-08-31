import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const jobSchema = new Schema(
  {
    type: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
      index: true,
    },
    runAt: { type: Date, default: Date.now, index: true },
    agencyId: { type: Types.ObjectId, ref: "Agency" },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount" },
    payload: { type: Schema.Types.Mixed, default: {} },
    attempts: { type: Number, default: 0 },
    lastError: String,
    providerEventId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

jobSchema.index({ status: 1, runAt: 1 });

const auditLogSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency" },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount" },
    userId: { type: Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    target: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } },
);

auditLogSchema.index({ agencyId: 1, timestamp: -1 });

export const Job = defineModel("Job", jobSchema);
export const AuditLog = defineModel("AuditLog", auditLogSchema);
