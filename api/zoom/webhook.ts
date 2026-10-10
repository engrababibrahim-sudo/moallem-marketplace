import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

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
  if (!secret) return send(res, 503, { error: "Zoom webhook secret is not configured" });
  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (body.event === "endpoint.url_validation") {
    const plainToken = String(body.payload?.plainToken || "");
    if (!plainToken) return send(res, 400, { error: "Missing validation token" });
    const encryptedToken = createHmac("sha256", secret).update(plainToken).digest("hex");
    return send(res, 200, { plainToken, encryptedToken });
  }
  const timestamp = String(req.headers["x-zm-request-timestamp"] || "");
  const signature = String(req.headers["x-zm-signature"] || "");
  const raw = typeof req.rawBody === "string" ? req.rawBody : JSON.stringify(body);
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return send(res, 401, { error: "Invalid webhook timestamp" });
  }
  const expected = "v0=" + createHmac("sha256", secret).update("v0:" + timestamp + ":" + raw).digest("hex");
  if (!safeEqual(signature, expected)) return send(res, 401, { error: "Invalid webhook signature" });
  const event = String(body.event || "");
  if (!["meeting.participant_joined", "meeting.participant_left"].includes(event)) {
    return send(res, 200, { received: true, ignored: true });
  }
  const object = body.payload?.object || {};
  const participant = object.participant || {};
  const meetingId = String(object.id || "");
  const eventTime = participant.date_time || participant.join_time || participant.leave_time;
  if (!meetingId || !eventTime) return send(res, 200, { received: true, ignored: true });
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return send(res, 503, { error: "Database is not configured" });
  try {
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: session, error } = await admin.from("live_sessions")
      .select("booking_id,provider_meeting_id").eq("provider_meeting_id", meetingId).maybeSingle();
    if (error) throw error;
    if (!session) return send(res, 200, { received: true, unmatched: true });
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
    return send(res, 200, { received: true });
  } catch (error) {
    console.error("Zoom attendance webhook failed", error);
    return send(res, 500, { error: "Unable to save attendance event" });
  }
}
