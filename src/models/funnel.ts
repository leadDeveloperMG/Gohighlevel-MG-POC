import { Schema, Types } from "mongoose";
import { defineModel } from "@/lib/model";

const formSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    name: { type: String, required: true },
    funnelId: { type: Types.ObjectId, ref: "Funnel" },
    schema: [
      {
        id: String,
        label: String,
        type: { type: String, default: "text" },
        required: { type: Boolean, default: false },
        options: [String],
        showIf: { fieldId: String, equals: String },
      },
    ],
  },
  { timestamps: true },
);

const funnelSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    domain: String,
    steps: [
      {
        slug: { type: String, required: true },
        name: String,
        type: { type: String, enum: ["page", "form", "checkout"], default: "page" },
        content: { type: Schema.Types.Mixed, default: {} },
        formId: { type: Types.ObjectId, ref: "Form" },
        variants: [
          {
            id: String,
            name: String,
            weight: { type: Number, default: 50 },
            content: { type: Schema.Types.Mixed, default: {} },
          },
        ],
        analytics: {
          views: { type: Number, default: 0 },
          conversions: { type: Number, default: 0 },
        },
      },
    ],
  },
  { timestamps: true },
);

funnelSchema.index({ slug: 1 }, { unique: true });
funnelSchema.index({ subAccountId: 1, createdAt: -1 });

const siteSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency", required: true },
    subAccountId: { type: Types.ObjectId, ref: "SubAccount", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    domain: String,
    nav: [{ label: String, href: String }],
    pages: [
      {
        slug: { type: String, required: true },
        title: String,
        body: String,
        seoTitle: String,
        seoDescription: String,
      },
    ],
    blogPosts: [
      {
        slug: { type: String, required: true },
        title: String,
        excerpt: String,
        body: String,
        seoTitle: String,
        seoDescription: String,
        status: { type: String, enum: ["draft", "published"], default: "draft" },
        publishedAt: Date,
      },
    ],
  },
  { timestamps: true },
);

export const Form = defineModel("Form", formSchema);
export const Funnel = defineModel("Funnel", funnelSchema);
export const Site = defineModel("Site", siteSchema);
