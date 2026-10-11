import { createClient } from "@supabase/supabase-js";

function json(res: any, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "طريقة الطلب غير مدعومة." });
  }
  const authorization = String(req.headers?.authorization || "");
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey || !authorization.startsWith("Bearer ")) {
    return json(res, 401, { error: "يجب تسجيل الدخول أولًا." });
  }
  try {
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json(res, 401, { error: "جلسة الدخول غير صالحة." });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: profileError } = await admin.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "teacher") return json(res, 403, { error: "هذه الروابط متاحة للمعلم المسؤول فقط." });

    const { data: bookings, error: bookingsError } = await admin.from("bookings")
      .select("id").eq("teacher_id", authData.user.id).eq("status", "confirmed").eq("payment_status", "paid");
    if (bookingsError) throw bookingsError;
    const ids = (bookings ?? []).map((b: any) => b.id);
    if (!ids.length) return json(res, 200, { sessions: [] });

    const [{ data: sessions, error: sessionsError }, { data: segments, error: segmentsError }] = await Promise.all([
      admin.from("live_sessions").select("id,booking_id,provider,join_url,host_url,status,scheduled_start_at,scheduled_end_at").in("booking_id", ids),
      admin.from("live_session_segments").select("booking_id,join_url,host_url,scheduled_start_at,scheduled_end_at,status").in("booking_id", ids).eq("segment_number", 2),
    ]);
    if (sessionsError) throw sessionsError;
    if (segmentsError) console.warn("Teacher continuation links unavailable; migration may be pending", segmentsError.message);
    const continuationByBooking = Object.fromEntries((segments ?? []).map((s: any) => [s.booking_id, s]));
    return json(res, 200, { sessions: (sessions ?? []).map((s: any) => {
      const continuation = continuationByBooking[s.booking_id];
      return {
        ...s,
        join_url: undefined,
        continuation_join_url: undefined,
        continuation_host_url: continuation?.host_url ?? null,
        continuation_scheduled_start_at: continuation?.scheduled_start_at ?? null,
        continuation_scheduled_end_at: continuation?.scheduled_end_at ?? null,
      };
    }) });
  } catch (error) {
    console.error("Teacher live sessions lookup failed", error);
    return json(res, 500, { error: "تعذر تحميل روابط الحصص." });
  }
}
