# Google OAuth Setup (for ReachInbox Email Scheduler)

Follow these steps to create Google OAuth 2.0 credentials and plug them into the backend.

## 1. Create a Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click **Select a project** → **New Project**.
3. Name it (e.g. `reachinbox-email-scheduler`) and click **Create**.

## 2. Configure the OAuth Consent Screen
1. In the left menu: **APIs & Services → OAuth consent screen**.
2. Choose **External** (for testing) and click **Create**.
3. Fill:
   - App name: `ReachInbox Email Scheduler`
   - User support email: your email
   - Developer contact email: your email
4. Click **Save and Continue** through Scopes (no scopes needed beyond profile/email, default).
5. Under **Test users**, add your Gmail address (required while in Testing mode).
6. Click **Save and Continue** → **Back to Dashboard**.

## 3. Create OAuth 2.0 Client ID
1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Name: `reachinbox-web`.
5. **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - (production) `https://your-frontend-domain`
6. **Authorized redirect URIs**:
   - `http://localhost:4000/auth/google/callback`
   - (production) `https://your-backend-domain/auth/google/callback`
7. Click **Create**. Copy the **Client ID** and **Client Secret**.

## 4. Add Credentials to Backend
Edit `backend/.env`:
```
GOOGLE_CLIENT_ID=paste-client-id-here
GOOGLE_CLIENT_SECRET=paste-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

## 5. Run
```
cd backend && npm run build && npm start
cd frontend && npm run dev
```
Open http://localhost:5173 and click **Sign in with Google**.

## Notes
- While the consent screen is in **Testing** mode, only listed test users can sign in. Publish the app (or add users) for wider access.
- For production, switch to HTTPS origins/redirects and set `secure: true` on the session cookie in `src/index.ts`.
- Never commit `.env` to git (it's in `.gitignore`).
