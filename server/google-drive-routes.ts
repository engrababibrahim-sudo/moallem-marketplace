import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { getGoogleDriveAuthorizationUrl } from "./google-drive";

const STATE_COOKIE = "google_drive_oauth_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function isHttps(req: Request) {
  return (
    req.secure ||
    req.headers["x-forwarded-proto"] === "https"
  );
}

function cookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: "lax" as const,
    path: "/api/google",
    maxAge: STATE_MAX_AGE_MS,
  };
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return (
    left.length === right.length &&
    timingSafeEqual(left, right)
  );
}

export function registerGoogleDriveRoutes(app: Express) {
  app.get(
    "/api/google/start",
    (req: Request, res: Response) => {
      // Temporary safeguard: only allow this route to be enabled
      // after a server-side administrator check has been added.
      if (process.env.GOOGLE_DRIVE_OAUTH_ENABLED !== "true") {
        res.status(503).json({
          error: "Google Drive OAuth is not enabled yet.",
        });
        return;
      }

      const state = randomBytes(32).toString("hex");

      try {
        const url = getGoogleDriveAuthorizationUrl(state);

        res.cookie(STATE_COOKIE, state, cookieOptions(req));
        res.redirect(302, url);
      } catch (error) {
        console.error("[Google Drive] Unable to start OAuth");
        res.status(500).json({
          error: "Unable to start Google Drive authorization.",
        });
      }
    }
  );

  app.get(
    "/api/google/callback",
    (req: Request, res: Response) => {
      const code =
        typeof req.query.code === "string"
          ? req.query.code
          : undefined;

      const state =
        typeof req.query.state === "string"
          ? req.query.state
          : undefined;

      const cookies = Object.fromEntries(
        (req.headers.cookie ?? "")
          .split(";")
          .map((part) => {
            const index = part.indexOf("=");

            if (index < 0) {
              return ["", ""];
            }

            return [
              part.slice(0, index).trim(),
              decodeURIComponent(part.slice(index + 1).trim()),
            ];
          })
          .filter(([key]) => key)
      );

      const expectedState = cookies[STATE_COOKIE];

      res.clearCookie(STATE_COOKIE, {
        ...cookieOptions(req),
        maxAge: undefined,
      });

      if (!code || !state || !expectedState || !safeEqual(state, expectedState)) {
        res.status(403).json({
          error: "Invalid or expired Google OAuth state.",
        });
        return;
      }

      // Token exchange and secure token persistence must be implemented
      // before this callback can complete the connection.
      res.status(501).json({
        error: "OAuth state verified. Secure token storage is not configured yet.",
      });
    }
  );
}
