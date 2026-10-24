import mongoose, { Document, Schema } from "mongoose";

export type EmailStatus = "scheduled" | "sent" | "failed";

export interface IEmail extends Document {
  userId: string;
  to: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  status: EmailStatus;
  jobId?: string;
  previewUrl?: string;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new Schema<IEmail>(
  {
    userId: { type: String, required: true, index: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["scheduled", "sent", "failed"], default: "scheduled", index: true },
    jobId: { type: String },
    previewUrl: { type: String },
    error: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export const Email = mongoose.model<IEmail>("Email", EmailSchema);
