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
  const anonKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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
    if (authError || !authData.user) {
      return json(res, 401, { error: "جلسة الدخول غير صالحة." });
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: bookings, error: bookingError } = await admin
      .from("bookings")
      .select("id")
      .eq("student_id", authData.user.id)
      .eq("status", "confirmed")
      .eq("payment_status", "paid");

    if (bookingError) {
      console.error("Student live sessions booking lookup error", bookingError);
      return json(res, 500, { error: "تعذر تحميل روابط الحصص." });
    }

    const ids = (bookings ?? []).map((booking: { id: string }) => booking.id);
    if (!ids.length) return json(res, 200, { sessions: [] });

    const { data: sessions, error: sessionError } = await admin
      .from("live_sessions")
      .select("booking_id,provider,join_url,scheduled_start_at,scheduled_end_at,status")
      .in("booking_id", ids)
      .eq("status", "scheduled");

    if (sessionError) {
      console.error("Student live sessions lookup error", sessionError);
      return json(res, 500, { error: "تعذر تحميل روابط الحصص." });
    }

    return json(res, 200, {
      sessions: (sessions ?? []).map((session: any) => ({
        booking_id: session.booking_id,
        provider: session.provider,
        join_url: session.join_url,
        scheduled_start_at: session.scheduled_start_at,
        scheduled_end_at: session.scheduled_end_at,
        status: session.status,
      })),
    });
  } catch (error) {
    console.error("Student live sessions error", error);
    return json(res, 500, { error: "تعذر تحميل روابط الحصص." });
  }
}
