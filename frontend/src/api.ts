import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export type User = {
  id: string;
  displayName: string;
  email: string;
  photo?: string;
};

export type Email = {
  _id: string;
  to: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: "scheduled" | "sent" | "failed";
  previewUrl?: string;
  error?: string;
  sentAt?: string;
};
