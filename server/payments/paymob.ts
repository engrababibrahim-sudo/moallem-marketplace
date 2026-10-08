import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Express, Request, Response } from "express";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY;
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const PAYMOB_BASE_URL = (process.env.PAYMOB_BASE_URL || "https://accept.paymob.com").replace(/\/$/, "");

function getUserClient(req: Request) {
  const auth = req.header("authorization");
  if (!supabaseUrl || !supabasePublishableKey || !auth?.startsWith("Bearer ")) return null;

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

function requireConfig(res: Response) {
  if (!PAYMOB_SECRET_KEY || !PAYMOB_PUBLIC_KEY || !PAYMOB_INTEGRATION_ID) {
    res.status(503).json({
      error: "بوابة الدفع غير مهيأة بعد. أضف إعدادات Paymob في بيئة Vercel.",
    });
    return false;
  }
  return true;
}

function cents(value: number) {
  return Math.round(Number(value) * 100);
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyTransactionHmac(obj: any, received: string) {
  if (!PAYMOB_HMAC_SECRET || !received || !obj) return false;
  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan,
    obj.source_data?.sub_type,
    obj.source_data?.type,
    obj.success,
  ];
  const message = fields.map((v) => (v === null || v === undefined ? "" : String(v))).join("");
  const digest = crypto.createHmac("sha512", PAYMOB_HMAC_SECRET).update(message).digest("hex");
  return safeEqualHex(digest, String(received));
}

export function registerPaymobRoutes(app: Express) {
  app.post("/api/payments/paymob/create-intention", async (req, res) => {
    try {
      if (!requireConfig(res)) return;

      const userClient = getUserClient(req);
      if (!userClient) {
        res.status(401).json({ error: "يجب تسجيل الدخول أولًا." });
        return;
      }

      const { data: userData, error: userError } = await userClient.auth.getUser();
      if (userError || !userData.user) {
        res.status(401).json({ error: "جلسة الدخول غير صالحة." });
        return;
      }

      const bookingId = String(req.body?.booking_id || "");
      if (!bookingId) {
        res.status(400).json({ error: "رقم الحجز مطلوب." });
        return;
      }

      const { data: booking, error: bookingError } = await userClient
        .from("bookings")
        .select("id,student_id,teacher_id,subject,total_price,currency,status,payment_status")
        .eq("id", bookingId)
        .eq("student_id", userData.user.id)
        .maybeSingle();

      if (bookingError || !booking) {
        res.status(404).json({ error: "الحجز غير موجود أو لا تملكين صلاحية الدفع عنه." });
        return;
      }

      if (booking.status !== "confirmed") {
        res.status(400).json({ error: "لا يمكن الدفع إلا بعد تأكيد المعلم للحجز." });
        return;
      }

      if (!["unpaid", "failed"].includes(booking.payment_status)) {
        res.status(400).json({ error: "حالة الدفع الحالية لا تحتاج إلى بدء عملية دفع جديدة." });
        return;
      }

      const amount = Number(booking.total_price || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: "قيمة الحجز غير صالحة للدفع." });
        return;
      }

      const { data: profile, error: profileError } = await userClient
        .from("profiles")
        .select("email,full_name,country")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profileError) {
        res.status(400).json({ error: "تعذر تحميل بيانات الطالب." });
        return;
      }

      const fullName = String(profile?.full_name || userData.user.email?.split("@")[0] || "Student").trim();
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || "Student";
      const lastName = parts.slice(1).join(" ") || "User";
      const country = String(profile?.country || "EG").slice(0, 2).toUpperCase();

      const baseUrl =
        process.env.PUBLIC_APP_URL ||
        `${req.protocol}://${req.get("host")}`;

      const payload = {
        amount: cents(amount),
        currency: String(booking.currency || "EGP").toUpperCase(),
        payment_methods: [Number(PAYMOB_INTEGRATION_ID)],
        items: [
          {
            name: `حصة ${booking.subject || "تعليمية"}`.slice(0, 100),
            amount: cents(amount),
            description: `حجز رقم ${booking.id}`,
            quantity: 1,
          },
        ],
        billing_data: {
          apartment: "NA",
          first_name: firstName.slice(0, 50),
          last_name: lastName.slice(0, 50),
          street: "NA",
          building: "NA",
          phone_number: String(userData.user.phone || "NA"),
          city: "NA",
          country,
          email: userData.user.email || profile?.email || "NA",
          floor: "NA",
          state: "NA",
        },
        special_reference: booking.id,
        expiration: 3600,
        notification_url: `${baseUrl}/api/payments/paymob/webhook`,
        redirection_url: `${baseUrl}/payment/result?booking_id=${encodeURIComponent(booking.id)}`,
      };

      const response = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${PAYMOB_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.client_secret) {
        console.error("Paymob intention error", response.status, data);
        res.status(502).json({ error: "تعذر إنشاء عملية الدفع لدى Paymob." });
        return;
      }

      const checkoutUrl =
        `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${encodeURIComponent(PAYMOB_PUBLIC_KEY!)}&clientSecret=${encodeURIComponent(data.client_secret)}`;

      res.json({
        checkoutUrl,
        intentionId: data.id,
        orderId: data.intention_order_id,
      });
    } catch (error) {
      console.error("Paymob create intention error", error);
      res.status(500).json({ error: "حدث خطأ أثناء تجهيز الدفع." });
    }
  });

  app.post("/api/payments/paymob/webhook", async (req, res) => {
    try {
      if (!PAYMOB_HMAC_SECRET) {
        res.status(503).json({ error: "Paymob HMAC secret is not configured." });
        return;
      }

      const obj = req.body?.obj;
      const hmac = String(req.query?.hmac || "");
      if (!verifyTransactionHmac(obj, hmac)) {
        res.status(401).json({ error: "Invalid callback signature." });
        return;
      }

      const bookingId = String(obj?.order?.merchant_order_id || obj?.payment_key_claims?.extra?.booking_id || "");
      if (!bookingId) {
        res.status(400).json({ error: "Booking reference missing." });
        return;
      }

      const admin = getAdminClient();
      if (!admin) {
        res.status(503).json({ error: "Server database configuration is incomplete." });
        return;
      }

      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .select("id,total_price,currency,payment_status")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        res.status(404).json({ error: "Booking not found." });
        return;
      }

      const callbackAmount = Number(obj?.amount_cents || 0);
      const expectedAmount = cents(Number(booking.total_price || 0));
      const callbackCurrency = String(obj?.currency || "").toUpperCase();
      if (callbackAmount !== expectedAmount || callbackCurrency !== String(booking.currency || "").toUpperCase()) {
        res.status(400).json({ error: "Payment amount or currency mismatch." });
        return;
      }

      const transactionId = String(obj?.id || "");
      const paid = obj?.success === true && obj?.pending === false && obj?.is_refunded !== true;
      const refunded = obj?.is_refunded === true || Number(obj?.refunded_amount_cents || 0) > 0;

      let paymentStatus: "paid" | "failed" | "refunded" | "pending" = "failed";
      if (refunded) paymentStatus = "refunded";
      else if (paid) paymentStatus = "paid";
      else if (obj?.pending === true) paymentStatus = "pending";

      const { error: updateBookingError } = await admin
        .from("bookings")
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (updateBookingError) {
        console.error("Paymob booking update error", updateBookingError);
        res.status(500).json({ error: "Failed to update booking." });
        return;
      }

      const { error: updatePaymentError } = await admin
        .from("payment_transactions")
        .update({
          provider: "paymob",
          provider_transaction_id: transactionId || null,
          paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
          refunded_at: paymentStatus === "refunded" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("booking_id", bookingId);

      if (updatePaymentError) {
        console.error("Paymob transaction update error", updatePaymentError);
        res.status(500).json({ error: "Failed to update payment transaction." });
        return;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Paymob webhook error", error);
      res.status(500).json({ error: "Webhook processing failed." });
    }
  });
}
