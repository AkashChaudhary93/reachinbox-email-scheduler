# ReachInbox Email Scheduler

Production-grade email scheduling service + dashboard built for the ReachInbox / Outbox Labs internship assignment.

Users sign in with Google, schedule single or bulk emails, and track queued/delivered status. Delayed delivery is handled by **BullMQ + Redis** (no cron). Emails are sent through **Ethereal** by default, with optional real SMTP.

---

## Tech Stack

**Backend**
- Node.js + TypeScript
- Express
- MongoDB + Mongoose
- Redis + BullMQ
- Passport.js (Google OAuth 2.0)
- express-session + connect-mongo
- Nodemailer (Ethereal / SMTP)
- Multer (CSV upload)

**Frontend**
- React 18 + TypeScript
- Vite
- React Router
- Axios
- Hand-written CSS design system (no UI framework)

---

## Architecture

```
┌────────────────────┐        ┌─────────────────────┐
│  React dashboard   │───────▶│  Express API        │
│  (Vite)            │  HTTPS │  /auth /emails      │
└────────────────────┘        └─────────┬───────────┘
                                        │
                     ┌──────────────────┼───────────────────┐
                     ▼                  ▼                   ▼
              ┌────────────┐    ┌────────────┐      ┌────────────┐
              │  MongoDB   │    │   Redis    │      │ Ethereal / │
              │  emails +  │    │ BullMQ     │      │ real SMTP  │
              │  sessions  │    │ delayed    │      └─────▲──────┘
              └────────────┘    │ jobs       │            │
                                └─────┬──────┘            │
                                      ▼                   │
                                ┌────────────┐            │
                                │  Worker    │────────────┘
                                │  process   │  sends + updates status
                                └────────────┘
```

### Request flow
1. User signs in with Google → Passport creates a server-side session (stored in MongoDB).
2. `POST /emails/schedule` (or `/bulk`, `/upload`) validates input, writes an `Email` document with `status=scheduled`, and enqueues a BullMQ job with `delay = scheduledAt - now`.
3. The worker (separate process) picks up the job when the delay expires, sends via Nodemailer, then updates the document to `sent` with `sentAt` and (Ethereal only) `previewUrl`.
4. Retries use exponential backoff. Final failures are marked `failed` with the error message.
5. Delayed jobs live in Redis, so restarting the API or worker does **not** lose scheduled emails.

### Why this is restart-safe
BullMQ persists delayed jobs in Redis. The API only creates the job; the worker consumes it. Both processes can restart independently — Redis holds the schedule, MongoDB holds the email state.

---

## Features

- Google OAuth login with server-side sessions.
- Compose single emails with a future send time.
- Bulk scheduling by pasting recipients (one per line or comma-separated).
- CSV/TXT upload (first column = email, header auto-skipped).
- Automatic spacing between bulk recipients to respect rate limits.
- BullMQ delayed jobs — no cron, no polling loop.
- Separate worker process with concurrency + hourly limiter.
- Ethereal sandbox by default; real SMTP via env vars.
- Dashboard: stat cards, search, queued/delivered tabs, detail drawer.
- Responsive UI: desktop table, mobile cards, bottom navigation.
- Restart-safe: Redis keeps pending jobs, Mongo keeps state.
- Session store in MongoDB (survives backend restarts).

---

## Project Structure

```
reachinbox-email-scheduler/
├── backend/
│   ├── src/
│   │   ├── config.ts            # env config
│   │   ├── db.ts                # Mongo connection
│   │   ├── redis.ts             # ioredis connection
│   │   ├── queue.ts             # BullMQ queue + job type
│   │   ├── index.ts             # Express app
│   │   ├── models/Email.ts      # email schema
│   │   ├── routes/auth.ts       # Google OAuth + session
│   │   ├── routes/emails.ts     # schedule / bulk / upload / lists
│   │   ├── middleware/auth.ts   # requireAuth
│   │   ├── services/mailer.ts   # Ethereal or real SMTP
│   │   └── workers/emailWorker.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── components/Shell.tsx
│   │   ├── components/Icons.tsx
│   │   ├── pages/Login.tsx
│   │   ├── pages/Dashboard.tsx
│   │   ├── pages/Compose.tsx
│   │   └── styles.css
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── docker-compose.yml           # Redis + Mongo for local dev
├── render.yaml                  # Render blueprint
├── netlify.toml
├── GOOGLE_OAUTH_SETUP.md
├── SUBMISSION_GUIDE.md
├── WHAT_WAS_BUILT.md
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Docker (recommended) for Redis + MongoDB
- Google OAuth credentials (see `GOOGLE_OAUTH_SETUP.md`)

### 1. Start Redis + MongoDB
```bash
docker compose up -d
```
Or install Redis/Mongo locally and use the default URLs.

### 2. Backend
```bash
cd backend
cp .env.example .env
# fill GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET
npm install
npm run build
npm start
```

### 3. Worker (separate terminal)
```bash
cd backend
npm run worker
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

---

## Environment Variables

### Backend (`backend/.env`)
| Key | Purpose |
|---|---|
| `PORT` | API port (default 4000) |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis URL used by BullMQ |
| `SESSION_SECRET` | Long random string for session signing |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GOOGLE_CALLBACK_URL` | Must match Google console redirect URI |
| `FRONTEND_URL` | Frontend origin for OAuth redirect |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `COOKIE_SECURE` | `true` on HTTPS production |
| `COOKIE_SAMESITE` | `none` for cross-site production cookies |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Real SMTP (leave blank for Ethereal) |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP credentials |
| `EMAIL_RATE_PER_HOUR` | Worker limiter |
| `MIN_DELAY_BETWEEN_EMAILS_MS` | Bulk spacing |

### Frontend (`frontend/.env`)
| Key | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL |

---

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | no | Health check |
| GET | `/auth/google` | no | Start Google OAuth |
| GET | `/auth/google/callback` | no | OAuth callback |
| GET | `/auth/me` | session | Current user |
| POST | `/auth/logout` | session | Destroy session |
| POST | `/emails/schedule` | yes | Schedule one email |
| POST | `/emails/bulk` | yes | Schedule many recipients |
| POST | `/emails/upload` | yes | CSV/TXT upload |
| GET | `/emails/scheduled` | yes | Queued + failed emails |
| GET | `/emails/sent` | yes | Sent emails |
| GET | `/emails/:id` | yes | One email |

### Schedule request
```json
{
  "to": "user@example.com",
  "subject": "Hello",
  "body": "Message body",
  "scheduledAt": "2026-10-25T10:00:00.000Z"
}
```

### Bulk request
```json
{
  "recipients": ["a@example.com", "b@example.com"],
  "subject": "Hello",
  "body": "Message body",
  "startTime": "2026-10-25T10:00:00.000Z",
  "delayBetweenMs": 2000
}
```

---

## Email Providers

**Ethereal (default)**
Leave `SMTP_HOST` empty. The worker creates a test account automatically, sends the email, and logs a preview URL. The dashboard shows a preview link only when one exists.

**Gmail SMTP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=you@gmail.com
```
Requires 2-Step Verification + a Google App Password. Restart the worker after changing env vars.

---

## Deployment

See `SUBMISSION_GUIDE.md` for the full click-by-click deployment and submission checklist.

Quick path:
1. MongoDB Atlas free cluster → copy connection string.
2. Upstash Redis free database → copy TLS connection string (`rediss://`).
3. Render → deploy backend from `render.yaml` (API + worker in one service via `start:all`).
4. Vercel/Netlify → deploy `frontend` with `VITE_API_URL` set to the Render URL.
5. Add the production callback URL to Google OAuth authorized redirect URIs.
6. Set `FRONTEND_URL`, `ALLOWED_ORIGINS`, `GOOGLE_CALLBACK_URL` on Render.

---

## Scripts

### Backend
| Script | Description |
|---|---|
| `npm run dev` | API with ts-node-dev |
| `npm run build` | Compile TypeScript |
| `npm start` | API only |
| `npm run worker` | Worker only |
| `npm run start:all` | API + worker together (single-service hosting) |

### Frontend
| Script | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
