# MacroGen AgencyOS

Multi-tenant, white-label agency operating system (GoHighLevel-style) built with **Next.js 14 App Router**, **MongoDB**, and **Vercel**.

The app runs locally with only `MONGODB_URI` and an auth secret. Twilio, Mailgun, Stripe, Meta, Google, and OpenAI are live when their env vars are set; otherwise adapters return deterministic mocks.

## Features (BR-01 – BR-15)

- Lead capture funnels + UTM attribution
- Workflows (SMS/email/voicemail/Messenger) on a Mongo job queue
- Review-request workflows and click tracking (`/r/[token]`)
- Ads account connect + campaign dashboard
- White-label branding (logo, colors, custom domain, sender identity)
- Plans, location subscriptions, usage ledger + markup
- CRM contacts, notes, tasks, pipeline Kanban
- Calendars and public booking with reminders / no-show follow-up
- Missed-call text-back webhook + test enqueue
- Client sites + blog (ISR-style revalidate)
- Courses, enrollment, community threads
- AI bot (web chat) and content studio (drafts only)

## Setup

```bash
cp .env.example .env.local
# set MONGODB_URI, NEXTAUTH_SECRET, AUTH_SECRET
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins (password `Demo1234!`)

| Email | Role |
| --- | --- |
| `super@macrogen.local` | Super Admin |
| `admin@macrogen.local` | Agency Admin |
| `staff@macrogen.local` | Agency Staff |
| `client@brightsmiles.local` | Sub-Account Admin |
| `front@brightsmiles.local` | Sub-Account Staff |
| `owner@northside.local` | Sub-Account Admin (gym) |

Full catalog (users, workflows, CRM, public URLs): [docs/SAMPLE-DATA.md](docs/SAMPLE-DATA.md).  
Walkthrough PDF with screenshots: [docs/AgencyOS-Sample-Data.pdf](docs/AgencyOS-Sample-Data.pdf).

Public demo URLs after seed:

- Funnel: `/f/new-patient/welcome`
- Booking: `/book/bright-smiles-exam`
- Site: `/s/bright-smiles`
- Course: `/c/home-care`

## Scripts

- `npm run dev` — local server
- `npm run seed` — reset demo tenants and sample data
- `npm run export-pdf` — rebuild `docs/AgencyOS-Sample-Data.pdf` from screenshots
- `npm run lint` / `npm run typecheck` — CI checks
- `npm run build` — production build

## Vercel

Connect the Git repo and set **Framework Preset** to **Next.js**. Leave **Output Directory** empty (do not set it to `public` — that folder is only for static files; Next.js output lives in `.next`).

Set the same env vars in Project Settings. `vercel.json` schedules:

- `/api/cron/reminders` every 5 minutes (workflow steps + appointment reminders)
- `/api/cron/usage` daily (usage rollup)
- `/api/cron/subscriptions` daily (dunning / restrict after grace)

If `CRON_SECRET` is set, send `Authorization: Bearer <secret>`.

## Webhooks

- `POST /api/webhooks/twilio` — inbound SMS (`STOP` opts out) and missed-call status
- `POST /api/webhooks/stripe` — subscription status sync
- `GET|POST /api/webhooks/meta` — Lead Ads + Messenger verify

## Not in this phase

Vercel Domains API auto-attach, production Meta App Review / Google Ads developer-token sync, ringless voicemail audio, and a pixel-perfect visual funnel builder (structured step editor instead).
