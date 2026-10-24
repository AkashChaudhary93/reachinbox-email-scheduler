# Submission Guide — ReachInbox Assignment

Deadline per the shortlist email: **25 October 2026, 12:00 PM**. Submit within 24 hours of opening the link.

---

## 1. Submission Checklist

- [ ] Complete code pushed to GitHub
- [ ] README includes setup, architecture, features, API
- [ ] Hosted assignment URL works end-to-end
- [ ] Demo video recorded with subtitles/captions
- [ ] GitHub access granted to `mitrajit` and `Yadav036`
- [ ] Repo is public **or** both users are invited as collaborators
- [ ] You can explain every file and decision in the interview
- [ ] Submission link/email sent before the deadline

---

## 2. Push to GitHub

From the project root:

```bash
git init
git add .
git commit -m "ReachInbox email scheduler: BullMQ + Redis + React dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then:
1. Open the repo → **Settings → Collaborators → Add people**.
2. Add `mitrajit` and `Yadav036` with **Read** access.
3. Confirm the repo is visible to them (public is simplest).

> Do not commit `.env`. It is already in `.gitignore`.

---

## 3. Hosting (free-tier path)

### 3.1 MongoDB Atlas
1. https://cloud.mongodb.com → create a free **M0** cluster.
2. **Database Access** → add a user with a strong password.
3. **Network Access** → allow `0.0.0.0/0` for the demo.
4. **Connect → Drivers** → copy the URI:
   ```
   mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/reachinbox?retryWrites=true&w=majority
   ```

### 3.2 Upstash Redis
1. https://upstash.com → create a free Redis database.
2. Copy the **TLS** connection string:
   ```
   rediss://default:<password>@<host>:<port>
   ```
   BullMQ/ioredis works with `rediss://` out of the box.

### 3.3 Backend on Render
Option A — Blueprint (recommended):
1. Push `render.yaml` to GitHub.
2. Render → **New → Blueprint** → select the repo.
3. Fill the secret env vars:
   - `MONGO_URI`
   - `REDIS_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL` = `https://<render-service>.onrender.com/auth/google/callback`
   - `FRONTEND_URL` = `https://<vercel-app>.vercel.app`
   - `ALLOWED_ORIGINS` = `https://<vercel-app>.vercel.app`
   - `SMTP_*` if using Gmail, or leave blank for Ethereal
4. Deploy. Confirm `https://<render-service>.onrender.com/health` returns `{ ok: true }`.

Option B — Manual web service:
- Root directory: `backend`
- Build: `npm install && npm run build`
- Start: `npm run start:all`
- Health check: `/health`
- Set the same env vars. Ensure `NODE_ENV=production`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`.

> Free Render web services sleep after inactivity. The first request may take ~30–60s. For the demo, open the site a minute before recording so it is awake.

### 3.4 Frontend on Vercel
1. Vercel → **Add New → Project** → import the repo.
2. Root directory: `frontend`.
3. Framework preset: Vite.
4. Environment variable:
   ```
   VITE_API_URL=https://<render-service>.onrender.com
   ```
5. Deploy. `vercel.json` already rewrites all routes to `index.html`.

Netlify alternative: import repo, it uses the root `netlify.toml` (`base=frontend`, publish `dist`).

### 3.5 Update Google OAuth
Google Cloud Console → **Google Auth Platform → Clients → your web client**:
- **Authorized JavaScript origins** add:
  ```
  https://<vercel-app>.vercel.app
  ```
- **Authorized redirect URIs** add:
  ```
  https://<render-service>.onrender.com/auth/google/callback
  ```
- **Audience → Test users** add the Gmail you will sign in with.

### 3.6 Hosted smoke test
1. Open the Vercel URL.
2. Sign in with Google.
3. Schedule an email 1–2 minutes in the future.
4. Watch the Queued tab → after send time, refresh → Delivered.
5. Open the detail drawer.
6. Restart the Render service, then schedule another email and confirm it still sends. This proves Redis persistence.

---

## 4. Demo Video Script (with captions)

Aim for **4–6 minutes**. Record 1080p, show the cursor, and add captions for every section. Keep the app already open and the backend awake.

### 0:00 — Intro (10s)
**Caption:** "Hi, I'm <name>. This is my ReachInbox email scheduler: React dashboard, Express API, BullMQ + Redis delayed jobs, MongoDB persistence, and Ethereal/Gmail SMTP."

### 0:10 — Architecture (35s)
Show the README diagram or draw it.
**Caption:** "The API writes an email document and enqueues a delayed BullMQ job. Redis holds the delay. A separate worker consumes the job, sends with Nodemailer, and updates the document to sent. Because the schedule lives in Redis, restarts don't lose jobs."

### 0:45 — Google login (15s)
Click **Continue with Google**.
**Caption:** "Google OAuth via Passport. The session is stored server-side in MongoDB, so the login survives backend restarts."

### 1:00 — Compose single email (45s)
- Point at the live preview.
- Fill recipient, subject, body.
- Set send time ~1 minute ahead.
- Click **Schedule email**.
**Caption:** "The schedule endpoint validates input, creates a scheduled email, and adds a BullMQ job with delay equal to send time minus now. The dashboard immediately shows it under Queued."

### 1:45 — Bulk + CSV (45s)
Switch to **Bulk**, paste 2–3 emails, schedule.
Then switch to **CSV**, upload a small file.
**Caption:** "Bulk mode spaces recipients by a configurable delay. CSV mode parses the first column server-side with Multer and schedules each row."

### 2:30 — Worker + delivery (45s)
Show the worker terminal:
```
Processing email ... -> ...
Sent ... Preview: undefined
Job ... completed
```
Then refresh the dashboard.
**Caption:** "The worker runs as a separate process with concurrency and an hourly limiter. It updates the email to sent and stores the send timestamp. With Gmail SMTP there is no preview URL; with Ethereal the worker returns one."

### 3:15 — Detail drawer (20s)
Click a row.
**Caption:** "Rows open a detail drawer with recipient, status, timestamps, body, and any error. The old preview column was removed because real SMTP has no preview page."

### 3:35 — Restart safety (45s)
Restart the Render service (or stop/start the worker locally), then schedule another email.
**Caption:** "This is the important part: delayed jobs are persisted in Redis. Restarting the API or worker does not drop the schedule. The job fires when the delay expires."

### 4:20 — Code walkthrough (45s)
Open these files briefly:
- `backend/src/queue.ts` — job options, retries, backoff
- `backend/src/routes/emails.ts` — delay calculation
- `backend/src/workers/emailWorker.ts` — send + status update
- `backend/src/services/mailer.ts` — Ethereal/SMTP switch
**Caption:** "The queue uses three attempts with exponential backoff. The worker marks final failures and stores the error."

### 5:05 — Close (10s)
**Caption:** "That's the scheduler. Thanks for watching."

### Caption tips
- Use CapCut / Clipchamp / DaVinci Resolve auto-captions, then correct them.
- Large font, bottom center, high contrast.
- Keep each caption under ~12 words.

---

## 5. Technical Interview Prep

Be ready to explain these in your own words. Do not memorize — understand.

### Q: Why BullMQ instead of cron?
Cron polls on a fixed interval and is hard to make durable per-job. BullMQ stores each delayed job in Redis with its own timestamp, retries, and state. It survives restarts and scales with workers.

### Q: How is a delay calculated?
```ts
const delay = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
await emailQueue.add("send-email", data, { delay });
```

### Q: What happens if the worker crashes mid-send?
BullMQ keeps the job in an active/locked state. If the lock expires, the job is retried (up to `attempts: 3`). The email document is only marked `sent` after `sendMail` resolves. A crash before that leaves it scheduled; a crash after send but before the DB update could cause a duplicate send — a real system would add an idempotency key / sent flag check.

### Q: Why MongoDB?
Flexible document shape for email metadata, simple indexing on `userId`, `status`, `scheduledAt`, and it doubles as the session store via connect-mongo.

### Q: Why a separate worker?
Sending email is slow and failure-prone. Keeping it out of the API process means HTTP requests stay fast and the worker can scale independently. The worker also holds the rate limiter.

### Q: How do you prevent duplicate sends?
Current implementation relies on BullMQ's job lifecycle. To harden it: store a unique `jobId` on the email, check `status` before sending, and use an idempotency key with the provider.

### Q: How would you scale to 1M emails?
- Partition queues by tenant or campaign.
- Increase worker concurrency, use Redis Cluster.
- Batch DB writes, add indexes, archive old emails.
- Use a real ESP (SES/SendGrid) with webhooks for delivery events.
- Add per-tenant rate limits and a dead-letter queue.

### Q: Security decisions?
- OAuth only; no passwords stored.
- Server-side sessions in Mongo.
- `requireAuth` on every email route.
- Emails scoped by `userId`.
- CORS allow-list.
- Cookies: `httpOnly`, `secure`, `sameSite=none` in production for cross-site frontend/backend.
- `.env` gitignored.
- Input validation on required fields and dates.

### Q: Known limitations?
- No email verification / unsubscribe flow.
- No idempotency key against duplicate sends on crash-after-send.
- No retry UI or cancel-scheduled-email action.
- Free Render service sleeps, so the worker sleeps too.
- No automated tests yet.

### Q: What would you add next?
Cancel/reschedule endpoints, campaign grouping, delivery webhooks, per-user rate limits, tests with Vitest/Supertest, and a proper queue dashboard (Bull Board).

---

## 6. "No AI Dump" — How to Own It

Before submitting, do this:
1. Read every file once, top to bottom.
2. Change at least one thing yourself (copy, color, validation message, extra field).
3. Be able to trace one email: click → API → Mongo → Redis job → worker → SMTP → status update.
4. Run the app locally and break something on purpose, then fix it.
5. Practice the 4-minute walkthrough without notes.

If you cannot explain a line, remove or rewrite it until you can.

---

## 7. Final Submission Message (template)

```
Hi team,

Sharing my submission for the ReachInbox Full-stack Email Scheduler assignment.

Hosted app: https://<vercel-app>.vercel.app
GitHub: https://github.com/<user>/<repo>
Demo video: <link>

Stack: React + TypeScript, Express + TypeScript, MongoDB, Redis + BullMQ, Passport Google OAuth, Nodemailer (Ethereal/Gmail SMTP).

Highlights: persistent delayed jobs, separate worker, restart-safe scheduling, bulk/CSV sends, responsive dashboard.

I've invited mitrajit and Yadav036 to the repository.

Thanks,
<name>
```
