
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function getEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${names[0]}`);
}

function signState(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "يجب تسجيل الدخول إلى منصة مُعلّم أولًا",
      });
    }

    const supabaseUrl = getEnv(
      "SUPABASE_URL",
      "VITE_SUPABASE_URL"
    );

    const supabaseKey = getEnv(
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_ANON_KEY"
    );

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        error: "انتهت جلسة الدخول، سجّلي الدخول مرة أخرى",
      });
    }

    const clientId = getEnv("ZOOM_OAUTH_CLIENT_ID");
    const redirectUri = getEnv("ZOOM_OAUTH_REDIRECT_URI");
    const stateSecret = getEnv("ZOOM_OAUTH_STATE_SECRET");

    const payload = Buffer.from(
      JSON.stringify({
        uid: user.id,
        exp: Date.now() + 10 * 60 * 1000,
        nonce: randomBytes(16).toString("hex"),
      })
    ).toString("base64url");

    const signature = signState(payload, stateSecret);
    const state = `${payload}.${signature}`;

    const authorizationUrl = new URL(
      "https://zoom.us/oauth/authorize"
    );

    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("state", state);

    return res.status(200).json({
      authorizationUrl: authorizationUrl.toString(),
    });
  } catch (error) {
    console.error("Zoom connect error:", error);

    return res.status(500).json({
      error: "تعذر بدء ربط Zoom. راجعي إعدادات البيئة في Vercel.",
    });
  }
}
