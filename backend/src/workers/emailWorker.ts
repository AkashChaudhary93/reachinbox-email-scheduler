import "dotenv/config";
import { Worker, Job } from "bullmq";
import mongoose from "mongoose";
import { config } from "../config";
import { connectDb } from "../db";
import { redis } from "../redis";
import { Email } from "../models/Email";
import { sendEmail } from "../services/mailer";
import { EmailJobData } from "../queue";

async function main() {
  await connectDb();
  // ensure redis connection
  await redis.ping();

  const worker = new Worker<EmailJobData>(
    "email-sending",
    async (job: Job<EmailJobData>) => {
      const { emailId, to, subject, body } = job.data;
      console.log(`Processing email ${emailId} -> ${to}`);
      const { previewUrl } = await sendEmail({ to, subject, body });
      await Email.findByIdAndUpdate(emailId, {
        status: "sent",
        sentAt: new Date(),
        previewUrl,
      });
      console.log(`Sent ${emailId}. Preview: ${previewUrl}`);
      return { previewUrl };
    },
    {
      connection: redis,
      concurrency: 5,
      limiter: { max: config.emailRatePerHour, duration: 3600000 },
    }
  );

  worker.on("failed", async (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
    if (job?.data?.emailId) {
      await Email.findByIdAndUpdate(job.data.emailId, {
        status: "failed",
        error: err.message,
      });
    }
  });

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  console.log("Email worker started");

  process.on("SIGTERM", async () => {
    await worker.close();
    await mongoose.disconnect();
    await redis.quit();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
