import { useMemo } from "react";
import { CalendarDays, Clock3, UserRound, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

function formatDate(value: string | Date) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
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

export default function StudentBookings() {
  const [, setLocation] = useLocation();

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

    if (!confirmed) return;

    await cancelBooking.mutateAsync({ id });
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
              نُخبة
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
            <p className="font-semibold">جاري تحميل الحجوزات...</p>
          </div>
        )}

        {bookings.isError && (
          <div className="rounded-3xl bg-white p-10 text-center">
            <p className="font-bold text-red-600">
              تعذر تحميل الحجوزات
            </p>

            <button
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
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserRound className="h-5 w-5 text-[#ff7a00]" />

                          <h2 className="text-xl font-bold">
                            {teacher.fullName}
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
                              إلى{" "}
                              {new Intl.DateTimeFormat("ar-EG", {
                                timeStyle: "short",
                              }).format(
                                new Date(booking.endAt),
                              )}
                            </span>
                          </div>

                          {booking.notes && (
                            <p className="rounded-2xl bg-[#fbf8f4] p-3 leading-6">
                              {booking.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 md:items-end">
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

                        {canCancel && (
                          <button
                            type="button"
                            disabled={cancelBooking.isPending}
                            onClick={() =>
                              handleCancel(booking.id)
                            }
                            className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
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