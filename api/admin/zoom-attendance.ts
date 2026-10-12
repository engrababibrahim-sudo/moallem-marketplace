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

    // Events are enriched with the scheduled period of the exact Zoom meeting.
    // A 15-minute grace period is used for early starts and overruns; events are never discarded.
    const grouped = [...sessionsByBooking.values()].map((s: any) => {
      const booking = s.bookings;
      const bookingSegments = (segments || []).filter((segment: any) => segment.booking_id === s.booking_id);
      const meetingPeriods = [
        {
          meeting_id: s.provider_meeting_id ? String(s.provider_meeting_id) : null,
          label: "الاجتماع الأصلي",
          start: s.scheduled_start_at || null,
          end: s.scheduled_end_at || null,
        },
        ...bookingSegments.map((segment: any) => ({
          meeting_id: segment.provider_meeting_id ? String(segment.provider_meeting_id) : null,
          label: `اجتماع الاستكمال رقم ${segment.segment_number}`,
          start: segment.scheduled_start_at || null,
          end: segment.scheduled_end_at || null,
        })),
      ].filter((period: any) => period.meeting_id);

      const lessonMeetingIds = new Set(meetingPeriods.map((period: any) => period.meeting_id));
      const lessonEvents = (events || []).filter((event: any) =>
        event.booking_id === s.booking_id &&
        (lessonMeetingIds.size === 0 || lessonMeetingIds.has(String(event.provider_meeting_id || "")))
      ).map((event: any) => {
        const period = meetingPeriods.find((item: any) =>
          item.meeting_id === String(event.provider_meeting_id || "")
        );
        const eventMs = event.event_time ? new Date(event.event_time).getTime() : NaN;
        const startMs = period?.start ? new Date(period.start).getTime() : NaN;
        const endMs = period?.end ? new Date(period.end).getTime() : NaN;
        const hasPeriod = Number.isFinite(eventMs) && Number.isFinite(startMs) && Number.isFinite(endMs);
        const graceMs = 15 * 60 * 1000;
        return {
          ...event,
          meeting_label: period?.label || "اجتماع غير محدد",
          meeting_scheduled_start_at: period?.start || null,
          meeting_scheduled_end_at: period?.end || null,
          outside_scheduled_window: hasPeriod
            ? eventMs < startMs - graceMs || eventMs > endMs + graceMs
            : null,
        };
      });

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
        meeting_periods: meetingPeriods,
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
