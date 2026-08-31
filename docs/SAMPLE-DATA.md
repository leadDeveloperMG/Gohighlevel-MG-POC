# MacroGen AgencyOS — Sample data catalog

This document describes every demo tenant, user, workflow, and record created by `npm run seed`. All credential passwords are `Demo1234!`.

Re-seed at any time (this **replaces** demo collections):

```bash
npm run seed
```

MongoDB database: `agencyos` (`mongodb://127.0.0.1:27017/agencyos`).

---

## 1. Tenants

### Agency — MacroGen

| Field | Value |
| --- | --- |
| Name | MacroGen |
| Role in demo | White-label agency (reseller) |
| Sender name / email | MacroGen / hello@macrogen.local |
| SMS number | +15555550199 |
| Brand colors | Primary `#0f766e`, accent `#14b8a6` |
| Usage markup | SMS $0.02, email $0.005, AI $0.02 |

### Sub-accounts (locations)

| Location | Plan | Timezone | Status | Reviews |
| --- | --- | --- | --- | --- |
| Bright Smiles Dental | Growth ($149/mo) | America/New_York | active | Google + Facebook URLs |
| Northside Fitness | Scale ($299/mo) | America/Chicago | active | Google URL |

---

## 2. Users

| Name | Email | Role | Scope | What they can do |
| --- | --- | --- | --- | --- |
| Platform Operator | `super@macrogen.local` | Super Admin | All agencies | Agencies console + every module |
| Ava Chen | `admin@macrogen.local` | Agency Admin | MacroGen | Branding, plans, all locations |
| Jordan Lee | `staff@macrogen.local` | Agency Staff | MacroGen | Build funnels/workflows (no billing settings) |
| Dr. Maya Patel | `client@brightsmiles.local` | Sub-Account Admin | Bright Smiles | Location CRM, calendar, billing |
| Front Desk | `front@brightsmiles.local` | Sub-Account Staff | Bright Smiles | Contacts, pipeline, calendar, tasks |
| Alex Morgan | `owner@northside.local` | Sub-Account Admin | Northside Fitness | Location admin for the gym |

Password for every account: **`Demo1234!`**

Recommended walkthrough login: `admin@macrogen.local`.

---

## 3. Sample workflows

All Bright Smiles workflows are **active**. Tokens: `{{name}}`, `{{reviewLink}}`. `STOP` on inbound SMS opts the contact out.

| Workflow | Location | Trigger | Channel sequence | Purpose |
| --- | --- | --- | --- | --- |
| Lead follow-up | Bright Smiles | `lead.captured` | SMS immediately, email after 1 hour | New funnel/CRM lead outreach |
| Appointment confirmation | Bright Smiles | `appointment.created` | SMS immediately, email after 30s | Booking confirmation |
| Ask for a review | Bright Smiles | `opportunity.won` | SMS with Google review link | Reputation after a won deal |
| No-show rebook | Bright Smiles | `appointment.no_show` | SMS immediately | Rebook missed visits |
| Missed-call text-back | Bright Smiles | `missed_call` | SMS immediately | Twilio no-answer / test enqueue |
| Failed payment dunning | Bright Smiles | `payment.failed` | Email immediately | Stripe past-due / grace |
| Fitness lead nurture | Northside Fitness | `lead.captured` | SMS immediately | Gym-specific first touch |

### How a run works

1. An event (form submit, booking, Kanban → Won, Twilio webhook, Stripe past_due) calls `startWorkflowsForTrigger`.
2. A `workflowRuns` document is created.
3. A `jobs` row is queued (`workflow.step`) at `now + delaySeconds`.
4. `/api/cron/reminders` (every 5 minutes) or an inline `processDueJobs` after public forms/booking executes the step.
5. A `messages` timeline row is written; SMS/email/AI increment `usageLedger`.

---

## 4. CRM and pipeline (Bright Smiles)

Pipeline **New patients**: New → Contacted → Booked → Won.

| Contact | Email / phone | Source | Tags | Deal |
| --- | --- | --- | --- | --- |
| Sam Rivera | sam@example.com / +15555550101 | funnel (UTM meta/spring) | invisalign, funnel-lead | Invisalign consult $4,500 — **New** |
| Priya Shah | priya@example.com / +15555550102 | booking | whitening | Whitening package $890 — **Booked** |

Northside Fitness contact: **Chris Ng** (`chris@example.com`) tagged `pt-consult`.

Also seeded: note on Sam (“evening appointments”), open task “Send treatment overview”, outbound SMS on Sam’s timeline.

---

## 5. Public surfaces

| Surface | URL | Seeded content |
| --- | --- | --- |
| Funnel | `/f/new-patient/welcome` | $99 exam form; 128 views / 17 conversions; A/B 70/30 |
| Booking | `/book/bright-smiles-exam` | Mon–Fri 09:00–17:00, 30-min slots |
| Site | `/s/bright-smiles` | Home + published post “Three whitening tips” |
| Course | `/c/home-care` | Free “Home care basics”; Sam enrolled |
| Review click | `/r/seed-review-1` | Tracks click then redirects to Google |

Priya has a **booked** exam ~2 days out (reminders scheduled when new bookings are created).

---

## 6. Billing, ads, AI

- Plans: **Growth** $149/mo, **Scale** $299/mo.
- Bright Smiles subscription: active, ~20 days remaining.
- Usage this period: 24 SMS, 80 email, 12 AI (vendor vs billed rates).
- Meta ads: “Bright Smiles Ads” connected; campaign **Spring new-patient** ($1,860 spend, 42 leads, $9,800 pipeline).
- AI bot: Bright Smiles front-desk persona, booking calendar attached, brand voice “warm, clinical”.
- Community thread: “Welcome new patients” with one comment from Sam.

---

## 7. Screenshot tour (PDF)

The export `docs/AgencyOS-Sample-Data.pdf` includes live captures of:

1. Landing
2. Login
3. Overview
4. Contacts
5. Contact timeline (Sam Rivera)
6. Pipeline Kanban
7. Workflows
8. Public funnel
9. Public booking
10. Calendar, billing, usage, ads, AI (as space allows)

---

## 8. Collections written by seed

`agencies`, `subaccounts`, `users`, `plans`, `subscriptions`, `contacts`, `pipelines`, `opportunities`, `notes`, `tasks`, `forms`, `funnels`, `sites`, `calendars`, `appointments`, `workflows`, `messages`, `reviews`, `adaccounts`, `adcampaigns`, `usageledgers`, `courses`, `enrollments`, `communityposts`, `aibotconfigs`.
