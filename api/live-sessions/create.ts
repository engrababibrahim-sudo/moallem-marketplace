import { createClient } from "@supabase/supabase-js";
import { decrypt, encrypt } from "../zoom/_oauth.js";

type Booking = {
  id: string;
  student_id: string;
  teacher_id: string;
  subject: string | null;
  start_at: string;
  end_at: string;
  timezone: string | null;
  status: string;
  payment_status: string;
  meeting_provider: string | null;
};

type ZoomMeeting = { id?: number; join_url?: string; start_url?: string };
type ZoomApiError = { code?: number; message?: string };

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

async function getTeacherZoomConnection(admin: any, teacherId: string): Promise<{ token: string; zoomUserId: string; zoomEmail: string }> {
  const { data: connection, error } = await admin
    .from("teacher_zoom_connections")
    .select("teacher_id,zoom_user_id,zoom_email,access_token_encrypted,refresh_token_encrypted,token_expires_at")
    .eq("teacher_id", teacherId)
    .maybeSingle();
  if (error) throw new Error("ZOOM_CONNECTION_LOOKUP_FAILED");
  if (!connection?.access_token_encrypted || !connection?.refresh_token_encrypted || !connection?.zoom_user_id || !connection?.zoom_email) {
    throw new Error("ZOOM_TEACHER_NOT_CONNECTED");
  }
  let token = decrypt(String(connection.access_token_encrypted));
  const expiresAt = Date.parse(String(connection.token_expires_at || ""));
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() + 120_000) {
    const clientId = process.env.ZOOM_OAUTH_CLIENT_ID;
    const clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("ZOOM_OAUTH_NOT_CONFIGURED");
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decrypt(String(connection.refresh_token_encrypted)),
      }),
    });
    const refreshed = await response.json().catch(() => null) as { access_token?: string; refresh_token?: string; expires_in?: number } | null;
    if (!response.ok || !refreshed?.access_token || !refreshed?.refresh_token) {
      console.error("Zoom token refresh failed", response.status);
      throw new Error("ZOOM_RECONNECT_REQUIRED");
    }
    token = refreshed.access_token;
    const { error: saveError } = await admin.from("teacher_zoom_connections").update({
      access_token_encrypted: encrypt(refreshed.access_token),
      refresh_token_encrypted: encrypt(refreshed.refresh_token),
      token_expires_at: new Date(Date.now() + Math.max(60, Number(refreshed.expires_in || 3600)) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("teacher_id", teacherId);
    if (saveError) throw new Error("ZOOM_TOKEN_SAVE_FAILED");
  }
  return { token, zoomUserId: String(connection.zoom_user_id), zoomEmail: String(connection.zoom_email).trim().toLowerCase() };
}

async function createZoomMeeting(booking: Booking, token: string) {
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
  const data = (await response.json().catch(() => null)) as (ZoomMeeting & ZoomApiError) | null;
  if (!response.ok || !data?.id || !data.join_url || !data.start_url) {
    const zoomCode = typeof data?.code === "number" ? data.code : undefined;
    const zoomMessage = String(data?.message || "Zoom did not return a meeting URL").slice(0, 240);
    console.error("Zoom create meeting error", {
      httpStatus: response.status,
      zoomCode,
      zoomMessage,
      requestedHost: "me (OAuth-connected account)",
    });
    throw new Error(
      "ZOOM_CREATE_FAILED:" +
      (zoomCode === undefined ? "unknown" : String(zoomCode)) +
      ":" + zoomMessage
    );
  }
  return {
    providerMeetingId: String(data.id),
    joinUrl: data.join_url,
    hostUrl: data.start_url,
  };
}

async function existingMeetingBelongsToTeacher(id: string, teacherEmail: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(
      "https://api.zoom.us/v2/meetings/" + encodeURIComponent(id),
      { headers: { Authorization: "Bearer " + token } }
    );
    if (!response.ok) return false;
    const meeting = (await response.json().catch(() => null)) as { host_email?: string } | null;
    return String(meeting?.host_email || "").trim().toLowerCase() === teacherEmail;
  } catch (error) {
    console.error("Zoom existing meeting verification failed", error);
    return false;
  }
}

async function cancelZoomMeeting(id: string, token: string) {
  try {
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
    const { data: booking, error: bookingError } = await userClient
      .from("bookings")
      .select("id,student_id,teacher_id,subject,start_at,end_at,timezone,status,payment_status,meeting_provider")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return json(res, 404, { error: "الحجز غير موجود." });
    }
    const typedBooking = booking as Booking;
    // Only the assigned teacher may create a host-owned Zoom meeting.
    if (typedBooking.teacher_id !== authData.user.id) {
      return json(res, 403, { error: "إنشاء اجتماع Zoom متاح للمعلم المسؤول عن الحجز فقط." });
    }
    if (
      typedBooking.student_id !== authData.user.id &&
      typedBooking.teacher_id !== authData.user.id
    ) {
      return json(res, 403, { error: "ليس لديك صلاحية لهذا الحجز." });
    }
    if (typedBooking.status !== "confirmed") {
      return json(res, 400, { error: "لا يمكن إنشاء اجتماع إلا للحجز المؤكد." });
    }
    if (typedBooking.payment_status !== "paid") {
      return json(res, 402, { error: "يجب إتمام الدفع قبل إنشاء رابط الحصة." });
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
    let zoomConnection: { token: string; zoomUserId: string; zoomEmail: string };
    try {
      zoomConnection = await getTeacherZoomConnection(admin, typedBooking.teacher_id);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (reason === "ZOOM_TEACHER_NOT_CONNECTED") {
        return json(res, 409, { error: "يجب على المعلم ربط حساب Zoom الخاص به أولًا من إعدادات حساب المعلم." });
      }
      if (reason === "ZOOM_RECONNECT_REQUIRED") {
        return json(res, 409, { error: "انتهت صلاحية اتصال Zoom. يرجى فصل الربط ثم ربط الحساب مرة أخرى." });
      }
      console.error("Teacher Zoom connection error", reason);
      return json(res, 503, { error: "تعذر تجهيز اتصال Zoom للمعلم. راجعي إعدادات OAuth وسجلات الخادم." });
    }
    const teacherZoomUserId = zoomConnection.zoomUserId;
    const teacherZoomEmail = zoomConnection.zoomEmail;

    // Reuse a saved meeting when Zoom confirms that it is still owned by this
    // teacher. This prevents duplicate meetings and keeps the student's link stable.
    if (
      existing?.provider === "zoom" &&
      existing.provider_meeting_id &&
      existing.join_url &&
      existing.host_url &&
      await existingMeetingBelongsToTeacher(String(existing.provider_meeting_id), teacherZoomEmail, zoomConnection.token)
    ) {
      return json(res, 200, {
        created: false,
        reused: true,
        session: {
          ...existing,
          host_url: existing.host_url,
        },
      });
    }

    // If the saved meeting is missing or belongs to another Zoom user, create
    // a replacement owned by the assigned teacher and only then update the DB.
    let meeting;
    try {
      meeting = await createZoomMeeting(typedBooking, zoomConnection.token);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      console.error("Zoom meeting creation failed", detail);
      const match = detail.match(/^ZOOM_CREATE_FAILED:([^:]+):(.*)$/);
      const zoomCode = match?.[1] || "";
      const zoomMessage = match?.[2] || "";

      let userMessage =
        "رفض Zoom إنشاء الاجتماع. لم يتم حذف الاجتماع القديم.";
      if (/user.*(not exist|does not exist|not found)|invalid.*user/i.test(zoomMessage)) {
        userMessage =
          "Zoom رفض إنشاء الاجتماع لأن بريد المعلم ليس مستخدمًا داخل حساب Zoom المرتبط بالمنصة. يلزم اختيار حساب مضيف موجود بالفعل؛ لا يمكن للكود إنشاء مستخدم Zoom تلقائيًا.";
      } else if (/scope|permission|privilege|not authorized/i.test(zoomMessage) || zoomCode === "4711") {
        userMessage =
          "Zoom رفض الطلب بسبب صلاحيات تطبيق التكامل. سبب الرفض: " + zoomMessage;
      } else if (zoomMessage) {
        userMessage = "Zoom رفض إنشاء الاجتماع (رمز " + (zoomCode || "غير معروف") + "): " + zoomMessage +
          ". لم يتم حذف الاجتماع القديم.";
      }

      return json(res, 502, {
        error: userMessage,
        zoom_code: zoomCode || undefined,
      });
    }

    let session: any;
    let sessionError: any;
    if (existing) {
      const result = await admin
        .from("live_sessions")
        .update({
          provider: "zoom",
          provider_meeting_id: meeting.providerMeetingId,
          join_url: meeting.joinUrl,
          host_url: meeting.hostUrl,
          status: "scheduled",
          scheduled_start_at: typedBooking.start_at,
          scheduled_end_at: typedBooking.end_at,
        })
        .eq("id", existing.id)
        .select("id,booking_id,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at")
        .single();
      session = result.data;
      sessionError = result.error;
    } else {
      const result = await admin
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
      session = result.data;
      sessionError = result.error;
    }

    if (sessionError || !session) {
      await cancelZoomMeeting(meeting.providerMeetingId, zoomConnection.token);
      console.error("Live session database error", sessionError);
      return json(res, 500, { error: "تعذر حفظ اجتماع الحصة. لم يتم استبدال الرابط المحفوظ." });
    }

    // Intentionally do not cancel the previous meeting automatically: it may
    // already be shared with a paid student. The database now points to the new
    // teacher-owned meeting, while the old meeting remains available if needed.
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
