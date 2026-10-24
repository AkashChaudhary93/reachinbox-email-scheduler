# ReachInbox Email Scheduler — What Was Built

## Overview
A production-grade full-stack email scheduler. Users sign in with Google, compose single or bulk emails, schedule them for a future time, and track scheduled/sent status. Emails are processed by a separate BullMQ worker backed by Redis, sent through Ethereal (fake SMTP), and survive server restarts without losing jobs.

## Repository Layout
```
reachinbox-email-scheduler/
├── backend/                  # Node + TypeScript + Express API + worker
├── frontend/                 # React + TypeScript (Vite) dashboard
├── docker-compose.yml        # Redis + MongoDB
├── README.md                 # Setup & run instructions
├── .gitignore
└── GOOGLE_OAUTH_SETUP.md     # How to create Google OAuth credentials
```

## Backend (`backend/`)
- `src/index.ts` — Express app: CORS, sessions (Mongo store), Passport, routes, health check.
- `src/config.ts` — Env-driven config (ports, Mongo/Redis URLs, OAuth, rate limits).
- `src/db.ts` — Mongoose connection.
- `src/redis.ts` — ioredis connection (maxRetriesPerRequest null for BullMQ).
- `src/queue.ts` — BullMQ `email-sending` queue + `EmailJobData` type.
- `src/models/Email.ts` — Email document: userId, to, subject, body, scheduledAt, status (scheduled/sent/failed), jobId, previewUrl, error, sentAt.
- `src/services/mailer.ts` — Ethereal SMTP (auto-creates test account) or real SMTP via env.
- `src/routes/auth.ts` — Google OAuth login/callback, `/me`, logout.
- `src/routes/emails.ts` — `/schedule`, `/bulk`, `/upload` (CSV), `/scheduled`, `/sent`, `/:id`.
- `src/workers/emailWorker.ts` — Separate BullMQ worker process; sends email, updates status, logs Ethereal preview URL, handles retries/failures.
- `src/middleware/auth.ts` — `requireAuth` guard.

## Frontend (`frontend/`)
- `src/App.tsx` — Routing, session bootstrap, branded loading screen.
- `src/components/Shell.tsx` — Responsive app shell: sidebar nav, user chip, mobile bottom nav.
- `src/components/Icons.tsx` — Inline SVG icon set (no icon dependency).
- `src/pages/Login.tsx` — Split hero + Google sign-in card with animated aurora background.
- `src/pages/Dashboard.tsx` — Stat cards (Queued/Delivered/Failed/Total), search, segmented tabs, desktop table, mobile email cards, slide-over detail drawer with body + error.
- `src/pages/Compose.tsx` — Single/Bulk/CSV modes, dropzone upload, live email preview, toast notifications, validation.
- `src/api.ts` — Axios client (withCredentials) + `User` / `Email` types.
- `src/styles.css` — Design tokens, dark glass UI, gradients, responsive breakpoints, reduced-motion support.

## UI Features
- Dark operator-console theme with violet→cyan accents.
- Responsive: sidebar on desktop, bottom nav + card list on mobile.
- Smooth fade/slide animations, hover states, skeleton loading, rolling spinner.
- Detail drawer replaces the old Preview column; sandbox preview link only appears when Ethereal returns one.
- Live compose preview, recipient counter, toast feedback, empty states.

## Key Features
- Google OAuth (session cookies, shared frontend/backend).
- Single + bulk scheduling with per-recipient delay.
- CSV/TXT bulk upload (header auto-skipped).
- BullMQ delayed jobs (no cron).
- Redis persistence → survives restarts.
- Ethereal SMTP → preview URLs in worker logs + dashboard.
- Rate limiting via BullMQ limiter.
- Retry with exponential backoff; failed status recorded.
- MongoDB for email metadata + session store.

## Verified
- TypeScript builds clean (backend + frontend).
- Backend boots, connects to Redis + Mongo.
- End-to-end: schedule → worker processes → Ethereal preview URL stored in DB.

## Run
See `README.md`.
