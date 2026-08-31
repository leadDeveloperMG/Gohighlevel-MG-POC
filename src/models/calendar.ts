import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const calendarSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    ownerUserId: { type: Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    slotDuration: { type: Number, default: 30 },
    bufferMinutes: { type: Number, default: 0 },
    availabilityRules: [
      {
        weekday: { type: Number, required: true },
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

const appointmentSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    calendarId: { type: Types.ObjectId, ref: "Calendar", required: true },
    contactId: { type: Types.ObjectId, ref: "Contact" },
    guestName: String,
    guestEmail: String,
    guestPhone: String,
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["booked", "confirmed", "completed", "no_show", "canceled"],
      default: "booked",
    },
  },
  { timestamps: true },
);

appointmentSchema.index({ calendarId: 1, startTime: 1 });
appointmentSchema.index({ subAccountId: 1, createdAt: -1 });

export const Calendar = defineModel("Calendar", calendarSchema);
export const Appointment = defineModel("Appointment", appointmentSchema);
