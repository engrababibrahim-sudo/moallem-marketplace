import { CalendarDays, CheckCircle2, Clock3, UserRound, XCircle } from "lucide-react";
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

export default function TeacherBookings() {
  const bookings = trpc.teacher.booking.list.useQuery();

  const updateStatus = trpc.teacher.booking.updateStatus.useMutation({
    onSuccess: () => {
      bookings.refetch();
    },
  });

  const handleStatus = async (
    id: number,
    status: "confirmed" | "rejected" | "completed" | "cancelled",
  ) => {
    await updateStatus.mutateAsync({
      id,
      status,
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
              نُخبة
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              حجوزات الطلاب
            </h1>
          </div>

          <div className="flex gap-2">
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
                const pending = booking.status === "pending";
                const confirmed = booking.status === "confirmed";

                return (
                  <article
                    key={booking.id}
                    className="rounded-3xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserRound className="h-5 w-5 text-[#ff7a00]" />

                          <h2 className="text-xl font-bold">
                            {student.name ?? "طالب"}
                          </h2>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-[#182431]/65">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              {formatDate(booking.startAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />
                            <span>
                              {formatTime(booking.startAt)} —{" "}
                              {formatTime(booking.endAt)}
                            </span>
                          </div>

                          {booking.timezone && (
                            <div className="text-xs text-[#182431]/40">
                              المنطقة الزمنية: {booking.timezone}
                            </div>
                          )}

                          {booking.notes && (
                            <div className="rounded-2xl bg-[#fbf8f4] p-3 leading-6">
                              {booking.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <span
                          className={`rounded-full px-4 py-2 text-xs font-bold ${
                            booking.status === "confirmed"
                              ? "bg-[#fff0e2] text-[#ff7a00]"
                              : booking.status === "pending"
                                ? "bg-[#fff4df] text-[#8a5a00]"
                                : booking.status === "completed"
                                  ? "bg-[#eaf0ff] text-[#3156a3]"
                                  : "bg-[#f4e7e7] text-[#a33]"
                          }`}
                        >
                          {statusLabel(booking.status)}
                        </span>

                        {pending && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={updateStatus.isPending}
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
                              disabled={updateStatus.isPending}
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
                              disabled={updateStatus.isPending}
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
                              disabled={updateStatus.isPending}
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