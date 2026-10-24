import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, User } from "../api";
import Shell from "../components/Shell";
import {
  SendIcon, UsersIcon, UploadIcon, ClockIcon, CheckIcon,
  CloseIcon, SparkIcon, MailIcon,
} from "../components/Icons";

type Mode = "single" | "bulk" | "csv";

export default function Compose({ user }: { user: User }) {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("single");
  const [to, setTo] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const recipients = useMemo(() => {
    return recipientsText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [recipientsText]);

  const previewTo = mode === "single" ? to || "recipient@example.com" : `${recipients.length || 0} recipients`;

  const localToIso = (value: string) => (value ? new Date(value).toISOString() : new Date().toISOString());

  const notify = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), 4000);
  };

  const submit = async () => {
    if (!subject.trim() || !body.trim()) return notify("err", "Subject and body are required.");
    setBusy(true);
    try {
      if (mode === "single") {
        if (!to.trim()) throw new Error("Recipient is required.");
        await api.post("/emails/schedule", { to: to.trim(), subject, body, scheduledAt: localToIso(startTime) });
        notify("ok", "Email scheduled.");
      } else if (mode === "bulk") {
        if (!recipients.length) throw new Error("Add at least one recipient.");
        const r = await api.post("/emails/bulk", {
          recipients, subject, body, startTime: localToIso(startTime),
        });
        notify("ok", `${r.data.count} emails scheduled.`);
      } else {
        if (!file) throw new Error("Choose a CSV or TXT file.");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("subject", subject);
        fd.append("body", body);
        fd.append("startTime", localToIso(startTime));
        const r = await api.post("/emails/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        notify("ok", `${r.data.count} emails scheduled from file.`);
      }
      window.setTimeout(() => nav("/"), 900);
    } catch (e: any) {
      notify("err", e.response?.data?.error || e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell user={user}>
      <section className="page-head fade-in">
        <div>
          <p className="eyebrow">Compose</p>
          <h1>New email</h1>
          <p className="sub">Queue a single message or fan out to a list. BullMQ handles the timing.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => nav("/")}><CloseIcon size={16} /> Close</button>
      </section>

      <div className="compose-grid">
        <section className="panel form-panel fade-in">
          <div className="segmented mode-tabs">
            <button className={mode === "single" ? "active" : ""} onClick={() => setMode("single")}><MailIcon size={16} /> Single</button>
            <button className={mode === "bulk" ? "active" : ""} onClick={() => setMode("bulk")}><UsersIcon size={16} /> Bulk</button>
            <button className={mode === "csv" ? "active" : ""} onClick={() => setMode("csv")}><UploadIcon size={16} /> CSV</button>
          </div>

          <div className="field">
            <label>Recipients</label>
            {mode === "single" && (
              <input className="input" placeholder="name@company.com" value={to} onChange={(e) => setTo(e.target.value)} />
            )}
            {mode === "bulk" && (
              <>
                <textarea className="input" rows={5} placeholder="one@company.com&#10;two@company.com" value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} />
                <span className="hint">{recipients.length} recipient{recipients.length === 1 ? "" : "s"} detected</span>
              </>
            )}
            {mode === "csv" && (
              <label className="dropzone">
                <UploadIcon size={22} />
                <strong>{file ? file.name : "Drop CSV or TXT here"}</strong>
                <span>or click to browse · first column should be email</span>
                <input type="file" accept=".csv,.txt" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>

          <div className="field">
            <label>Subject</label>
            <input className="input" placeholder="Quick question about your pipeline" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="field">
            <label>Message</label>
            <textarea className="input body-input" rows={9} placeholder="Write the email body…" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="field schedule-field">
            <label><ClockIcon size={14} /> Send time</label>
            <input className="input" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <span className="hint">Leave empty to send immediately.</span>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy}>
              {busy ? <span className="spinner" /> : <SendIcon size={17} />}
              {busy ? "Scheduling…" : "Schedule email"}
            </button>
          </div>
        </section>

        <aside className="panel preview-panel fade-in">
          <div className="preview-head">
            <span className="eyebrow">Live preview</span>
            <span className="pill scheduled">Draft</span>
          </div>
          <div className="preview-card">
            <div className="preview-meta">
              <span className="avatar fallback">R</span>
              <div>
                <strong>ReachInbox</strong>
                <span className="muted">to {previewTo}</span>
              </div>
            </div>
            <h3 className="preview-subject">{subject || "Your subject line"}</h3>
            <p className="preview-body">{body || "Your message will appear here as you type."}</p>
          </div>
          <div className="tips">
            <div className="tip"><SparkIcon size={16} /><span>BullMQ keeps delayed jobs in Redis, so restarts won't drop them.</span></div>
            <div className="tip"><CheckIcon size={16} /><span>Bulk sends are spaced automatically to stay under the rate limit.</span></div>
          </div>
        </aside>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.type === "ok" ? <CheckIcon size={16} /> : <CloseIcon size={16} />}{toast.msg}</div>}
    </Shell>
  );
}
