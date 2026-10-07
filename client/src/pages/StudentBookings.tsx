import { useMemo } from "react";
import {
  CalendarDays,
  Clock3,
  UserRound,
  XCircle,
  BookOpen,
  Wallet,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function formatDate(value: string | Date) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPrice(
  value: number | null | undefined,
  currency: string | null | undefined,
) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: currency || "EGP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "في انتظار تأكيد المعلم",
    confirmed: "مؤكد",
    cancelled: "ملغي",
    completed: "مكتمل",
    rejected: "مرفوض",
  };

  return labels[status] ?? status;
}

function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    unpaid: "في انتظار الدفع",
    pending: "جاري الدفع",
    paid: "تم الدفع",
    failed: "فشل الدفع",
    refunded: "تم رد المبلغ",
  };

  return labels[status] ?? status;
}

function paymentStatusClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-[#e8f7ed] text-[#237a3b]";

    case "pending":
      return "bg-[#fff4df] text-[#8a5a00]";

    case "refunded":
      return "bg-[#eef1f5] text-[#536273]";

    case "failed":
      return "bg-[#fce8e8] text-[#a33]";

    default:
      return "bg-[#fff4df] text-[#8a5a00]";
  }
}

function bookingStatusClass(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-[#fff0e2] text-[#ff7a00]";

    case "pending":
      return "bg-[#fff4df] text-[#8a5a00]";

    case "completed":
      return "bg-[#eaf0ff] text-[#3156a3]";

    default:
      return "bg-[#f4e7e7] text-[#a33]";
  }
}

export default function StudentBookings() {
  const bookings = trpc.student.booking.list.useQuery();

  const cancelBooking = trpc.student.booking.cancel.useMutation({
    onSuccess: () => {
      bookings.refetch();
    },
  });

  const rows = useMemo(
    () => bookings.data ?? [],
    [bookings.data],
  );

  const handleCancel = async (id: number) => {
    const confirmed = window.confirm(
      "هل أنتِ متأكدة من إلغاء هذا الحجز؟",
    );

    if (!confirmed) {
      return;
    }

    const reason = window.prompt(
      "يمكنك كتابة سبب الإلغاء (اختياري):",
    );

    await cancelBooking.mutateAsync({
      id,
      reason: reason?.trim() || null,
    });
  };

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
              حجوزاتي
            </h1>
          </div>

          <Link
            href="/teachers"
            className="rounded-full bg-[#182431] px-5 py-3 text-sm font-bold text-white"
          >
            البحث عن معلم
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {bookings.isLoading && (
          <div className="rounded-3xl bg-white p-10 text-center">
            <p className="font-semibold">
              جاري تحميل الحجوزات...
            </p>
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
                ابدئي باختيار المعلم المناسب واحجزي موعد الدرس.
              </p>

              <Link
                href="/teachers"
                className="mt-6 inline-flex rounded-full bg-[#ff7a00] px-6 py-3 font-bold text-white"
              >
                استعرض المعلمين
              </Link>
            </div>
          )}

        {!bookings.isLoading &&
          !bookings.isError &&
          rows.length > 0 && (
            <div className="space-y-4">
              {rows.map(({ booking, teacher }) => {
                const canCancel =
                  booking.status === "pending" ||
                  booking.status === "confirmed";

                return (
                  <article
                    key={booking.id}
                    className="rounded-3xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        {/* Teacher */}
                        <div className="flex items-center gap-2">
                          <UserRound className="h-5 w-5 text-[#ff7a00]" />

                          <h2 className="text-xl font-bold">
                            {teacher.fullName}
                          </h2>
                        </div>

                        {/* Booking information */}
                        <div className="mt-5 grid gap-3 text-sm text-[#182431]/70 sm:grid-cols-2">
                          {/* Subject */}
                          {booking.subject && (
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 shrink-0 text-[#ff7a00]" />

                              <span>
                                المادة:{" "}
                                <strong className="text-[#182431]">
                                  {booking.subject}
                                </strong>
                              </span>
                            </div>
                          )}

                          {/* Date */}
                          <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a00]" />

                            <span>
                              {formatDate(
                                booking.startAt,
                              )}
                            </span>
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 shrink-0 text-[#ff7a00]" />

                            <span>
                              من{" "}
                              {formatTime(
                                booking.startAt,
                              )}{" "}
                              إلى{" "}
                              {formatTime(
                                booking.endAt,
                              )}
                            </span>
                          </div>

                          {/* Duration */}
                          {booking.durationMinutes && (
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 shrink-0 text-[#ff7a00]" />

                              <span>
                                مدة الدرس:{" "}
                                <strong className="text-[#182431]">
                                  {booking.durationMinutes} دقيقة
                                </strong>
                              </span>
                            </div>
                          )}

                          {/* Price */}
                          {booking.totalPrice !== null &&
                            booking.totalPrice !== undefined && (
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 shrink-0 text-[#ff7a00]" />

                                <span>
                                  السعر:{" "}
                                  <strong className="text-[#182431]">
                                    {formatPrice(
                                      booking.totalPrice,
                                      booking.currency,
                                    )}
                                  </strong>
                                </span>
                              </div>
                            )}
                        </div>

                        {/* Notes */}
                        {booking.notes && (
                          <div className="mt-4 rounded-2xl bg-[#fbf8f4] p-4 text-sm leading-6 text-[#182431]/70">
                            <span className="font-bold text-[#182431]">
                              ملاحظات:
                            </span>{" "}
                            {booking.notes}
                          </div>
                        )}

                        {/* Cancellation reason */}
                        {booking.status ===
                          "cancelled" &&
                          booking.cancellationReason && (
                            <div className="mt-4 rounded-2xl bg-[#fce8e8] p-4 text-sm leading-6 text-[#8f3030]">
                              <span className="font-bold">
                                سبب الإلغاء:
                              </span>{" "}
                              {booking.cancellationReason}
                            </div>
                          )}
                      </div>

                      {/* Status / Actions */}
                      <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                        {/* Booking status */}
                        <span
                          className={`rounded-full px-4 py-2 text-xs font-bold ${bookingStatusClass(
                            booking.status,
                          )}`}
                        >
                          {statusLabel(
                            booking.status,
                          )}
                        </span>

                        {/* Payment status */}
                        {booking.paymentStatus && (
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-bold ${paymentStatusClass(
                              booking.paymentStatus,
                            )}`}
                          >
                            {paymentStatusLabel(
                              booking.paymentStatus,
                            )}
                          </span>
                        )}

                        {/* Cancel */}
                        {canCancel && (
                          <button
                            type="button"
                            disabled={
                              cancelBooking.isPending
                            }
                            onClick={() =>
                              handleCancel(
                                booking.id,
                              )
                            }
                            className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />

                            {cancelBooking.isPending
                              ? "جاري الإلغاء..."
                              : "إلغاء الحجز"}
                          </button>
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
