import { createClient } from "@supabase/supabase-js";

type Booking = {
  id: string;
  student_id: string;
  teacher_id: string;
  subject: string | null;
  start_at: string;
  end_at: string;
  timezone: string | null;
  status: string;
  meeting_provider: string | null;
};

type ZoomMeeting = { id?: number; join_url?: string; start_url?: string };
type ZoomToken = { access_token?: string };

function json(res: any, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getZoomToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom credentials are not configured.");
  }
  const basic = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  const response = await fetch(
    "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" +
      encodeURIComponent(accountId),
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + basic,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const data = (await response.json().catch(() => null)) as ZoomToken | null;
  if (!response.ok || !data?.access_token) {
    console.error("Zoom OAuth error", response.status);
    throw new Error("Unable to authenticate with Zoom.");
  }
  return data.access_token;
}

async function createZoomMeeting(booking: Booking) {
  const token = await getZoomToken();
  const start = new Date(booking.start_at);
  const end = new Date(booking.end_at);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw new Error("Invalid booking date or duration.");
  }
  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: ("Moallem - " + (booking.subject || "Educational Lesson")).slice(0, 200),
      type: 2,
      start_time: start.toISOString(),
      duration: Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000)),
      timezone: booking.timezone || "Africa/Cairo",
      settings: {
        waiting_room: true,
        join_before_host: false,
        meeting_authentication: false,
        participant_video: true,
        host_video: true,
        mute_upon_entry: true,
      },
    }),
  });
  const data = (await response.json().catch(() => null)) as ZoomMeeting | null;
  if (!response.ok || !data?.id || !data.join_url || !data.start_url) {
    console.error("Zoom create meeting error", response.status);
    throw new Error("Unable to create the Zoom meeting.");
  }
  return {
    providerMeetingId: String(data.id),
    joinUrl: data.join_url,
    hostUrl: data.start_url,
  };
}

async function cancelZoomMeeting(id: string) {
  try {
    const token = await getZoomToken();
    const response = await fetch(
      "https://api.zoom.us/v2/meetings/" + encodeURIComponent(id),
      { method: "DELETE", headers: { Authorization: "Bearer " + token } }
    );
    if (!response.ok && response.status !== 404) {
      console.error("Zoom cancel meeting error", response.status);
    }
  } catch (error) {
    console.error("Zoom cleanup error", error);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "طريقة الطلب غير مدعومة." });
  }

  try {
    const authorization = String(req.headers?.authorization || "");
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const admin = getAdminClient();

    if (!url || !anonKey || !authorization.startsWith("Bearer ")) {
      return json(res, 401, { error: "يجب تسجيل الدخول أولًا." });
    }
    if (!admin) {
      return json(res, 503, { error: "خدمة الاجتماعات غير مهيأة على الخادم." });
    }

    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return json(res, 401, { error: "جلسة الدخول غير صالحة." });
    }

    const bookingId = String(req.body?.booking_id || "");
    const requestedProvider = String(req.body?.provider || "");
    if (!bookingId || !["zoom", "google_meet"].includes(requestedProvider)) {
      return json(res, 400, { error: "رقم الحجز ومزود الاجتماع مطلوبان." });
    }
    if (requestedProvider !== "zoom") {
      return json(res, 503, { error: "Google Meet غير مهيأ بعد." });
    }
    if (
      !process.env.ZOOM_ACCOUNT_ID ||
      !process.env.ZOOM_CLIENT_ID ||
      !process.env.ZOOM_CLIENT_SECRET
    ) {
      return json(res, 503, { error: "Zoom غير مهيأ بعد. راجعي إعدادات البيئة في Vercel." });
    }

    const { data: booking, error: bookingError } = await userClient
      .from("bookings")
      .select("id,student_id,teacher_id,subject,start_at,end_at,timezone,status,meeting_provider")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return json(res, 404, { error: "الحجز غير موجود." });
    }
    const typedBooking = booking as Booking;
    if (
      typedBooking.student_id !== authData.user.id &&
      typedBooking.teacher_id !== authData.user.id
    ) {
      return json(res, 403, { error: "ليس لديك صلاحية لهذا الحجز." });
    }
    if (typedBooking.status !== "confirmed") {
      return json(res, 400, { error: "لا يمكن إنشاء اجتماع إلا للحجز المؤكد." });
    }
    if (typedBooking.meeting_provider && typedBooking.meeting_provider !== "zoom") {
      return json(res, 409, { error: "تم تحديد مزود اجتماع مختلف لهذا الحجز." });
    }

    const { data: existing, error: existingError } = await admin
      .from("live_sessions")
      .select("id,booking_id,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at")
      .eq("booking_id", typedBooking.id)
      .maybeSingle();

    if (existingError) {
      console.error("Live session lookup error", existingError);
      return json(res, 500, { error: "تعذر التحقق من اجتماع الحصة." });
    }
    if (existing) {
      return json(res, 200, {
        created: false,
        session: {
          ...existing,
          host_url: typedBooking.teacher_id === authData.user.id ? existing.host_url : null,
        },
      });
    }

    const meeting = await createZoomMeeting(typedBooking);
    const { data: session, error: sessionError } = await admin
      .from("live_sessions")
      .insert({
        booking_id: typedBooking.id,
        provider: "zoom",
        provider_meeting_id: meeting.providerMeetingId,
        join_url: meeting.joinUrl,
        host_url: meeting.hostUrl,
        status: "scheduled",
        scheduled_start_at: typedBooking.start_at,
        scheduled_end_at: typedBooking.end_at,
      })
      .select("id,booking_id,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at")
      .single();

    if (sessionError || !session) {
      await cancelZoomMeeting(meeting.providerMeetingId);
      console.error("Live session database error", sessionError);
      return json(res, 500, { error: "تعذر حفظ اجتماع الحصة." });
    }

    if (!typedBooking.meeting_provider) {
      await admin.from("bookings").update({ meeting_provider: "zoom" }).eq("id", typedBooking.id);
    }

    return json(res, 201, {
      created: true,
      session: {
        ...session,
        host_url: typedBooking.teacher_id === authData.user.id ? session.host_url : null,
      },
    });
  } catch (error) {
    console.error("Create live session error", error);
    return json(res, 500, { error: "تعذر إنشاء اجتماع الحصة. راجعي سجلات Vercel لمعرفة السبب." });
  }
}
