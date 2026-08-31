import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const aiBotConfigSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true, unique: true },
    persona: { type: String, default: "A helpful booking assistant." },
    qualifyingScript: { type: String, default: "Ask for name, email, and preferred time." },
    brandVoice: String,
    channelsEnabled: { type: [String], default: ["web", "sms", "messenger"] },
    calendarId: { type: Types.ObjectId, ref: "Calendar" },
  },
  { timestamps: true },
);

const aiConversationSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    contactId: { type: Types.ObjectId, ref: "Contact" },
    channel: { type: String, default: "web" },
    handoffFlag: { type: Boolean, default: false },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant", "system"] },
        content: String,
        at: { type: Date, default: Date.now },
        lowConfidence: Boolean,
      },
    ],
  },
  { timestamps: true },
);

aiConversationSchema.index({ subAccountId: 1, createdAt: -1 });

export const AiBotConfig = defineModel("AiBotConfig", aiBotConfigSchema);
export const AiConversation = defineModel("AiConversation", aiConversationSchema);
