import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  UserRound,
  XCircle,
  BookOpen,
  Wallet,
  CreditCard,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
  }).format(new Date(value));
}

function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "في انتظار التأكيد",
    confirmed: "مؤكد",
    cancelled: "ملغي",
    completed: "مكتمل",
    rejected: "مرفوض",
  };

  return labels[status] ?? status;
}

function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    unpaid: "غير مدفوع",
    pending: "في انتظار الدفع",
    paid: "مدفوع",
    failed: "فشل الدفع",
    refunded: "مُسترد",
  };

  return labels[status] ?? status;
}

function formatDuration(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours} ${hours === 1 ? "ساعة" : "ساعات"}`;
  }

  return `${hours} س و ${remaining} د`;
}

function formatPrice(
  value: number | null | undefined,
  currency?: string | null,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Number(value).toLocaleString("ar-EG")} ${
    currency ?? "EGP"
  }`;
}

export default function TeacherBookings() {
  const bookings = trpc.teacher.booking.list.useQuery();

  const updateStatus =
    trpc.teacher.booking.updateStatus.useMutation({
      onSuccess: () => {
        bookings.refetch();
      },
    });

  const handleStatus = async (
    id: number,
    status:
      | "confirmed"
      | "rejected"
      | "completed"
      | "cancelled",
  ) => {
    let reason: string | null = null;

    if (
      status === "rejected" ||
      status === "cancelled"
    ) {
      const enteredReason = window.prompt(
        status === "rejected"
          ? "سبب رفض الحجز (اختياري):"
          : "سبب إلغاء الحجز (اختياري):",
      );

      if (enteredReason === null) {
        return;
      }

      reason = enteredReason.trim() || null;
    }

    await updateStatus.mutateAsync({
      id,
      status,
      reason,
    });
  };

  const rows = bookings.data ?? [];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#fbf8f4] text-[#182431]"
    >
      <header className="border-b border-[#182431]/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-sm font-bold text-[#ff7a00]">
              مُعلّم
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              حجوزات الطلاب
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/teacher/availability"
              className="rounded-full border border-[#182431]/10 px-4 py-2 text-sm font-bold"
            >
              مواعيد التوافر
            </Link>

            <Link
              href="/teacher/dashboard"
              className="rounded-full bg-[#182431] px-4 py-2 text-sm font-bold text-white"
            >
              لوحة المعلم
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {bookings.isLoading && (
          <div className="rounded-3xl bg-white p-10 text-center">
            جاري تحميل الحجوزات...
          </div>
        )}

        {bookings.isError && (
          <div className="rounded-3xl bg-white p-10 text-center">
            <p className="font-bold text-red-600">
              تعذر تحميل الحجوزات
            </p>

            <button
              type="button"
              onClick={() => bookings.refetch()}
              className="mt-5 rounded-full bg-[#ff7a00] px-5 py-3 font-bold text-white"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!bookings.isLoading &&
          !bookings.isError &&
          rows.length === 0 && (
            <div className="rounded-3xl bg-white p-12 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-[#ff7a00]" />

              <h2 className="mt-5 text-xl font-bold">
                لا توجد حجوزات حتى الآن
              </h2>

              <p className="mt-2 text-sm text-[#182431]/55">
                ستظهر حجوزات الطلاب هنا بعد بدء الحجز.
              </p>
            </div>
          )}

        {!bookings.isLoading &&
          !bookings.isError &&
          rows.length > 0 && (
            <div className="space-y-4">
              {rows.map(({ booking, student }) => {
                const pending =
                  booking.status === "pending";

                const confirmed =
                  booking.status === "confirmed";

                const cancelled =
                  booking.status === "cancelled" ||
                  booking.status === "rejected";

                return (
                  <article
                    key={booking.id}
                    className="rounded-3xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <UserRound className="h-5 w-5 text-[#ff7a00]" />

                          <h2 className="text-xl font-bold">
                            {student.name ?? "طالب"}
                          </h2>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm text-[#182431]/65">
                            <CalendarDays className="h-4 w-4 shrink-0" />

                            <span>
                              {formatDate(
                                booking.startAt,
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-[#182431]/65">
                            <Clock3 className="h-4 w-4 shrink-0" />

                            <span>
                              {formatTime(
                                booking.startAt,
                              )}{" "}
                              —{" "}
                              {formatTime(
                                booking.endAt,
                              )}
                            </span>
                          </div>

                          {booking.subject && (
                            <div className="flex items-center gap-2 text-sm text-[#182431]/65">
                              <BookOpen className="h-4 w-4 shrink-0 text-[#ff7a00]" />

                              <span>
                                المادة:{" "}
                                <b className="text-[#182431]">
                                  {booking.subject}
                                </b>
                              </span>
                            </div>
                          )}

                          {booking.durationMinutes && (
                            <div className="flex items-center gap-2 text-sm text-[#182431]/65">
                              <Clock3 className="h-4 w-4 shrink-0 text-[#ff7a00]" />

                              <span>
                                المدة:{" "}
                                <b className="text-[#182431]">
                                  {formatDuration(
                                    booking.durationMinutes,
                                  )}
                                </b>
                              </span>
                            </div>
                          )}

                          {booking.timezone && (
                            <div className="text-xs text-[#182431]/40 sm:col-span-2">
                              المنطقة الزمنية:{" "}
                              {booking.timezone}
                            </div>
                          )}
                        </div>

                        {booking.notes && (
                          <div className="mt-4 rounded-2xl bg-[#fbf8f4] p-4 text-sm leading-6">
                            <span className="mb-1 block text-xs font-bold text-[#182431]/45">
                              ملاحظات الحجز
                            </span>

                            {booking.notes}
                          </div>
                        )}

                        {cancelled &&
                          booking.cancellationReason && (
                            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700">
                              <span className="mb-1 block text-xs font-bold">
                                سبب الإلغاء / الرفض
                              </span>

                              {booking.cancellationReason}
                            </div>
                          )}

                        {booking.completedAt && (
                          <div className="mt-4 rounded-2xl bg-[#eaf0ff] p-4 text-sm text-[#3156a3]">
                            تم إكمال الدرس بتاريخ{" "}
                            {formatDate(
                              booking.completedAt,
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex w-full flex-col items-start gap-4 lg:w-auto lg:min-w-[220px] lg:items-end">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-bold ${
                              booking.status ===
                              "confirmed"
                                ? "bg-[#fff0e2] text-[#ff7a00]"
                                : booking.status ===
                                  "pending"
                                  ? "bg-[#fff4df] text-[#8a5a00]"
                                  : booking.status ===
                                    "completed"
                                    ? "bg-[#eaf0ff] text-[#3156a3]"
                                    : "bg-[#f4e7e7] text-[#a33]"
                            }`}
                          >
                            {statusLabel(
                              booking.status,
                            )}
                          </span>

                          {booking.paymentStatus && (
                            <span
                              className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold ${
                                booking.paymentStatus ===
                                "paid"
                                  ? "bg-[#eaf7ed] text-[#26733b]"
                                  : booking.paymentStatus ===
                                      "refunded"
                                    ? "bg-[#eeeaf8] text-[#684aa3]"
                                    : booking.paymentStatus ===
                                        "failed"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-[#f5f5f5] text-[#666]"
                              }`}
                            >
                              <CreditCard className="h-3.5 w-3.5" />

                              {paymentStatusLabel(
                                booking.paymentStatus,
                              )}
                            </span>
                          )}
                        </div>

                        {booking.totalPrice !==
                          null &&
                          booking.totalPrice !==
                            undefined && (
                            <div className="rounded-2xl bg-[#fff0e2] px-5 py-4 text-center">
                              <Wallet className="mx-auto h-5 w-5 text-[#ff7a00]" />

                              <span className="mt-1 block text-xs text-[#182431]/45">
                                قيمة الحجز
                              </span>

                              <b className="mt-1 block text-lg text-[#ff7a00]">
                                {formatPrice(
                                  booking.totalPrice,
                                  booking.currency,
                                )}
                              </b>
                            </div>
                          )}

                        {pending && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                updateStatus.isPending
                              }
                              onClick={() =>
                                handleStatus(
                                  booking.id,
                                  "confirmed",
                                )
                              }
                              className="flex items-center gap-2 rounded-full bg-[#ff7a00] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />

                              قبول
                            </button>

                            <button
                              type="button"
                              disabled={
                                updateStatus.isPending
                              }
                              onClick={() =>
                                handleStatus(
                                  booking.id,
                                  "rejected",
                                )
                              }
                              className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />

                              رفض
                            </button>
                          </div>
                        )}

                        {confirmed && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                updateStatus.isPending
                              }
                              onClick={() =>
                                handleStatus(
                                  booking.id,
                                  "completed",
                                )
                              }
                              className="flex items-center gap-2 rounded-full bg-[#182431] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />

                              تحديد كمكتمل
                            </button>

                            <button
                              type="button"
                              disabled={
                                updateStatus.isPending
                              }
                              onClick={() =>
                                handleStatus(
                                  booking.id,
                                  "cancelled",
                                )
                              }
                              className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />

                              إلغاء
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </main>
    </div>
  );
}
