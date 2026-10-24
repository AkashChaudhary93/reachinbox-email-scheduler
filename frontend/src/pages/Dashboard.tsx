import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, Email, User } from "../api";
import Shell from "../components/Shell";
import {
  AlertIcon, CheckIcon, ChevronIcon, ClockIcon, MailIcon,
  PlusIcon, RefreshIcon, SearchIcon, CloseIcon,
} from "../components/Icons";

type Tab = "scheduled" | "sent";

export default function Dashboard({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>("scheduled");
  const [scheduled, setScheduled] = useState<Email[]>([]);
  const [sent, setSent] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Email | null>(null);
  const nav = useNavigate();

  const load = async (soft = false) => {
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const [a, b] = await Promise.all([
        api.get("/emails/scheduled"),
        api.get("/emails/sent"),
      ]);
      setScheduled(a.data.emails);
      setSent(b.data.emails);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const failed = scheduled.filter((e) => e.status === "failed").length;
    return {
      scheduled: scheduled.length - failed,
      sent: sent.length,
      failed,
      total: scheduled.length + sent.length,
    };
  }, [scheduled, sent]);

  const visible = useMemo(() => {
    const list = tab === "scheduled" ? scheduled : sent;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) => e.to.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)
    );
  }, [tab, scheduled, sent, query]);

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

  const statusLabel = (s: Email["status"]) => (s === "scheduled" ? "Queued" : s === "sent" ? "Delivered" : "Failed");

  return (
    <Shell user={user}>
      <section className="page-head fade-in">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Outbox</h1>
          <p className="sub">Track queued and delivered email across your workspace.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={() => load(true)} disabled={refreshing}>
            <RefreshIcon size={16} className={refreshing ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => nav("/compose")}>
            <PlusIcon size={16} /> New email
          </button>
        </div>
      </section>

      <section className="stats fade-in">
        <StatCard icon={<ClockIcon size={18} />} label="Queued" value={stats.scheduled} tone="violet" />
        <StatCard icon={<CheckIcon size={18} />} label="Delivered" value={stats.sent} tone="mint" />
        <StatCard icon={<AlertIcon size={18} />} label="Failed" value={stats.failed} tone="rose" />
        <StatCard icon={<MailIcon size={18} />} label="Total" value={stats.total} tone="sky" />
      </section>

      <section className="panel fade-in">
        <div className="panel-toolbar">
          <div className="segmented">
            <button className={tab === "scheduled" ? "active" : ""} onClick={() => setTab("scheduled")}>
              Queued <span>{stats.scheduled}</span>
            </button>
            <button className={tab === "sent" ? "active" : ""} onClick={() => setTab("sent")}>
              Delivered <span>{stats.sent}</span>
            </button>
          </div>
          <div className="search">
            <SearchIcon size={16} />
            <input placeholder="Search recipient or subject…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="skeleton-list">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><MailIcon size={26} /></div>
            <h3>{query ? "No matches" : tab === "scheduled" ? "Nothing queued" : "No deliveries yet"}</h3>
            <p>{query ? "Try a different recipient or subject." : "Schedule your first email and it will show up here."}</p>
            {!query && <button className="btn btn-primary" onClick={() => nav("/compose")}><PlusIcon size={16} /> Compose email</button>}
          </div>
        ) : (
          <>
            <div className="table-wrap desktop-only">
              <table className="table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>{tab === "scheduled" ? "Scheduled for" : "Sent at"}</th>
                    <th>Status</th>
                    <th aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((e) => (
                    <tr key={e._id} onClick={() => setSelected(e)} className="row">
                      <td>
                        <div className="recipient">
                          <span className="avatar sm fallback">{(e.to[0] || "?").toUpperCase()}</span>
                          <span className="truncate">{e.to}</span>
                        </div>
                      </td>
                      <td className="truncate subject-cell">{e.subject}</td>
                      <td className="muted-cell">{fmt(tab === "scheduled" ? e.scheduledAt : e.sentAt || e.scheduledAt)}</td>
                      <td><span className={`pill ${e.status}`}>{statusLabel(e.status)}</span></td>
                      <td className="chev"><ChevronIcon size={16} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-list mobile-only">
              {visible.map((e) => (
                <button key={e._id} className="email-card" onClick={() => setSelected(e)}>
                  <div className="email-card-top">
                    <span className="avatar sm fallback">{(e.to[0] || "?").toUpperCase()}</span>
                    <div className="email-card-meta">
                      <strong className="truncate">{e.to}</strong>
                      <span className="truncate">{e.subject}</span>
                    </div>
                    <span className={`pill ${e.status}`}>{statusLabel(e.status)}</span>
                  </div>
                  <div className="email-card-bottom">
                    <span>{fmt(tab === "scheduled" ? e.scheduledAt : e.sentAt || e.scheduledAt)}</span>
                    <ChevronIcon size={15} />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {selected && <EmailDrawer email={selected} onClose={() => setSelected(null)} />}
    </Shell>
  );
}

function StatCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
      </div>
    </div>
  );
}

function EmailDrawer({ email, onClose }: { email: Email; onClose: () => void }) {
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">Email detail</p>
            <h2>{email.subject}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><CloseIcon size={18} /></button>
        </div>
        <div className="drawer-status">
          <span className={`pill ${email.status}`}>{email.status === "scheduled" ? "Queued" : email.status === "sent" ? "Delivered" : "Failed"}</span>
          {email.previewUrl && <a className="link" href={email.previewUrl} target="_blank" rel="noreferrer">Open sandbox preview</a>}
        </div>
        <dl className="detail-grid">
          <div><dt>To</dt><dd>{email.to}</dd></div>
          <div><dt>Status</dt><dd className="cap">{email.status}</dd></div>
          <div><dt>Scheduled</dt><dd>{fmt(email.scheduledAt)}</dd></div>
          <div><dt>Sent</dt><dd>{fmt(email.sentAt)}</dd></div>
        </dl>
        {email.error && <div className="error-box">{email.error}</div>}
        <div className="drawer-body">
          <p className="eyebrow">Message</p>
          <p className="body-text">{email.body}</p>
        </div>
      </aside>
    </div>
  );
}
