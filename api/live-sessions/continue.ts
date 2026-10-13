import { createClient } from "@supabase/supabase-js";

type ZoomMeeting = { id?: number; join_url?: string; start_url?: string };
type ZoomToken = { access_token?: string };

function json(res: any, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}

async function getZoomToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) throw new Error("Zoom credentials are not configured.");
  const basic = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  const response = await fetch("https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + encodeURIComponent(accountId), {
    method: "POST",
    headers: { Authorization: "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = (await response.json().catch(() => null)) as ZoomToken | null;
  if (!response.ok || !data?.access_token) throw new Error("Unable to authenticate with Zoom.");
  return data.access_token;
}

async function cancelZoomMeeting(id: string) {
  try {
    const token = await getZoomToken();
    await fetch("https://api.zoom.us/v2/meetings/" + encodeURIComponent(id), {
      method: "DELETE", headers: { Authorization: "Bearer " + token },
    });
  } catch (error) { console.error("Zoom continuation cleanup failed", error); }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "طريقة الطلب غير مدعومة." });
  }

  const authorization = String(req.headers?.authorization || "");
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey || !authorization.startsWith("Bearer ")) {
    return json(res, 401, { error: "يجب تسجيل الدخول أولًا." });
  }
  if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
    return json(res, 503, { error: "خدمة Zoom غير مهيأة على الخادم." });
  }

  try {
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json(res, 401, { error: "جلسة الدخول غير صالحة." });

    const bookingId = String(req.body?.booking_id || "");
    if (!bookingId) return json(res, 400, { error: "رقم الحجز مطلوب." });

    const { data: booking, error: bookingError } = await userClient.from("bookings")
      .select("id,student_id,teacher_id,subject,start_at,end_at,timezone,status,payment_status,meeting_provider")
      .eq("id", bookingId).maybeSingle();
    if (bookingError || !booking) return json(res, 404, { error: "الحجز غير موجود." });
    if (booking.teacher_id !== authData.user.id) return json(res, 403, { error: "استكمال الحصة متاح للمعلم المسؤول عن الحجز فقط." });
    if (booking.status !== "confirmed" || booking.payment_status !== "paid") {
      return json(res, 400, { error: "يجب أن يكون الحجز مؤكدًا ومدفوعًا لاستكمال الحصة." });
    }
    if (booking.meeting_provider && booking.meeting_provider !== "zoom") {
      return json(res, 409, { error: "هذا الحجز ليس على Zoom." });
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: original, error: originalError } = await admin.from("live_sessions")
      .select("id,booking_id,provider_meeting_id").eq("booking_id", bookingId).maybeSingle();
    if (originalError) throw originalError;
    if (!original) return json(res, 409, { error: "أنشئي حصة Zoom الأساسية أولًا قبل استكمالها." });

    const { data: existing, error: existingError } = await admin.from("live_session_segments")
      .select("id,booking_id,segment_number,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at")
      .eq("booking_id", bookingId).eq("segment_number", 2).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return json(res, 409, { error: "يوجد رابط استكمال محفوظ مسبقًا. لن نعيد رابط المضيف القديم تلقائيًا؛ يلزم التحقق من مالك الاجتماع أولًا." });

    const teacherZoomUserId = String(authData.user.email || "").trim().toLowerCase();
    if (!teacherZoomUserId) return json(res, 400, { error: "لا يوجد بريد إلكتروني لحساب المعلم لاستخدامه مع Zoom." });

    const token = await getZoomToken();
    const startAt = new Date(Date.now() + 60_000);
    const endAt = new Date(startAt.getTime() + 40 * 60_000);
    const topic = ("مُعلّم - استكمال الحصة - " + (booking.subject || "حصة تعليمية")).slice(0, 200);
    const zoomResponse = await fetch("https://api.zoom.us/v2/users/" + encodeURIComponent(teacherZoomUserId) + "/meetings", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        topic, type: 2, start_time: startAt.toISOString(), duration: 40,
        timezone: booking.timezone || "Africa/Cairo",
        settings: { waiting_room: true, join_before_host: false, meeting_authentication: false, participant_video: true, host_video: true, mute_upon_entry: true },
      }),
    });
    const meeting = (await zoomResponse.json().catch(() => null)) as ZoomMeeting | null;
    if (!zoomResponse.ok || !meeting?.id || !meeting.join_url || !meeting.start_url) {
      console.error("Zoom continuation create failed", zoomResponse.status);
      return json(res, 502, { error: "تعذر إنشاء رابط استكمال الحصة من Zoom." });
    }

    const { data: segment, error: insertError } = await admin.from("live_session_segments").insert({
      booking_id: bookingId, segment_number: 2, provider: "zoom",
      provider_meeting_id: String(meeting.id), join_url: meeting.join_url, host_url: meeting.start_url,
      status: "scheduled", scheduled_start_at: startAt.toISOString(), scheduled_end_at: endAt.toISOString(),
    }).select("id,booking_id,segment_number,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at").single();

    if (insertError || !segment) {
      await cancelZoomMeeting(String(meeting.id));
      if (insertError?.code === "23505") {
        const { data: winner } = await admin.from("live_session_segments")
          .select("id,booking_id,segment_number,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at")
          .eq("booking_id", bookingId).eq("segment_number", 2).maybeSingle();
        if (winner) return json(res, 200, { created: false, segment: winner });
      }
      console.error("Unable to save Zoom continuation", insertError);
      return json(res, 500, { error: "تم إنشاء رابط Zoom لكن تعذر حفظه في المنصة." });
    }

    return json(res, 201, { created: true, segment });
  } catch (error) {
    console.error("Create Zoom continuation failed", error);
    return json(res, 500, { error: "تعذر تجهيز استكمال الحصة. راجعي إعدادات Zoom وقاعدة البيانات." });
  }
}
