
import {
  randomBytes,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import {
  json,
  type Express,
  type Request,
  type Response,
} from "express";
import { createClient } from "@supabase/supabase-js";
import {
  exchangeGoogleDriveCode,
  createGoogleDriveUploadSession,
  getGoogleDriveFileMetadata,
} from "./google-drive";
import { sdk } from "./_core/sdk";
import { isAdmin } from "./authorization";

const STATE_COOKIE = "google_drive_oauth_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase server credentials are not configured."
    );
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
    throw new Error(
      "GOOGLE_TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters."
    );
  }

  const key = Buffer.from(rawKey, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  return [
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function decryptToken(encryptedToken: string) {
  const rawKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

  if (!rawKey || !/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    throw new Error(
      "GOOGLE_TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters."
    );
  }

  const parts = encryptedToken.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted Google token.");
  }

  const [ivHex, tagHex, encryptedHex] = parts;

  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(rawKey, "hex"),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

function isSecureRequest(req: Request) {
  return (
    req.secure ||
    req.headers["x-forwarded-proto"] === "https"
  );
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

  return (
    left.length === right.length &&
    timingSafeEqual(left, right)
  );
}

async function requireAdmin(
  req: Request,
  res: Response
) {
  try {
    const user = await sdk.authenticateRequest(req);

    if (!user || !isAdmin(user.role) || user.isCron) {
      res.status(403).json({
        error: "Administrator access required.",
      });
      return false;
    }

    return true;
  } catch {
    res.status(401).json({
      error: "Authentication required.",
    });
    return false;
  }
}

async function authenticateTeacher(
  req: Request,
  res: Response
) {
  try {
    const user = await sdk.authenticateRequest(req);

    if (!user || user.isCron || !user.id) {
      res.status(401).json({
        error: "يجب تسجيل الدخول أولًا.",
      });
      return null;
    }

    return user;
  } catch {
    res.status(401).json({
      error: "يجب تسجيل الدخول أولًا.",
    });
    return null;
  }
}

async function getGoogleRefreshToken() {
  const { data, error } = await getSupabase()
    .from("google_drive_connections")
    .select("refresh_token_encrypted")
    .eq("provider", "google_drive")
    .maybeSingle();

  if (error) {
    throw new Error(
      "Unable to load the Google Drive connection."
    );
  }

  if (!data?.refresh_token_encrypted) {
    throw new Error(
      "Google Drive is not connected by an administrator."
    );
  }

  return decryptToken(data.refresh_token_encrypted);
}

export function registerGoogleDriveRoutes(app: Express) {
  app.get(
    "/api/google/start",
    async (req: Request, res: Response) => {
      if (!(await requireAdmin(req, res))) return;

      const state = randomBytes(32).toString("hex");

      try {
        const { google } = await import("googleapis");

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
          res.status(500).json({
            error: "Google OAuth is not configured.",
          });
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
          scope: [
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.file",
          ],
          state,
        });

        res.cookie(
          STATE_COOKIE,
          state,
          cookieOptions(req)
        );

        res.redirect(302, url);
      } catch {
        console.error(
          "[Google Drive] Failed to start OAuth."
        );

        res.status(500).json({
          error: "Unable to start Google authorization.",
        });
      }
    }
  );

  app.get(
    "/api/google/callback",
    async (req: Request, res: Response) => {
      if (!(await requireAdmin(req, res))) return;

      const code =
        typeof req.query.code === "string"
          ? req.query.code
          : "";

      const state =
        typeof req.query.state === "string"
          ? req.query.state
          : "";

      const cookies = Object.fromEntries(
        (req.headers.cookie ?? "")
          .split(";")
          .map((part) => {
            const index = part.indexOf("=");

            if (index < 0) return ["", ""];

            return [
              part.slice(0, index).trim(),
              decodeURIComponent(
                part.slice(index + 1).trim()
              ),
            ];
          })
          .filter(([key]) => key)
      );

      const expectedState = cookies[STATE_COOKIE];

      res.clearCookie(STATE_COOKIE, {
        ...cookieOptions(req),
        maxAge: undefined,
      });

      if (
        !code ||
        !state ||
        !expectedState ||
        !safeEqual(state, expectedState)
      ) {
        res.status(403).json({
          error: "Invalid or expired Google OAuth state.",
        });
        return;
      }

      try {
        const refreshToken =
          await exchangeGoogleDriveCode(code);

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
          console.error(
            "[Google Drive] Failed to save connection."
          );

          res.status(500).json({
            error: "Unable to securely save Google connection.",
          });
          return;
        }

        res.redirect(302, "/?googleDrive=connected");
      } catch {
        console.error(
          "[Google Drive] OAuth callback failed."
        );

        res.status(500).json({
          error: "Google Drive authorization failed.",
        });
      }
    }
  );

  app.post(
    "/api/teacher-verification/teaching-video/session",
    json({ limit: "16kb" }),
    async (req: Request, res: Response) => {
      const user = await authenticateTeacher(req, res);
      if (!user) return;

      const mimeType = req.body?.mimeType;
      const size = req.body?.size;

      if (
        !["video/mp4", "video/webm"].includes(mimeType)
      ) {
        res.status(400).json({
          error: "صيغة الفيديو يجب أن تكون MP4 أو WebM.",
        });
        return;
      }

      if (
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        size > MAX_VIDEO_SIZE
      ) {
        res.status(400).json({
          error: "حجم الفيديو يجب ألا يتجاوز 100 ميجابايت.",
        });
        return;
      }

      try {
        const supabase = getSupabase();
        const teacherId = String(user.id);

        const { data: existing, error: existingError } =
          await supabase
            .from("teacher_verification_documents")
            .select("id,status")
            .eq("teacher_id", teacherId)
            .eq("document_type", "teaching_video")
            .maybeSingle();

        if (existingError) {
          throw new Error(
            "Unable to check the existing video."
          );
        }

        if (existing && existing.status !== "rejected") {
          res.status(409).json({
            error:
              "يوجد فيديو قيد المراجعة أو تمت الموافقة عليه بالفعل.",
          });
          return;
        }

        const refreshToken = await getGoogleRefreshToken();

        const extension =
          mimeType === "video/webm" ? "webm" : "mp4";

        const filename =
          `teacher-${teacherId}-teaching-video-${Date.now()}.${extension}`;

        const uploadUrl =
          await createGoogleDriveUploadSession(
            refreshToken,
            filename,
            mimeType,
            size,
            teacherId
          );

        res.setHeader("Cache-Control", "no-store");
        res.status(200).json({ uploadUrl });
      } catch {
        console.error(
          "[Google Drive] Could not create upload session."
        );

        res.status(500).json({
          error:
            "تعذر بدء رفع الفيديو. تأكد من ربط Google Drive وحاول مرة أخرى.",
        });
      }
    }
  );

  app.post(
    "/api/teacher-verification/teaching-video/complete",
    json({ limit: "16kb" }),
    async (req: Request, res: Response) => {
      const user = await authenticateTeacher(req, res);
      if (!user) return;

      const fileId =
        typeof req.body?.fileId === "string"
          ? req.body.fileId
          : "";

      if (!fileId || fileId.length > 200) {
        res.status(400).json({
          error: "معرّف فيديو غير صالح.",
        });
        return;
      }

      try {
        const refreshToken =
          await getGoogleRefreshToken();

        const file = await getGoogleDriveFileMetadata(
          refreshToken,
          fileId
        );

        if (
          file.trashed ||
          file.appProperties?.moallemTeacherId !==
            String(user.id) ||
          file.appProperties?.moallemDocumentType !==
            "teaching_video" ||
          !["video/mp4", "video/webm"].includes(
            file.mimeType ?? ""
          ) ||
          Number(file.size) <= 0 ||
          Number(file.size) > MAX_VIDEO_SIZE
        ) {
          res.status(403).json({
            error:
              "تعذر التحقق من ملكية الفيديو أو صيغته.",
          });
          return;
        }

        const supabase = getSupabase();
        const teacherId = String(user.id);

        const { data: existing, error: existingError } =
          await supabase
            .from("teacher_verification_documents")
            .select("id,status,storage_path")
            .eq("teacher_id", teacherId)
            .eq("document_type", "teaching_video")
            .maybeSingle();

        if (existingError) {
          throw new Error(
            "Unable to check the existing video."
          );
        }

        if (existing && existing.status !== "rejected") {
          res.status(409).json({
            error:
              "يوجد فيديو قيد المراجعة أو تمت الموافقة عليه بالفعل.",
          });
          return;
        }

        const documentData = {
          storage_path: fileId,
          status: "pending" as const,
          review_note: null,
          reviewed_by: null,
          reviewed_at: null,
        };

        if (existing) {
          const { data: updated, error: updateError } =
            await supabase
              .from("teacher_verification_documents")
              .update(documentData)
              .eq("id", existing.id)
              .eq("teacher_id", teacherId)
              .eq("status", "rejected")
              .select("id")
              .maybeSingle();

          if (updateError || !updated) {
            throw new Error(
              "Unable to save the replacement video."
            );
          }
        } else {
          const { error: insertError } = await supabase
            .from("teacher_verification_documents")
            .insert({
              teacher_id: teacherId,
              document_type: "teaching_video",
              ...documentData,
            });

          if (insertError) {
            throw new Error(
              "Unable to register the uploaded video."
            );
          }
        }

        res.status(201).json({
          success: true,
          message: "تم رفع الفيديو وتسجيله للمراجعة.",
        });
      } catch {
        console.error(
          "[Google Drive] Could not register uploaded video."
        );

        res.status(500).json({
          error:
            "تم رفع الفيديو، لكن تعذر تسجيله. حاول مرة أخرى.",
        });
      }
    }
  );
}
