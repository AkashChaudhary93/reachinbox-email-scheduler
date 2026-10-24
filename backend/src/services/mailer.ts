import nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let etherealUser = "";
let fromAddress = "";

export async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    fromAddress =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "no-reply@reachinbox.ai";
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
    });
    return transporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  etherealUser = testAccount.user;
  fromAddress = etherealUser;
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log("Ethereal account:", testAccount.user);
  return transporter;
}

export async function sendEmail(opts: { to: string; subject: string; body: string }) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: `"ReachInbox" <${fromAddress || "no-reply@reachinbox.ai"}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.body,
    html: `<p>${opts.body.replace(/\n/g, "<br/>")}</p>`,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
  return { messageId: info.messageId, previewUrl };
}
