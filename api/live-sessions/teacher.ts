```typescript
import { createClient } from "@supabase/supabase-js";
import { decrypt, encrypt } from "../zoom/_oauth.js";

type ZoomMeetingDetails = {
  start_url?: string;
  host_email?: string;
};

function json(res: any, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}

async function getTeacherZoomConnection(
  admin: any,
  teacherId: string
): Promise<{ token: string; zoomEmail: string }> {
  const { data: connection, error } = await admin
    .from("teacher_zoom_connections")
    .select(
      "teacher_id,zoom_email,access_token_encrypted,refresh_token_encrypted,token_expires_at"
    )
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (error) {
    console.error("Teacher Zoom connection lookup failed", error.code);
    throw new Error("ZOOM_CONNECTION_LOOKUP_FAILED");
  }

  if (
    !connection?.access_token_encrypted ||
    !connection?.refresh_token_encrypted ||
    !connection?.zoom_email
  ) {
    throw new Error("ZOOM_TEACHER_NOT_CONNECTED");
  }

  let token = decrypt(String(connection.access_token_encrypted));
  const expiresAt = Date.parse(String(connection.token_expires_at || ""));

  // Renew the connected teacher's token before it expires.
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() + 120_000) {
    const clientId = process.env.ZOOM_OAUTH_CLIENT_ID;
    const clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("ZOOM_OAUTH_NOT_CONFIGURED");
    }

    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decrypt(
          String(connection.refresh_token_encrypted)
        ),
      }),
    });

    const refreshed = (await response.json().catch(() => null)) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    } | null;

    if (
      !response.ok ||
      !refreshed?.access_token ||
      !refreshed?.refresh_token
    ) {
      console.error("Zoom teacher token refresh failed", response.status);
      throw new Error("ZOOM_RECONNECT_REQUIRED");
    }

    token = refreshed.access_token;

    const { error: saveError } = await admin
      .from("teacher_zoom_connections")
      .update({
        access_token_encrypted: encrypt(refreshed.access_token),
        refresh_token_encrypted: encrypt(refreshed.refresh_token),
        token_expires_at: new Date(
          Date.now() +
            Math.max(60, Number(refreshed.expires_in || 3600)) * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("teacher_id", teacherId);

    if (saveError) {
      console.error("Zoom refreshed token could not be saved", saveError.code);
      throw new Error("ZOOM_TOKEN_SAVE_FAILED");
    }
  }

  return {
    token,
    zoomEmail: String(connection.zoom_email).trim().toLowerCase(),
  };
}

async function refreshHostUrl(
  token: string,
  meetingId: string,
  teacherEmail: string
): Promise<string | null> {
  try {
    const response = await fetch(
      "https://api.zoom.us/v2/meetings/" +
        encodeURIComponent(meetingId),
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const data = (await response.json().catch(() => null)) as
      | ZoomMeetingDetails
      | null;

    if (!response.ok) {
      console.error(
        "Zoom meeting ownership verification failed",
        response.status,
        meetingId
      );
      return null;
    }

    const owner = String(data?.host_email || "")
      .trim()
      .toLowerCase();

    if (!owner || owner !== teacherEmail || !data?.start_url) {
      console.warn(
        "Suppressing unverified or mismatched Zoom host URL",
        meetingId
      );
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
    return json(res, 405, {
      error: "طريقة الطلب غير مدعومة.",
    });
  }

  const authorization = String(req.headers?.authorization || "");
  const url =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !anonKey ||
    !serviceKey ||
    !authorization.startsWith("Bearer ")
  ) {
    return json(res, 401, {
      error: "يجب تسجيل الدخول أولًا.",
    });
  }

  try {
    const userClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const { data: authData, error: authError } =
      await userClient.auth.getUser();

    if (authError || !authData.user) {
      return json(res, 401, {
        error: "جلسة الدخول غير صالحة.",
      });
    }

    const admin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile?.role !== "teacher") {
      return json(res, 403, {
        error: "هذه الروابط متاحة للمعلم المسؤول فقط.",
      });
    }

    // Only confirmed and paid bookings can expose lesson links.
    const { data: bookings, error: bookingsError } = await admin
      .from("bookings")
      .select("id")
      .eq("teacher_id", authData.user.id)
      .eq("status", "confirmed")
      .eq("payment_status", "paid");

    if (bookingsError) throw bookingsError;

    const ids = (bookings ?? []).map((booking: any) => booking.id);

    if (!ids.length) {
      return json(res, 200, { sessions: [] });
    }

    const [
      { data: sessions, error: sessionsError },
      { data: segments, error: segmentsError },
    ] = await Promise.all([
      admin
        .from("live_sessions")
        .select(
          "id,booking_id,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at"
        )
        .in("booking_id", ids),

      admin
        .from("live_session_segments")
        .select(
          "booking_id,provider_meeting_id,join_url,host_url,scheduled_start_at,scheduled_end_at,status"
        )
        .in("booking_id", ids)
        .eq("segment_number", 2),
    ]);

    if (sessionsError) throw sessionsError;

    if (segmentsError) {
      console.warn(
        "Teacher continuation links unavailable; migration may be pending",
        segmentsError.message
      );
    }

    const allSessions = sessions ?? [];
    const allSegments = segments ?? [];

    // Use the Zoom account explicitly connected by this teacher.
    const needsZoomVerification = [
      ...allSessions,
      ...allSegments,
    ].some(
      (session: any) =>
        session.provider === "zoom" ||
        Boolean(session.provider_meeting_id)
    );

    let zoomConnection: {
      token: string;
      zoomEmail: string;
    } | null = null;

    if (needsZoomVerification) {
      try {
        zoomConnection = await getTeacherZoomConnection(
          admin,
          authData.user.id
        );
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "";

        console.error("Teacher Zoom connection unavailable", reason);
      }
    }

    const teacherEmail = zoomConnection?.zoomEmail || "";
    const zoomToken = zoomConnection?.token || null;

    const refreshedSessions = await Promise.all(
      allSessions.map(async (session: any) => {
        const isZoom =
          session.provider === "zoom" ||
          Boolean(session.provider_meeting_id);

        const hostUrl =
          isZoom &&
          zoomToken &&
          teacherEmail &&
          session.provider_meeting_id
            ? await refreshHostUrl(
                zoomToken,
                String(session.provider_meeting_id),
                teacherEmail
              )
            : null;

        return {
          ...session,
          host_url: hostUrl,
          join_url: session.join_url ?? null,
        };
      })
    );

    const refreshedSegments = await Promise.all(
      allSegments.map(async (segment: any) => {
        const hostUrl =
          zoomToken &&
          teacherEmail &&
          segment.provider_meeting_id
            ? await refreshHostUrl(
                zoomToken,
                String(segment.provider_meeting_id),
                teacherEmail
              )
            : null;

        return {
          ...segment,
          host_url: hostUrl,
          join_url: segment.join_url ?? null,
        };
      })
    );

    const continuationByBooking = Object.fromEntries(
      refreshedSegments.map((segment: any) => [
        segment.booking_id,
        segment,
      ])
    );

    return json(res, 200, {
      sessions: refreshedSessions.map((session: any) => {
        const continuation =
          continuationByBooking[session.booking_id];

        return {
          ...session,
          continuation_join_url:
            continuation?.join_url ?? null,

          // Keep the existing behavior: do not expose continuation host links.
          continuation_host_url: undefined,

          continuation_scheduled_start_at:
            continuation?.scheduled_start_at ?? null,

          continuation_scheduled_end_at:
            continuation?.scheduled_end_at ?? null,
        };
      }),
    });
  } catch (error) {
    console.error("Teacher live sessions lookup failed", error);

    return json(res, 500, {
      error: "تعذر تحميل روابط الحصص.",
    });
  }
}
```
