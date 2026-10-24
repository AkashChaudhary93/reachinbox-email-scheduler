import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { Email } from "../models/Email";
import { emailQueue } from "../queue";
import { config } from "../config";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function userId(req: any) {
  return req.user?.id || "anonymous";
}

router.post("/schedule", requireAuth, async (req, res) => {
  try {
    const { to, subject, body, scheduledAt } = req.body;
    if (!to || !subject || !body || !scheduledAt) {
      return res.status(400).json({ error: "missing fields" });
    }
    const when = new Date(scheduledAt);
    if (isNaN(when.getTime())) return res.status(400).json({ error: "invalid date" });
    const delay = Math.max(0, when.getTime() - Date.now());

    const email = await Email.create({
      userId: userId(req),
      to,
      subject,
      body,
      scheduledAt: when,
      status: "scheduled",
    });

    const job = await emailQueue.add(
      "send-email",
      { emailId: email._id.toString(), to, subject, body, userId: userId(req) },
      { delay }
    );
    email.jobId = job.id;
    await email.save();

    res.json({ email, jobId: job.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/bulk", requireAuth, async (req, res) => {
  try {
    const { recipients, subject, body, startTime, delayBetweenMs } = req.body;
    if (!Array.isArray(recipients) || !subject || !body) {
      return res.status(400).json({ error: "missing fields" });
    }
    const base = startTime ? new Date(startTime) : new Date();
    const gap = Number(delayBetweenMs ?? config.minDelayBetweenEmailsMs);
    const created = [];
    for (let i = 0; i < recipients.length; i++) {
      const to = String(recipients[i]).trim();
      if (!to) continue;
      const when = new Date(base.getTime() + i * gap);
      const delay = Math.max(0, when.getTime() - Date.now());
      const email = await Email.create({
        userId: userId(req),
        to,
        subject,
        body,
        scheduledAt: when,
        status: "scheduled",
      });
      const job = await emailQueue.add(
        "send-email",
        { emailId: email._id.toString(), to, subject, body, userId: userId(req) },
        { delay }
      );
      email.jobId = job.id;
      await email.save();
      created.push(email);
    }
    res.json({ count: created.length, emails: created });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no file" });
    const text = req.file.buffer.toString("utf8");
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const recipients: string[] = [];
    for (const line of lines) {
      // skip header
      if (/^email$/i.test(line)) continue;
      // handle csv column
      const col = line.split(",")[0].trim();
      if (col.includes("@")) recipients.push(col);
    }
    const { subject, body, startTime, delayBetweenMs } = req.body;
    if (!subject || !body) return res.status(400).json({ error: "missing subject/body" });

    const base = startTime ? new Date(startTime) : new Date();
    const gap = Number(delayBetweenMs ?? config.minDelayBetweenEmailsMs);
    const created = [];
    for (let i = 0; i < recipients.length; i++) {
      const to = recipients[i];
      const when = new Date(base.getTime() + i * gap);
      const delay = Math.max(0, when.getTime() - Date.now());
      const email = await Email.create({
        userId: userId(req),
        to,
        subject,
        body,
        scheduledAt: when,
        status: "scheduled",
      });
      const job = await emailQueue.add(
        "send-email",
        { emailId: email._id.toString(), to, subject, body, userId: userId(req) },
        { delay }
      );
      email.jobId = job.id;
      await email.save();
      created.push(email);
    }
    res.json({ count: created.length, emails: created });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/scheduled", requireAuth, async (req, res) => {
  const emails = await Email.find({ userId: userId(req), status: { $in: ["scheduled", "failed"] } })
    .sort({ scheduledAt: 1 })
    .lean();
  res.json({ emails });
});

router.get("/sent", requireAuth, async (req, res) => {
  const emails = await Email.find({ userId: userId(req), status: "sent" })
    .sort({ sentAt: -1 })
    .lean();
  res.json({ emails });
});

router.get("/:id", requireAuth, async (req, res) => {
  const email = await Email.findOne({ _id: req.params.id, userId: userId(req) }).lean();
  if (!email) return res.status(404).json({ error: "not found" });
  res.json({ email });
});

export default router;
