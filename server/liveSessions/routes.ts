import { createClient } from "@supabase/supabase-js";
import type { Express, Request, Response } from "express";
import { getMeetingProvider, type MeetingProvider } from "./providers";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getUserClient(req: Request) {
  const auth = req.header("authorization");
  if (!supabaseUrl || !supabasePublishableKey || !auth?.startsWith("Bearer ")) {
    return null;
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: auth } },
  });
}

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function registerLiveSessionManagementRoutes(app: Express) {
  app.post("/api/live-sessions/create", async (req: Request, res: Response) => {
    try {
      const userClient = getUserClient(req);
      const admin = getAdminClient();

      if (!userClient) {
        res.status(401).json({ error: "يجب تسجيل الدخول أولًا." });
        return;
      }

      if (!admin) {
        res.status(503).json({ error: "خدمة الاجتماعات غير مهيأة على الخادم." });
        return;
      }

      const { data: authData, error: authError } = await userClient.auth.getUser();
      if (authError || !authData.user) {
        res.status(401).json({ error: "جلسة الدخول غير صالحة." });
        return;
      }

      const bookingId = String(req.body?.booking_id || "");
      const requestedProvider = String(req.body?.provider || "") as MeetingProvider;

      if (!bookingId || !["zoom", "google_meet"].includes(requestedProvider)) {
        res.status(400).json({ error: "رقم الحجز ومزود الاجتماع مطلوبان." });
        return;
      }

      const { data: booking, error: bookingError } = await userClient
        .from("bookings")
        .select(
          "id,student_id,teacher_id,subject,start_at,end_at,timezone,status,meeting_provider"
        )
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        res.status(404).json({ error: "الحجز غير موجود." });
        return;
      }

      const isParticipant =
        booking.student_id === authData.user.id ||
        booking.teacher_id === authData.user.id;

      if (!isParticipant) {
        res.status(403).json({ error: "ليس لديك صلاحية لهذا الحجز." });
        return;
      }

      if (booking.status !== "confirmed") {
        res.status(400).json({ error: "لا يمكن إنشاء اجتماع إلا للحجز المؤكد." });
        return;
      }

      if (
        booking.meeting_provider &&
        booking.meeting_provider !== requestedProvider
      ) {
        res.status(409).json({
          error: "تم تحديد مزود اجتماع مختلف لهذا الحجز.",
        });
        return;
      }

      const { data: existing } = await admin
        .from("live_sessions")
        .select(
          "id,booking_id,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at"
        )
        .eq("booking_id", booking.id)
        .maybeSingle();

      if (existing) {
        res.json({
          created: false,
          session: existing,
        });
        return;
      }

      const provider = getMeetingProvider(requestedProvider);

      if (!provider.isConfigured()) {
        res.status(503).json({
          error:
            requestedProvider === "zoom"
              ? "Zoom غير مهيأ بعد. مفاتيح Zoom يجب أن يضيفها مالك المنصة في Vercel."
              : "Google Meet غير مهيأ بعد. بيانات Google يجب أن يضيفها مالك المنصة في Vercel.",
        });
        return;
      }

      const meeting = await provider.createMeeting({
        provider: requestedProvider,
        topic: `Moallem - ${booking.subject || "Educational Lesson"}`,
        startAt: booking.start_at,
        endAt: booking.end_at,
        timezone: booking.timezone || "Africa/Cairo",
      });

      const { data: session, error: sessionError } = await admin
        .from("live_sessions")
        .insert({
          booking_id: booking.id,
          provider: meeting.provider,
          provider_meeting_id: meeting.providerMeetingId,
          join_url: meeting.joinUrl,
          host_url: meeting.hostUrl,
          status: "scheduled",
          scheduled_start_at: booking.start_at,
          scheduled_end_at: booking.end_at,
        })
        .select(
          "id,booking_id,provider,provider_meeting_id,join_url,host_url,status,scheduled_start_at,scheduled_end_at"
        )
        .single();

      if (sessionError || !session) {
        await provider.cancelMeeting(meeting.providerMeetingId).catch(() => undefined);
        console.error("Live session database error", sessionError);
        res.status(500).json({ error: "تعذر حفظ اجتماع الحصة." });
        return;
      }

      if (!booking.meeting_provider) {
        await admin
          .from("bookings")
          .update({ meeting_provider: requestedProvider })
          .eq("id", booking.id);
      }

      res.status(201).json({
        created: true,
        session: {
          ...session,
          host_url:
            booking.teacher_id === authData.user.id ? session.host_url : null,
        },
      });
    } catch (error) {
      console.error("Create live session error", error);
      res.status(500).json({ error: "تعذر إنشاء اجتماع الحصة." });
    }
  });
}
