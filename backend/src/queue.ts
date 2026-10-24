import { Queue } from "bullmq";
import { redis } from "./redis";
import { config } from "./config";

export interface EmailJobData {
  emailId: string;
  to: string;
  subject: string;
  body: string;
  userId: string;
}

export const emailQueue = new Queue<EmailJobData>("email-sending", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 1000 },
  },
});

// Rate limiting: at most config.emailRatePerHour jobs per hour
export const queueLimiter = {
  max: config.emailRatePerHour,
  duration: 3600000,
};
