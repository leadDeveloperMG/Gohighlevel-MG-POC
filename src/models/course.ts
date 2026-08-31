import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const courseSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    priceType: { type: String, enum: ["free", "one_time", "subscription"], default: "free" },
    price: { type: Number, default: 0 },
    stripePriceId: String,
    modules: [
      {
        title: String,
        lessons: [
          {
            title: String,
            type: { type: String, enum: ["video", "text"], default: "text" },
            body: String,
            videoUrl: String,
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

const enrollmentSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    courseId: { type: Types.ObjectId, ref: "Course", required: true },
    userId: { type: Types.ObjectId, ref: "User" },
    contactId: { type: Types.ObjectId, ref: "Contact" },
    email: String,
    name: String,
    progress: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["active", "canceled"], default: "active" },
  },
  { timestamps: true },
);

enrollmentSchema.index({ courseId: 1, email: 1 });

const communityPostSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    courseId: { type: Types.ObjectId, ref: "Course" },
    authorId: { type: Types.ObjectId, ref: "User" },
    authorName: String,
    title: String,
    body: { type: String, required: true },
    comments: [
      {
        authorName: String,
        body: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Course = defineModel("Course", courseSchema);
export const Enrollment = defineModel("Enrollment", enrollmentSchema);
export const CommunityPost = defineModel("CommunityPost", communityPostSchema);
