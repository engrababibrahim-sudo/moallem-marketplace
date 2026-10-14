import { createClient } from "@supabase/supabase-js";
function json(res: any, status: number, body: unknown) { return res.status(status).json(body); }
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return json(res, 405, { error: "Method not allowed" }); }
  const authorization = String(req.headers?.authorization || "");
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon || !authorization.startsWith("Bearer ")) return json(res, 401, { error: "يجب تسجيل الدخول أولًا." });
  const client = createClient(url, anon, { auth: { persistSession: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return json(res, 401, { error: "جلسة الدخول غير صالحة." });
  const { data: profile } = await client.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "teacher") return json(res, 403, { error: "هذه الخدمة للمعلمين فقط." });
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) return json(res, 503, { error: "الخدمة غير مهيأة." });
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: connection, error: dbError } = await admin.from("teacher_zoom_connections").select("zoom_email,connected_at,token_expires_at").eq("teacher_id", data.user.id).maybeSingle();
  if (dbError) return json(res, 503, { connected: false, error: "شغّلي ترحيل قاعدة البيانات أولًا." });
  return json(res, 200, { connected: !!connection, zoom_email: connection?.zoom_email || null, connected_at: connection?.connected_at || null });
}
