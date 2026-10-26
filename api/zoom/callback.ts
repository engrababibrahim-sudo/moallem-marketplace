
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { encrypt } from "./_oauth.js";

function getEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${names[0]}`);
}

function verifyState(state: string, secret: string): {
  uid: string;
  exp: number;
} | null {
  const parts = state.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      typeof data.uid !== "string" ||
      typeof data.exp !== "number" ||
      data.exp < Date.now()
    ) {
      return null;
    }

    return { uid: data.uid, exp: data.exp };
  } catch {
    return null;
  }
}

function htmlPage(message: string, success: boolean): string {
  const color = success ? "#15803d" : "#b91c1c";
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ربط Zoom - مُعلّم</title>
</head>
<body style="font-family:Arial,sans-serif;padding:40px;text-align:center">
<h2 style="color:${color}">${safeMessage}</h2>
<p>يمكنك إغلاق هذه الصفحة والعودة إلى منصة مُعلّم.</p>
</body>
</html>`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  const code = typeof req.query.code === "string"
    ? req.query.code
    : "";

  const state = typeof req.query.state === "string"
    ? req.query.state
    : "";

  const zoomError = typeof req.query.error === "string"
    ? req.query.error
    : "";

  if (zoomError) {
    return res
      .status(400)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(htmlPage("لم تتم الموافقة على ربط حساب Zoom.", false));
  }

  if (!code || !state) {
    return res
      .status(400)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(htmlPage("بيانات العودة من Zoom غير مكتملة.", false));
  }

  try {
    const clientId = getEnv("ZOOM_OAUTH_CLIENT_ID");
    const clientSecret = getEnv("ZOOM_OAUTH_CLIENT_SECRET");
    const redirectUri = getEnv("ZOOM_OAUTH_REDIRECT_URI");
    const stateSecret = getEnv("ZOOM_OAUTH_STATE_SECRET");

    const stateData = verifyState(state, stateSecret);

    if (!stateData) {
      return res
        .status(400)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("انتهت صلاحية طلب الربط أو أنه غير صالح. أعيدي المحاولة من المنصة.", false));
    }

    const credentials = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      "https://zoom.us/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (
      !tokenResponse.ok ||
      typeof tokenData.access_token !== "string" ||
      typeof tokenData.refresh_token !== "string"
    ) {
      console.error("Zoom token exchange failed:", tokenData);

      return res
        .status(502)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("فشل الحصول على تصريح Zoom. راجعي إعدادات تطبيق Zoom.", false));
    }

    const zoomUserResponse = await fetch(
      "https://api.zoom.us/v2/users/me",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const zoomUser = await zoomUserResponse.json();

    if (!zoomUserResponse.ok || !zoomUser.id) {
      console.error("Zoom user lookup failed:", zoomUser);

      return res
        .status(502)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("تعذر التحقق من حساب Zoom.", false));
    }

    const supabaseUrl = getEnv(
      "SUPABASE_URL",
      "VITE_SUPABASE_URL"
    );

    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error: saveError } = await admin
      .from("teacher_zoom_connections")
      .upsert(
        {
          teacher_id: stateData.uid,
          zoom_user_id: String(zoomUser.id),
          zoom_email: zoomUser.email ?? null,
          access_token_encrypted: encrypt(tokenData.access_token),
          refresh_token_encrypted: encrypt(tokenData.refresh_token),
          token_expires_at: new Date(
            Date.now() + Number(tokenData.expires_in ?? 3600) * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "teacher_id" }
      );

    if (saveError) {
      console.error("Saving Zoom connection failed:", saveError);

      return res
        .status(500)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("تم التحقق من Zoom، لكن تعذر حفظ الربط. راجعي إعدادات قاعدة البيانات.", false));
    }

    return res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(htmlPage("تم ربط حساب Zoom بنجاح!", true));
  } catch (error) {
    console.error("Zoom callback error:", error);

    return res
      .status(500)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(htmlPage("حدث خطأ أثناء ربط Zoom. راجعي سجل النشر في Vercel.", false));
  }
}
