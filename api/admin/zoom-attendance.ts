import { createClient } from "@supabase/supabase-js";
function send(res: any, status: number, body: unknown) { return res.status(status).json(body); }
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return send(res, 405, { error: "Method not allowed" }); }
  const auth = String(req.headers?.authorization || "");
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service || !auth.startsWith("Bearer ")) return send(res, 401, { error: "يجب تسجيل الدخول أولًا." });
  try {
    const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: auth } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return send(res, 401, { error: "جلسة الدخول غير صالحة." });
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: profileError } = await userClient.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (profileError || !profile || !["admin", "super_admin", "support"].includes(profile.role)) return send(res, 403, { error: "ليس لديك صلاحية عرض تقارير الحضور." });
    const { data: sessions, error: sessionsError } = await admin.from("live_sessions")
      .select("booking_id,provider_meeting_id,status,scheduled_start_at,scheduled_end_at,bookings(id,subject,start_at,end_at,status,payment_status,student_id,teacher_id)")
      .eq("provider", "zoom").order("scheduled_start_at", { ascending: false }).limit(100);
    if (sessionsError) throw sessionsError;
    const bookingIds = (sessions || []).map((s: any) => s.booking_id);
    const { data: events, error: eventsError } = bookingIds.length
      ? await admin.from("zoom_attendance_events").select("booking_id,event_type,participant_name,participant_email,participant_user_id,event_time").in("booking_id", bookingIds).order("event_time", { ascending: true })
      : { data: [], error: null };
    if (eventsError) throw eventsError;
    const userIds = [...new Set((sessions || []).flatMap((s: any) => [s.bookings?.student_id, s.bookings?.teacher_id]).filter(Boolean))];
    const { data: people, error: peopleError } = userIds.length ? await admin.from("profiles").select("id,full_name,email").in("id", userIds) : { data: [], error: null };
    if (peopleError) throw peopleError;
    const peopleById = Object.fromEntries((people || []).map((p: any) => [p.id, p]));
    return send(res, 200, { sessions: (sessions || []).map((s: any) => ({
      booking_id: s.booking_id, meeting_id: s.provider_meeting_id, status: s.status,
      scheduled_start_at: s.scheduled_start_at, scheduled_end_at: s.scheduled_end_at,
      subject: s.bookings?.subject || "حصة تعليمية", booking_status: s.bookings?.status,
      payment_status: s.bookings?.payment_status,
      student: peopleById[s.bookings?.student_id] || null, teacher: peopleById[s.bookings?.teacher_id] || null,
      events: (events || []).filter((e: any) => e.booking_id === s.booking_id)
    })) });
  } catch (error) { console.error("Admin attendance report failed", error); return send(res, 500, { error: "تعذر تحميل تقرير الحضور." }); }
}
