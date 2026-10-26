
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { env, redirectUri, signState } from "./_oauth.js";

function json(res: any, status: number, body: unknown) {
  return res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const authorization = String(req.headers?.authorization || "");

    if (!authorization.startsWith("Bearer ")) {
      return json(res, 401, {
        error: "يجب تسجيل الدخول أولًا.",
      });
    }

    const url = env("SUPABASE_URL");
    const anon =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      env("VITE_SUPABASE_PUBLISHABLE_KEY");

    const client = createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const {
      data,
      error,
    } = await client.auth.getUser();

    if (error || !data.user) {
      return json(res, 401, {
        error: "جلسة الدخول غير صالحة. سجّلي الدخول مرة أخرى.",
      });
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Zoom profile lookup failed:", profileError.message);

      return json(res, 500, {
        error: "تعذر التحقق من حساب المعلم.",
      });
    }

    if (profile?.role !== "teacher") {
      return json(res, 403, {
        error: "ربط Zoom متاح لحسابات المعلمين فقط.",
      });
    }

    const payload = Buffer.from(
      JSON.stringify({
        uid: data.user.id,
        exp: Date.now() + 10 * 60 * 1000,
        nonce: randomBytes(18).toString("base64url"),
      })
    ).toString("base64url");

    const state = payload + "." + signState(payload);

    const query = new URLSearchParams({
      response_type: "code",
      client_id: env("ZOOM_OAUTH_CLIENT_ID"),
      redirect_uri: redirectUri(),
      state,
      include_granted_scopes: "true",
      scope: "user:read:user",
    });

    const authorizationUrl =
      "https://zoom.us/oauth/authorize?" + query.toString();

    return json(res, 200, {
      url: authorizationUrl,
      authorizationUrl,
    });
  } catch (e) {
    const missing = [
      [
        "SUPABASE_URL",
        Boolean(
          process.env.SUPABASE_URL ||
          process.env.VITE_SUPABASE_URL
        ),
      ],
      [
        "SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY",
        Boolean(
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY
        ),
      ],
      [
        "ZOOM_OAUTH_CLIENT_ID",
        Boolean(process.env.ZOOM_OAUTH_CLIENT_ID),
      ],
      [
        "ZOOM_TOKEN_ENCRYPTION_KEY",
        Boolean(process.env.ZOOM_TOKEN_ENCRYPTION_KEY),
      ],
    ]
      .filter(([, present]) => !present)
      .map(([name]) => name);

    const diagnostic =
      e instanceof Error ? e.message : String(e);

    console.error("Zoom connect initialization failed", {
      missing,
      diagnostic,
    });

    const errorMessage = missing.length
      ? "إعدادات Zoom: متغيرات غير مقروءة من الخادم: " +
        missing.join(", ")
      : "إعدادات Zoom موجودة، لكن فشل التحقق من المفتاح أو الإعدادات. راجعي سجل Vercel للخطأ Zoom connect initialization failed.";

    return json(res, 503, {
      error: errorMessage,
      missing,
    });
  }
}
