import { randomBytes, timingSafeEqual, createCipheriv } from "node:crypto";
import type { Express, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { exchangeGoogleDriveCode } from "./google-drive";
import { sdk } from "./_core/sdk";
import { isAdmin } from "./authorization";

const STATE_COOKIE = "google_drive_oauth_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function encryptToken(token: string) {
  const rawKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

  if (!rawKey || !/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters.");
  }

  const key = Buffer.from(rawKey, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function isSecureRequest(req: Request) {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

function cookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "lax" as const,
    path: "/api/google",
    maxAge: STATE_MAX_AGE_MS,
  };
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

async function requireAdmin(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);

    if (!user || !isAdmin(user.role) || user.isCron) {
      res.status(403).json({ error: "Administrator access required." });
      return false;
    }

    return true;
  } catch {
    res.status(401).json({ error: "Authentication required." });
    return false;
  }
}

export function registerGoogleDriveRoutes(app: Express) {
  app.get("/api/google/start", async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;

    const state = randomBytes(32).toString("hex");

    try {
      const { google } = await import("googleapis");

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        res.status(500).json({ error: "Google OAuth is not configured." });
        return;
      }

      const oauth = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      const url = oauth.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["https://www.googleapis.com/auth/drive.readonly"],
        state,
      });

      res.cookie(STATE_COOKIE, state, cookieOptions(req));
      res.redirect(302, url);
    } catch (error) {
      console.error("[Google Drive] Failed to start OAuth.");
      res.status(500).json({ error: "Unable to start Google authorization." });
    }
  });

  app.get("/api/google/callback", async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const cookies = Object.fromEntries(
      (req.headers.cookie ?? "")
        .split(";")
        .map((part) => {
          const index = part.indexOf("=");
          if (index < 0) return ["", ""];
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
      res.status(403).json({ error: "Invalid or expired Google OAuth state." });
      return;
    }

    try {
      const refreshToken = await exchangeGoogleDriveCode(code);
      const encryptedToken = encryptToken(refreshToken);

      const { error } = await getSupabase()
        .from("google_drive_connections")
        .upsert(
          {
            provider: "google_drive",
            refresh_token_encrypted: encryptedToken,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider" }
        );

      if (error) {
        console.error("[Google Drive] Failed to save connection.");
        res.status(500).json({ error: "Unable to securely save Google connection." });
        return;
      }

      res.redirect(302, "/?googleDrive=connected");
    } catch (error) {
      console.error("[Google Drive] OAuth callback failed.");
      res.status(500).json({ error: "Google Drive authorization failed." });
    }
  });
}
