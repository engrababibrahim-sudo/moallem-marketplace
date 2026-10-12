import { createClient } from "@supabase/supabase-js";

function send(res: any, status: number, body: unknown) {
  return res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Method not allowed" });
  }

  const auth = String(req.headers?.authorization || "");
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service || !auth.startsWith("Bearer ")) {
    return send(res, 401, { error: "يجب تسجيل الدخول أولًا." });
  }

  try {
    const userClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return send(res, 401, { error: "جلسة الدخول غير صالحة." });

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: profileError } = await admin.from("profiles")
      .select("role").eq("id", userData.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || !["admin", "super_admin", "support"].includes(profile.role)) {
      return send(res, 403, { error: "ليس لديك صلاحية عرض تقارير الحضور." });
    }

    // Load original Zoom sessions, then attach continuation meetings to the same booking.
    const { data: sessions, error: sessionsError } = await admin.from("live_sessions")
      .select("booking_id,provider_meeting_id,status,scheduled_start_at,scheduled_end_at,bookings(id,subject,start_at,end_at,status,payment_status,student_id,teacher_id)")
      .eq("provider", "zoom").order("scheduled_start_at", { ascending: false }).limit(100);
    if (sessionsError) throw sessionsError;

    const bookingIds = [...new Set((sessions || []).map((s: any) => s.booking_id).filter(Boolean))];
    const { data: segments, error: segmentsError } = bookingIds.length
      ? await admin.from("live_session_segments")
          .select("booking_id,provider_meeting_id,segment_number,status,scheduled_start_at,scheduled_end_at")
          .in("booking_id", bookingIds).order("segment_number", { ascending: true })
      : { data: [], error: null };
    if (segmentsError) throw segmentsError;

    const meetingIds = [...new Set([
      ...(sessions || []).map((s: any) => s.provider_meeting_id),
      ...(segments || []).map((s: any) => s.provider_meeting_id),
    ].filter(Boolean).map(String))];
    const { data: events, error: eventsError } = bookingIds.length
      ? await admin.from("zoom_attendance_events")
          .select("booking_id,provider_meeting_id,event_type,participant_name,participant_email,participant_user_id,event_time")
          .in("booking_id", bookingIds).order("event_time", { ascending: true })
      : { data: [], error: null };
    if (eventsError) throw eventsError;

    const userIds = [...new Set((sessions || []).flatMap((s: any) => [
      s.bookings?.student_id, s.bookings?.teacher_id,
    ]).filter(Boolean))];
    const { data: people, error: peopleError } = userIds.length
      ? await admin.from("profiles").select("id,full_name,email").in("id", userIds)
      : { data: [], error: null };
    if (peopleError) throw peopleError;

    const peopleById = Object.fromEntries((people || []).map((p: any) => [p.id, p]));
    const sessionsByBooking = new Map<string, any>();
    for (const s of sessions || []) {
      if (!sessionsByBooking.has(s.booking_id)) sessionsByBooking.set(s.booking_id, s);
    }

    // One report card per booking. Events remain stored with their actual Zoom meeting ID,
    // but both the original and continuation meeting events are presented as one lesson.
    const grouped = [...sessionsByBooking.values()].map((s: any) => {
      const booking = s.bookings;
      const bookingSegments = (segments || []).filter((segment: any) => segment.booking_id === s.booking_id);
      const lessonMeetingIds = new Set([
        s.provider_meeting_id,
        ...bookingSegments.map((segment: any) => segment.provider_meeting_id),
      ].filter(Boolean).map(String));
      const lessonEvents = (events || []).filter((event: any) =>
        event.booking_id === s.booking_id &&
        (lessonMeetingIds.size === 0 || lessonMeetingIds.has(String(event.provider_meeting_id || "")))
      );
      const times = [
        { start: s.scheduled_start_at, end: s.scheduled_end_at },
        ...bookingSegments.map((segment: any) => ({ start: segment.scheduled_start_at, end: segment.scheduled_end_at })),
      ].filter((period: any) => period.start && period.end);
      return {
        booking_id: s.booking_id,
        meeting_id: s.provider_meeting_id,
        status: s.status,
        scheduled_start_at: booking?.start_at || s.scheduled_start_at,
        scheduled_end_at: booking?.end_at || s.scheduled_end_at,
        subject: booking?.subject || "حصة تعليمية",
        booking_status: booking?.status,
        payment_status: booking?.payment_status,
        student: peopleById[booking?.student_id] || null,
        teacher: peopleById[booking?.teacher_id] || null,
        events: lessonEvents,
        meeting_count: lessonMeetingIds.size,
        continuation_count: bookingSegments.length,
        meeting_periods: times,
      };
    }).sort((a: any, b: any) =>
      new Date(b.scheduled_start_at).getTime() - new Date(a.scheduled_start_at).getTime()
    );

    return send(res, 200, { sessions: grouped });
  } catch (error) {
    console.error("Admin attendance report failed", error);
    const detail = error && typeof error === "object" && "message" in error
      ? String((error as any).message)
      : "Unknown server error";
    return send(res, 500, { error: "تعذر تحميل تقرير الحضور.", detail });
  }
}
