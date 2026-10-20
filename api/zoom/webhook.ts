
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

export const config = { api: { bodyParser: false } };

function send(res: any, status: number, body: unknown) {
  return res.status(status).json(body);
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function validDate(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return send(res, 405, { error: "Method not allowed" });
  }

  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

  if (!secret) {
    console.error(
      "Zoom webhook unavailable: ZOOM_WEBHOOK_SECRET_TOKEN is not configured"
    );
    return send(res, 503, {
      error: "Zoom webhook secret is not configured",
    });
  }

  let raw = "";

  try {
    if (typeof req.rawBody === "string") {
      raw = req.rawBody;
    } else {
      const chunks: Buffer[] = [];

      for await (const chunk of req) {
        chunks.push(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        );
      }

      raw = Buffer.concat(chunks).toString("utf8");
    }
  } catch {
    console.error("Zoom webhook: failed to read request body");
    return send(res, 400, { error: "Invalid request body" });
  }

  let body: any;

  try {
    body = JSON.parse(raw || "{}");
  } catch {
    console.error("Zoom webhook: received invalid JSON");
    return send(res, 400, { error: "Invalid JSON" });
  }

  // Zoom endpoint URL validation
  if (body.event === "endpoint.url_validation") {
    const plainToken = String(body.payload?.plainToken || "");

    if (!plainToken) {
      return send(res, 400, { error: "Missing validation token" });
    }

    const encryptedToken = createHmac("sha256", secret)
      .update(plainToken)
      .digest("hex");

    console.info("Zoom webhook endpoint URL validation requested");

    return send(res, 200, {
      plainToken,
      encryptedToken,
    });
  }

  // Verify the Zoom webhook signature
  const timestamp = String(
    req.headers["x-zm-request-timestamp"] || ""
  );
  const signature = String(
    req.headers["x-zm-signature"] || ""
  );

  const timestampNumber = Number(timestamp);

  if (
    !timestamp ||
    !signature ||
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() / 1000 - timestampNumber) > 300
  ) {
    console.warn(
      "Zoom webhook rejected: missing or expired signature timestamp"
    );
    return send(res, 401, { error: "Invalid webhook timestamp" });
  }

  const expected =
    "v0=" +
    createHmac("sha256", secret)
      .update("v0:" + timestamp + ":" + raw)
      .digest("hex");

  if (!safeEqual(signature, expected)) {
    console.warn("Zoom webhook rejected: signature mismatch");
    return send(res, 401, { error: "Invalid webhook signature" });
  }

  const event = String(body.event || "");
  const object = body.payload?.object || {};
  const meetingId = String(object.id || "");

  // Ignore events that this endpoint does not process.
  const isAttendanceEvent = [
    "meeting.participant_joined",
    "meeting.participant_left",
  ].includes(event);

  const isRecordingEvent = event === "recording.completed";

  if (!isAttendanceEvent && !isRecordingEvent) {
    console.info("Zoom webhook event ignored", { event });
    return send(res, 200, {
      received: true,
      ignored: true,
    });
  }

  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Zoom webhook unavailable: Supabase server credentials are not configured"
    );
    return send(res, 503, {
      error: "Database is not configured",
    });
  }

  try {
    const admin = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Find the booking linked to the Zoom meeting.
    async function findBookingId(id: string) {
      const { data: session, error } = await admin
        .from("live_sessions")
        .select("booking_id")
        .eq("provider_meeting_id", id)
        .maybeSingle();

      if (error) throw error;

      if (session?.booking_id) {
        return String(session.booking_id);
      }

      const { data: segment, error: segmentError } = await admin
        .from("live_session_segments")
        .select("booking_id")
        .eq("provider_meeting_id", id)
        .maybeSingle();

      if (segmentError) throw segmentError;

      return segment?.booking_id
        ? String(segment.booking_id)
        : null;
    }

    // Save completed Zoom cloud recordings.
    if (isRecordingEvent) {
      if (!meetingId) {
        console.warn(
          "Zoom recording event ignored: meeting ID missing"
        );
        return send(res, 200, {
          received: true,
          ignored: true,
        });
      }

      const bookingId = await findBookingId(meetingId);

      if (!bookingId) {
        console.warn(
          "Zoom recording did not match a live session",
          { meetingId }
        );

        return send(res, 200, {
          received: true,
          unmatched: true,
        });
      }

      const files = Array.isArray(object.recording_files)
        ? object.recording_files
        : [];

      const videoFiles = files.filter((file: any) => {
        const playUrl = String(file.play_url || "");

        return (
          String(file.file_type || "").toUpperCase() === "MP4" &&
          String(file.status || "").toLowerCase() === "completed" &&
          /^https:\/\/\S+$/i.test(playUrl)
        );
      });

      if (videoFiles.length === 0) {
        console.info(
          "Zoom recording completed without a playable MP4 file",
          { meetingId }
        );

        return send(res, 200, {
          received: true,
          noVideoFiles: true,
        });
      }

      const rows = videoFiles.map((file: any) => {
        const fileId = String(file.id || "");

        return {
          id: fileId || `${meetingId}:${file.recording_start || "recording"}`,
          booking_id: bookingId,
          provider_meeting_id: meetingId,
          recording_uuid: object.uuid
            ? String(object.uuid)
            : null,
          recording_type: file.recording_type
            ? String(file.recording_type)
            : null,
          file_type: String(file.file_type || "MP4"),
          play_url: String(file.play_url),
          status: String(file.status || "completed"),
          recording_start: validDate(file.recording_start),
          recording_end: validDate(file.recording_end),
          updated_at: new Date().toISOString(),
        };
      });

      const { error: upsertError } = await admin
        .from("zoom_recordings")
        .upsert(rows, { onConflict: "id" });

      if (upsertError) throw upsertError;

      console.info("Zoom recordings saved", {
        bookingId,
        meetingId,
        count: rows.length,
      });

      return send(res, 200, {
        received: true,
        recordingsSaved: rows.length,
      });
    }

    // Existing participant attendance handling.
    const participant = object.participant || {};
    const eventTime =
      participant.date_time ||
      participant.join_time ||
      participant.leave_time;

    if (!meetingId || !eventTime) {
      console.warn(
        "Zoom attendance event ignored: meeting ID or event time missing",
        {
          event,
          hasMeetingId: Boolean(meetingId),
          hasEventTime: Boolean(eventTime),
        }
      );

      return send(res, 200, {
        received: true,
        ignored: true,
      });
    }

    const parsedEventTime = validDate(String(eventTime));

    if (!parsedEventTime) {
      console.warn("Zoom attendance event has an invalid date");
      return send(res, 200, {
        received: true,
        ignored: true,
      });
    }

    const bookingId = await findBookingId(meetingId);

    if (!bookingId) {
      console.warn(
        "Zoom attendance event did not match a live session or continuation",
        { event, meetingId }
      );

      return send(res, 200, {
        received: true,
        unmatched: true,
      });
    }

    const { error: insertError } = await admin
      .from("zoom_attendance_events")
      .insert({
        booking_id: bookingId,
        provider_meeting_id: meetingId,
        event_type: event,
        participant_name:
          participant.user_name || participant.name || null,
        participant_email: participant.email || null,
        participant_user_id:
          participant.participant_user_id ||
          participant.user_id ||
          participant.id ||
          null,
        event_time: parsedEventTime,
        raw_event: body,
      });

    if (insertError) throw insertError;

    console.info("Zoom attendance event saved", {
      event,
      bookingId,
      meetingId,
    });

    return send(res, 200, { received: true });
  } catch (error) {
    console.error("Zoom webhook processing failed", error);

    return send(res, 500, {
      error: "Unable to process Zoom webhook event",
    });
  }
}
