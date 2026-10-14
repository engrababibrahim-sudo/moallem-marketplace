import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { env, redirectUri, signState } from "./_oauth.js";

function json(res: any, status: number, body: unknown) { return res.status(status).json(body); }
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return json(res, 405, { error: "Method not allowed" }); }
  try {
    const authorization = String(req.headers?.authorization || "");
    if (!authorization.startsWith("Bearer ")) return json(res, 401, { error: "يجب تسجيل الدخول أولًا." });
    const url = env("SUPABASE_URL");
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY || env("VITE_SUPABASE_PUBLISHABLE_KEY");
    const client = createClient(url, anon, { auth: { persistSession: false }, global: { headers: { Authorization: authorization } } });
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return json(res, 401, { error: "جلسة الدخول غير صالحة." });
    const { data: profile } = await client.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role !== "teacher") return json(res, 403, { error: "ربط Zoom متاح لحسابات المعلمين فقط." });
    const payload = Buffer.from(JSON.stringify({ uid: data.user.id, exp: Date.now() + 10 * 60 * 1000, nonce: randomBytes(18).toString("base64url") })).toString("base64url");
    const state = payload + "." + signState(payload);
    const query = new URLSearchParams({
      response_type: "code",
      client_id: env("ZOOM_OAUTH_CLIENT_ID"),
      redirect_uri: redirectUri(),
      state,
    });
    return res.status(302).setHeader("Location", "https://zoom.us/oauth/authorize?" + query.toString()).end();
  } catch (e) {
    console.error("Zoom connect initialization failed", e);
    return json(res, 503, { error: "إعدادات ربط Zoom غير مكتملة على الخادم." });
  }
}
