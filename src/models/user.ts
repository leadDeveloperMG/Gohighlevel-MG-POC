import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";
import { ROLES } from "@/types";

const userSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", index: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount" },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: String,
    role: { type: String, enum: ROLES, required: true },
    permissions: [String],
    image: String,
  },
  { timestamps: true },
);

userSchema.index({ agencyId: 1, role: 1 });

export const User = defineModel("User", userSchema);
