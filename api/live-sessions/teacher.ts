import { createClient } from "@supabase/supabase-js";

type ZoomToken = { access_token?: string };
type ZoomMeetingDetails = { start_url?: string; host_email?: string };

function json(res: any, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
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
    console.error("Zoom OAuth error while refreshing host links", response.status);
    throw new Error("Unable to authenticate with Zoom.");
  }
  return data.access_token;
}

async function refreshHostUrl(token: string, meetingId: string, teacherEmail: string): Promise<string | null> {
  try {
    // Never return a stored host URL unless Zoom confirms the meeting belongs to this teacher.
    const response = await fetch(
      "https://api.zoom.us/v2/meetings/" + encodeURIComponent(meetingId),
      { headers: { Authorization: "Bearer " + token } }
    );
    const data = (await response.json().catch(() => null)) as ZoomMeetingDetails | null;
    if (!response.ok) {
      console.error("Zoom meeting ownership verification failed", response.status, meetingId);
      return null;
    }
    const owner = String(data?.host_email || "").trim().toLowerCase();
    if (!owner || owner !== teacherEmail || !data?.start_url) {
      console.warn("Suppressing unverified or mismatched Zoom host URL", meetingId);
      return null;
    }
    return data.start_url;
  } catch (error) {
    console.error("Zoom host URL verification failed", meetingId, error);
    return null;
  }
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
      admin.from("live_sessions").select("id,booking_id,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at").in("booking_id", ids),
      admin.from("live_session_segments").select("booking_id,provider_meeting_id,join_url,host_url,scheduled_start_at,scheduled_end_at,status").in("booking_id", ids).eq("segment_number", 2),
    ]);
    if (sessionsError) throw sessionsError;
    if (segmentsError) console.warn("Teacher continuation links unavailable; migration may be pending", segmentsError.message);

    // Host URLs are sensitive. Only expose a URL when Zoom confirms this teacher is the host.
    const teacherEmail = String(authData.user.email || "").trim().toLowerCase();
    let zoomToken: string | null = null;
    const needsRefresh = [...(sessions ?? []), ...(segments ?? [])].some((s: any) => s.provider_meeting_id);
    if (needsRefresh && process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET) {
      try {
        zoomToken = await getZoomToken();
      } catch (error) {
        console.error("Unable to refresh Zoom host URLs", error);
      }
    }

    const refreshedSessions = await Promise.all((sessions ?? []).map(async (s: any) => {
      const hostUrl = zoomToken && s.provider_meeting_id && teacherEmail
        ? await refreshHostUrl(zoomToken, String(s.provider_meeting_id), teacherEmail)
        : null;
      return { ...s, host_url: hostUrl, join_url: s.join_url ?? null };
    }));

    const refreshedSegments = await Promise.all((segments ?? []).map(async (s: any) => {
      const hostUrl = zoomToken && s.provider_meeting_id && teacherEmail
        ? await refreshHostUrl(zoomToken, String(s.provider_meeting_id), teacherEmail)
        : null;
      return { ...s, host_url: hostUrl, join_url: s.join_url ?? null };
    }));

    const continuationByBooking = Object.fromEntries(refreshedSegments.map((s: any) => [s.booking_id, s]));
    return json(res, 200, { sessions: refreshedSessions.map((s: any) => {
      const continuation = continuationByBooking[s.booking_id];
      return {
        ...s,
        continuation_join_url: continuation?.join_url ?? null,
        continuation_host_url: undefined,
        continuation_scheduled_start_at: continuation?.scheduled_start_at ?? null,
        continuation_scheduled_end_at: continuation?.scheduled_end_at ?? null,
      };
    }) });
  } catch (error) {
    console.error("Teacher live sessions lookup failed", error);
    return json(res, 500, { error: "تعذر تحميل روابط الحصص." });
  }
}
