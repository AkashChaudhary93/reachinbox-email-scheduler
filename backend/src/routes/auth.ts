import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "../config";

export const authRouter = Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId || "disabled",
      clientSecret: config.googleClientSecret || "disabled",
      callbackURL: config.googleCallbackUrl,
    },
    (_accessToken, _refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        photo: profile.photos?.[0]?.value,
      };
      done(null, user as any);
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${config.frontendUrl}/login?error=1` }),
  (_req, res) => {
    res.redirect(config.frontendUrl);
  }
);

authRouter.get("/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ user: null });
  }
  res.json({ user: req.user });
});

authRouter.post("/logout", (req, res) => {
  req.logout(() => {
    req.session?.destroy(() => {
      res.json({ ok: true });
    });
  });
});
