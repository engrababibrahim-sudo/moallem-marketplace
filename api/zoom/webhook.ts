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
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret) {
    console.error("Zoom webhook unavailable: ZOOM_WEBHOOK_SECRET_TOKEN is not configured");
    return send(res, 503, { error: "Zoom webhook secret is not configured" });
  }
  let raw = "";
  try {
    if (typeof req.rawBody === "string") raw = req.rawBody;
    else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      raw = Buffer.concat(chunks).toString("utf8");
    }
  } catch {
    console.error("Zoom webhook: failed to read request body");
    return send(res, 400, { error: "Invalid request body" });
  }
  let body: any;
  try { body = JSON.parse(raw || "{}"); } catch {
    console.error("Zoom webhook: received invalid JSON");
    return send(res, 400, { error: "Invalid JSON" });
  }
  if (body.event === "endpoint.url_validation") {
    const plainToken = String(body.payload?.plainToken || "");
    if (!plainToken) return send(res, 400, { error: "Missing validation token" });
    const encryptedToken = createHmac("sha256", secret).update(plainToken).digest("hex");
    console.info("Zoom webhook endpoint URL validation requested");
    return send(res, 200, { plainToken, encryptedToken });
  }
  const timestamp = String(req.headers["x-zm-request-timestamp"] || "");
  const signature = String(req.headers["x-zm-signature"] || "");
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    console.warn("Zoom webhook rejected: missing or expired signature timestamp");
    return send(res, 401, { error: "Invalid webhook timestamp" });
  }
  const expected = "v0=" + createHmac("sha256", secret).update("v0:" + timestamp + ":" + raw).digest("hex");
  if (!safeEqual(signature, expected)) {
    console.warn("Zoom webhook rejected: signature mismatch");
    return send(res, 401, { error: "Invalid webhook signature" });
  }
  const event = String(body.event || "");
  if (!["meeting.participant_joined", "meeting.participant_left"].includes(event)) {
    console.info("Zoom webhook event ignored", { event });
    return send(res, 200, { received: true, ignored: true });
  }
  const object = body.payload?.object || {};
  const participant = object.participant || {};
  const meetingId = String(object.id || "");
  const eventTime = participant.date_time || participant.join_time || participant.leave_time;
  if (!meetingId || !eventTime) {
    console.warn("Zoom attendance event ignored: meeting ID or event time missing", { event, hasMeetingId: Boolean(meetingId), hasEventTime: Boolean(eventTime) });
    return send(res, 200, { received: true, ignored: true });
  }
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Zoom webhook unavailable: Supabase server credentials are not configured");
    return send(res, 503, { error: "Database is not configured" });
  }
  try {
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: session, error } = await admin.from("live_sessions")
      .select("booking_id,provider_meeting_id").eq("provider_meeting_id", meetingId).maybeSingle();
    if (error) throw error;
    if (!session) {
      console.warn("Zoom attendance event did not match a live session", { event, meetingId });
      return send(res, 200, { received: true, unmatched: true });
    }
    const { error: insertError } = await admin.from("zoom_attendance_events").insert({
      booking_id: session.booking_id,
      provider_meeting_id: meetingId,
      event_type: event,
      participant_name: participant.user_name || participant.name || null,
      participant_email: participant.email || null,
      participant_user_id: participant.participant_user_id || participant.user_id || participant.id || null,
      event_time: new Date(eventTime).toISOString(),
      raw_event: body
    });
    if (insertError) throw insertError;
    console.info("Zoom attendance event saved", { event, bookingId: session.booking_id, meetingId });
    return send(res, 200, { received: true });
  } catch (error) {
    console.error("Zoom attendance webhook failed", error);
    return send(res, 500, { error: "Unable to save attendance event" });
  }
}
