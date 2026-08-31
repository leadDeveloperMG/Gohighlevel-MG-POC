import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const full = resolve(process.cwd(), file);
    if (!existsSync(full)) continue;
    for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}
loadEnv();
import { Agency, SubAccount } from "../src/models/agency";
import { User } from "../src/models/user";
import { Contact, Pipeline, Opportunity, Task, Note } from "../src/models/crm";
import { Form, Funnel, Site } from "../src/models/funnel";
import { Calendar, Appointment } from "../src/models/calendar";
import { Workflow, Message, Review } from "../src/models/workflow";
import { Plan, Subscription, UsageLedger } from "../src/models/billing";
import { AdAccount, AdCampaign } from "../src/models/ads";
import { Course, Enrollment, CommunityPost } from "../src/models/course";
import { AiBotConfig } from "../src/models/ai";
import { encryptAtRest } from "../src/lib/crypto";
import { periodKey } from "../src/lib/utils";

async function reset() {
  const { WorkflowRun } = await import("../src/models/workflow");
  const { AiConversation } = await import("../src/models/ai");
  const { Job, AuditLog } = await import("../src/models/job");
  await Promise.all([
    Agency.deleteMany({}),
    SubAccount.deleteMany({}),
    User.deleteMany({}),
    Contact.deleteMany({}),
    Pipeline.deleteMany({}),
    Opportunity.deleteMany({}),
    Task.deleteMany({}),
    Note.deleteMany({}),
    Form.deleteMany({}),
    Funnel.deleteMany({}),
    Site.deleteMany({}),
    Calendar.deleteMany({}),
    Appointment.deleteMany({}),
    Workflow.deleteMany({}),
    WorkflowRun.deleteMany({}),
    Message.deleteMany({}),
    Review.deleteMany({}),
    Plan.deleteMany({}),
    Subscription.deleteMany({}),
    UsageLedger.deleteMany({}),
    AdAccount.deleteMany({}),
    AdCampaign.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    CommunityPost.deleteMany({}),
    AiBotConfig.deleteMany({}),
    AiConversation.deleteMany({}),
    Job.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI before seeding");
  }
  await connectDB();
  await reset();

  const hash = await bcrypt.hash("Demo1234!", 12);
  const agency = await Agency.create({
    name: "MacroGen",
    branding: {
      primaryColor: "#0f766e",
      accentColor: "#14b8a6",
      senderName: "MacroGen",
      senderEmail: "hello@macrogen.local",
      smsNumber: "+15555550199",
    },
    usageMarkup: { sms: 0.02, email: 0.005, ai: 0.02 },
  });

  const starter = await Plan.create({
    agencyId: agency._id,
    name: "Growth",
    price: 14900,
    interval: "month",
    features: { funnels: true, workflows: true, ai: true },
  });
  const pro = await Plan.create({
    agencyId: agency._id,
    name: "Scale",
    price: 29900,
    interval: "month",
    features: { funnels: true, workflows: true, ai: true, ads: true },
  });

  const dental = await SubAccount.create({
    agencyId: agency._id,
    name: "Bright Smiles Dental",
    planId: starter._id,
    timezone: "America/New_York",
    status: "active",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=demo",
    facebookReviewUrl: "https://facebook.com/brightsmiles/reviews",
  });
  const gym = await SubAccount.create({
    agencyId: agency._id,
    name: "Northside Fitness",
    planId: pro._id,
    timezone: "America/Chicago",
    status: "active",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=gym",
  });

  const superAdmin = await User.create({
    name: "Platform Operator",
    email: "super@macrogen.local",
    passwordHash: hash,
    role: "super_admin",
  });
  const admin = await User.create({
    agencyId: agency._id,
    name: "Ava Chen",
    email: "admin@macrogen.local",
    passwordHash: hash,
    role: "agency_admin",
  });
  await User.create({
    agencyId: agency._id,
    name: "Jordan Lee",
    email: "staff@macrogen.local",
    passwordHash: hash,
    role: "agency_staff",
  });
  const clientAdmin = await User.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Dr. Maya Patel",
    email: "client@brightsmiles.local",
    passwordHash: hash,
    role: "subaccount_admin",
  });
  await User.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Front Desk",
    email: "front@brightsmiles.local",
    passwordHash: hash,
    role: "subaccount_staff",
  });
  await User.create({
    agencyId: agency._id,
    subAccountId: gym._id,
    name: "Alex Morgan",
    email: "owner@northside.local",
    passwordHash: hash,
    role: "subaccount_admin",
  });
  agency.ownerUserId = admin._id;
  await agency.save();

  await Subscription.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    planId: starter._id,
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 20 * 86400000),
  });

  const pipeline = await Pipeline.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "New patients",
    stages: [
      { id: "new", name: "New", order: 0 },
      { id: "contacted", name: "Contacted", order: 1 },
      { id: "booked", name: "Booked", order: 2 },
      { id: "won", name: "Won", order: 3 },
    ],
  });

  const contacts = await Contact.insertMany([
    {
      agencyId: agency._id,
      subAccountId: dental._id,
      name: "Sam Rivera",
      email: "sam@example.com",
      phone: "+15555550101",
      tags: ["invisalign", "funnel-lead"],
      source: "funnel",
      utm: { source: "meta", campaign: "spring" },
    },
    {
      agencyId: agency._id,
      subAccountId: dental._id,
      name: "Priya Shah",
      email: "priya@example.com",
      phone: "+15555550102",
      tags: ["whitening"],
      source: "booking",
    },
    {
      agencyId: agency._id,
      subAccountId: gym._id,
      name: "Chris Ng",
      email: "chris@example.com",
      phone: "+15555550103",
      tags: ["pt-consult"],
      source: "manual",
    },
  ]);

  await Opportunity.insertMany([
    {
      agencyId: agency._id,
      subAccountId: dental._id,
      pipelineId: pipeline._id,
      stageId: "new",
      contactId: contacts[0]._id,
      title: "Invisalign consult",
      value: 450000,
    },
    {
      agencyId: agency._id,
      subAccountId: dental._id,
      pipelineId: pipeline._id,
      stageId: "booked",
      contactId: contacts[1]._id,
      title: "Whitening package",
      value: 89000,
    },
  ]);

  await Note.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    contactId: contacts[0]._id,
    authorId: clientAdmin._id,
    body: "Asked about evening appointments.",
  });
  await Task.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    contactId: contacts[0]._id,
    assigneeId: clientAdmin._id,
    title: "Send treatment overview",
    dueDate: new Date(Date.now() + 86400000),
    status: "open",
  });

  const form = await Form.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Consult form",
    schema: [
      { id: "name", label: "Name", type: "text", required: true },
      { id: "email", label: "Email", type: "email", required: true },
      { id: "phone", label: "Phone", type: "tel", required: false },
    ],
  });

  await Funnel.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "New patient offer",
    slug: "new-patient",
    steps: [
      {
        slug: "welcome",
        name: "Welcome",
        type: "form",
        formId: form._id,
        content: {
          headline: "Get $99 new-patient exam",
          body: "Leave your details and our front desk will reach out.",
        },
        variants: [
          { id: "a", name: "Control", weight: 70, content: {} },
          { id: "b", name: "Variant", weight: 30, content: {} },
        ],
        analytics: { views: 128, conversions: 17 },
      },
    ],
  });

  await Site.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Bright Smiles",
    slug: "bright-smiles",
    nav: [
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog" },
    ],
    pages: [
      {
        slug: "home",
        title: "Bright Smiles Dental",
        body: "Family dentistry with evening hours and same-week consults.",
        seoTitle: "Bright Smiles Dental",
        seoDescription: "Family dentistry near you.",
      },
    ],
    blogPosts: [
      {
        slug: "whitening-tips",
        title: "Three whitening tips",
        excerpt: "Keep your smile camera-ready.",
        body: "Skip staining drinks before photos and keep a consistent routine.",
        status: "published",
        publishedAt: new Date(),
      },
    ],
  });

  const calendar = await Calendar.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    ownerUserId: clientAdmin._id,
    name: "Exam rooms",
    slug: "bright-smiles-exam",
    slotDuration: 30,
    availabilityRules: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      start: "09:00",
      end: "17:00",
    })),
  });

  await Appointment.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    calendarId: calendar._id,
    contactId: contacts[1]._id,
    guestName: contacts[1].name,
    guestEmail: contacts[1].email,
    startTime: new Date(Date.now() + 2 * 86400000),
    endTime: new Date(Date.now() + 2 * 86400000 + 30 * 60000),
    status: "booked",
  });

  await Workflow.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Lead follow-up",
    trigger: "lead.captured",
    active: true,
    steps: [
      {
        type: "message",
        channel: "sms",
        delaySeconds: 0,
        template: "Hi {{name}}, this is Bright Smiles. Want to book your exam? Reply STOP to opt out.",
      },
      {
        type: "message",
        channel: "email",
        delaySeconds: 3600,
        subject: "Your exam offer",
        template: "Hi {{name}}, here is the $99 new-patient exam we mentioned.",
      },
    ],
  });
  await Workflow.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Ask for a review",
    trigger: "opportunity.won",
    active: true,
    steps: [
      {
        type: "message",
        channel: "sms",
        delaySeconds: 0,
        template: "Thanks {{name}}! Would you leave a Google review? {{reviewLink}}",
      },
    ],
  });
  await Workflow.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "No-show rebook",
    trigger: "appointment.no_show",
    active: true,
    steps: [
      {
        type: "message",
        channel: "sms",
        delaySeconds: 0,
        template: "We missed you today {{name}}. Reply with a better time and we will rebook.",
      },
    ],
  });
  await Workflow.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Appointment confirmation",
    trigger: "appointment.created",
    active: true,
    steps: [
      {
        type: "message",
        channel: "sms",
        delaySeconds: 0,
        template: "Hi {{name}}, your Bright Smiles visit is confirmed. Reply STOP to opt out.",
      },
      {
        type: "message",
        channel: "email",
        delaySeconds: 30,
        subject: "You're booked",
        template: "Hi {{name}}, we saved your exam slot. A reminder will arrive 24 hours before.",
      },
    ],
  });
  await Workflow.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Missed-call text-back",
    trigger: "missed_call",
    active: true,
    steps: [
      {
        type: "message",
        channel: "sms",
        delaySeconds: 0,
        template: "Sorry we missed your call, {{name}}! Text us a good time and we will book you in.",
      },
    ],
  });
  await Workflow.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    name: "Failed payment dunning",
    trigger: "payment.failed",
    active: true,
    steps: [
      {
        type: "message",
        channel: "email",
        delaySeconds: 0,
        subject: "Payment needs attention",
        template: "Hi {{name}}, a payment for your location plan failed. Update the card to avoid a pause.",
      },
    ],
  });
  await Workflow.create({
    agencyId: agency._id,
    subAccountId: gym._id,
    name: "Fitness lead nurture",
    trigger: "lead.captured",
    active: true,
    steps: [
      {
        type: "message",
        channel: "sms",
        delaySeconds: 0,
        template: "Hey {{name}} — Northside Fitness here. Want a free PT intro this week?",
      },
    ],
  });

  await Message.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    contactId: contacts[0]._id,
    channel: "sms",
    direction: "outbound",
    body: "Hi Sam, thanks for requesting the exam.",
    status: "sent",
    providerMessageId: "seed-sms-1",
  });
  await Review.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    contactId: contacts[1]._id,
    platform: "google",
    requestSentAt: new Date(),
    link: dental.googleReviewUrl,
    token: "seed-review-1",
  });

  const ad = await AdAccount.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    provider: "meta",
    accountId: "act_demo",
    accountName: "Bright Smiles Ads",
    oauthTokens: encryptAtRest("seed-refresh"),
    connected: true,
  });
  await AdCampaign.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    adAccountId: ad._id,
    name: "Spring new-patient",
    spend: 186000,
    leadsCount: 42,
    pipelineValue: 980000,
    syncedAt: new Date(),
  });

  await UsageLedger.insertMany([
    {
      agencyId: agency._id,
      subAccountId: dental._id,
      type: "sms",
      quantity: 24,
      vendorCost: 0.19,
      billedRate: 0.48,
      periodKey: periodKey(),
    },
    {
      agencyId: agency._id,
      subAccountId: dental._id,
      type: "email",
      quantity: 80,
      vendorCost: 0.06,
      billedRate: 0.4,
      periodKey: periodKey(),
    },
    {
      agencyId: agency._id,
      subAccountId: dental._id,
      type: "ai",
      quantity: 12,
      vendorCost: 0.024,
      billedRate: 0.24,
      periodKey: periodKey(),
    },
  ]);

  const course = await Course.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    title: "Home care basics",
    slug: "home-care",
    description: "A short course for new patients.",
    priceType: "free",
    modules: [
      {
        title: "Week 1",
        lessons: [
          { title: "Brushing", type: "text", body: "Two minutes, twice a day." },
          { title: "Flossing", type: "text", body: "Once daily, gently." },
        ],
      },
    ],
  });
  await Enrollment.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    courseId: course._id,
    email: "sam@example.com",
    name: "Sam Rivera",
    status: "active",
    progress: { "0-0": true },
  });
  await CommunityPost.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    courseId: course._id,
    authorName: "Dr. Maya Patel",
    title: "Welcome new patients",
    body: "Post questions about your first week of home care here.",
    comments: [{ authorName: "Sam Rivera", body: "Do electric brushes count?" }],
  });

  await AiBotConfig.create({
    agencyId: agency._id,
    subAccountId: dental._id,
    persona: "You are the Bright Smiles front-desk assistant. Be warm and concise.",
    qualifyingScript: "Collect name, email, and preferred appointment window.",
    brandVoice: "Warm, clinical, never salesy.",
    channelsEnabled: ["web", "sms"],
    calendarId: calendar._id,
  });

  console.log("Seeded MacroGen AgencyOS");
  console.log("  super@macrogen.local / Demo1234!");
  console.log("  admin@macrogen.local / Demo1234!");
  console.log("  staff@macrogen.local / Demo1234!");
  console.log("  client@brightsmiles.local / Demo1234!");
  console.log("  front@brightsmiles.local / Demo1234!");
  console.log("  owner@northside.local / Demo1234!");
  console.log("  Funnel: /f/new-patient/welcome");
  console.log("  Booking: /book/bright-smiles-exam");
  console.log("  Site: /s/bright-smiles");
  console.log("  Course: /c/home-care");
  void superAdmin;
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
