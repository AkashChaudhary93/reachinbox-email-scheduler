import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import { config } from "./config";
import { connectDb } from "./db";
import { authRouter } from "./routes/auth";
import emailRouter from "./routes/emails";

async function main() {
  await connectDb();

  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "10mb" }));
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow same-origin/no-origin (curl, health checks) and configured origins.
        if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: config.mongoUri }),
      cookie: {
        httpOnly: true,
        secure: config.cookieSecure,
        sameSite: config.cookieSameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/health", (_req, res) => res.json({ ok: true, service: "reachinbox-scheduler" }));

  app.use("/auth", authRouter);
  app.use("/emails", emailRouter);

  app.listen(config.port, () => {
    console.log(`Backend listening on ${config.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
