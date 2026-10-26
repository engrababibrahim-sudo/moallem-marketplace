```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { decrypt, encrypt, env, exchangeCode, redirectUri, verifyState } from "./_oauth.js";

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
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const code =
    typeof req.query.code === "string" ? req.query.code : "";
  const state =
    typeof req.query.state === "string" ? req.query.state : "";
  const zoomError =
    typeof req.query.error === "string" ? req.query.error : "";

  if (zoomError) {
    return res.status(400)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(htmlPage("لم تتم الموافقة على ربط حساب Zoom.", false));
  }

  if (!code || !state) {
    return res.status(400)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(htmlPage("بيانات العودة من Zoom غير مكتملة.", false));
  }

  try {
    const parts = state.split(".");
    if (parts.length !== 2) {
      return res.status(400)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("طلب الربط غير صالح. أعيدي المحاولة من المنصة.", false));
    }

    const [payload, signature] = parts;
    if (!verifyState(payload, signature)) {
      return res.status(400)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("انتهت صلاحية طلب الربط أو أنه غير صالح. أعيدي المحاولة من المنصة.", false));
    }

    let stateData: { uid: string; exp: number; nonce?: string };

    try {
      stateData = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8")
      );
    } catch {
      return res.status(400)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("بيانات طلب الربط غير صالحة.", false));
    }

    if (
      typeof stateData.uid !== "string" ||
      typeof stateData.exp !== "number" ||
      stateData.exp < Date.now()
    ) {
      return res.status(400)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("انتهت صلاحية طلب الربط. أعيدي المحاولة من المنصة.", false));
    }

    const tokenData = await exchangeCode(code);

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
      console.error("Zoom user lookup failed:", zoomUserResponse.status);
      return res.status(502)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("تعذر التحقق من حساب Zoom.", false));
    }

    const supabaseUrl = env("SUPABASE_URL");
    const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

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
      console.error("Saving Zoom connection failed:", saveError.code);
      return res.status(500)
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .send(htmlPage("تم التحقق من Zoom، لكن تعذر حفظ الربط. راجعي إعدادات قاعدة البيانات.", false));
    }

    return res.status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(htmlPage("تم ربط حساب Zoom بنجاح!", true));
  } catch (error) {
    console.error(
      "Zoom callback error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return res.status(500)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(htmlPage("حدث خطأ أثناء ربط Zoom. راجعي سجل النشر في Vercel.", false));
  }
}
```
