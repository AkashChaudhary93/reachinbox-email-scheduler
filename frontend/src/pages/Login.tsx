import { MailIcon, ClockIcon, CheckIcon, SendIcon, SparkIcon } from "../components/Icons";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-aurora" />
      <div className="login-grid">
        <section className="login-hero fade-in">
          <div className="brand large">
            <span className="brand-mark"><MailIcon size={24} /></span>
            <span className="brand-text">Reach<span>Inbox</span></span>
          </div>
          <h1>Email scheduling that <span className="grad">never drops a job.</span></h1>
          <p className="login-sub">
            Queue single or bulk campaigns, let BullMQ hold the timing, and watch delivery land in real time.
          </p>
          <ul className="feature-list">
            <li><ClockIcon size={18} /> Persistent delayed jobs on Redis</li>
            <li><SendIcon size={18} /> Ethereal sandbox or real SMTP</li>
            <li><CheckIcon size={18} /> Restart-safe worker pipeline</li>
          </ul>
          <div className="hero-note"><SparkIcon size={16} /> Built for the ReachInbox internship brief.</div>
        </section>

        <section className="login-card card fade-in">
          <div className="card-head">
            <h2>Sign in</h2>
            <p>Continue with your Google account to open the outbox.</p>
          </div>
          <a className="btn btn-google btn-lg btn-block" href={`${API}/auth/google`}>
            <GoogleMark />
            Continue with Google
          </a>
          <p className="fineprint">Session is stored server-side. No passwords touch this app.</p>
          <div className="login-footer">
            <span className="dot" /> Scheduler online
          </div>
        </section>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.7 17.6 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.6Z" />
      <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.9l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-4.2-13.6-10.1l-7.8 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  );
}
