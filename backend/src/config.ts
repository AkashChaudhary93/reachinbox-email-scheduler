import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/reachinbox",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  sessionSecret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/auth/google/callback",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : isProd,
  cookieSameSite: (process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax")) as "lax" | "none" | "strict",
  emailRatePerHour: Number(process.env.EMAIL_RATE_PER_HOUR || 200),
  minDelayBetweenEmailsMs: Number(process.env.MIN_DELAY_BETWEEN_EMAILS_MS || 2000),
};
