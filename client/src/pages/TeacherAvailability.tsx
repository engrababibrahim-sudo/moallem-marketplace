import { useState } from "react";
import { CalendarDays, Clock3, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

type AvailabilityForm = {
  dayOfWeek: string;
  specificDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
};

const initialForm: AvailabilityForm = {
  dayOfWeek: "",
  specificDate: "",
  startTime: "16:00",
  endTime: "17:00",
  timezone: "Asia/Riyadh",
};

const days = [
  { value: "0", label: "الأحد" },
  { value: "1", label: "الإثنين" },
  { value: "2", label: "الثلاثاء" },
  { value: "3", label: "الأربعاء" },
  { value: "4", label: "الخميس" },
  { value: "5", label: "الجمعة" },
  { value: "6", label: "السبت" },
];

function dayLabel(dayOfWeek: number | null) {
  return days.find((day) => Number(day.value) === dayOfWeek)?.label ?? "—";
}

export default function TeacherAvailability() {
  const [form, setForm] = useState<AvailabilityForm>(initialForm);
  const [error, setError] = useState("");

  const availability = trpc.teacher.availability.list.useQuery();

  const createAvailability =
    trpc.teacher.availability.create.useMutation({
      onSuccess: async () => {
        setForm(initialForm);
        setError("");
        await availability.refetch();
      },
      onError: (err) => {
        setError(err.message);
      },
    });

  const deleteAvailability =
    trpc.teacher.availability.delete.useMutation({
      onSuccess: async () => {
        await availability.refetch();
      },
      onError: (err) => {
        setError(err.message);
      },
    });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const hasDay = form.dayOfWeek !== "";
    const hasDate = form.specificDate !== "";

    if (!hasDay && !hasDate) {
      setError("اختاري يومًا متكررًا أو تاريخًا محددًا.");
      return;
    }

    if (hasDay && hasDate) {
      setError("اختاري إما يومًا متكررًا أو تاريخًا محددًا، وليس الاثنين معًا.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setError("وقت البداية يجب أن يسبق وقت النهاية.");
      return;
    }

    await createAvailability.mutateAsync({
      dayOfWeek: hasDay ? Number(form.dayOfWeek) : null,
      specificDate: hasDate ? form.specificDate : null,
      startTime: form.startTime,
      endTime: form.endTime,
      timezone: form.timezone,
    });
  };

  const rows = availability.data ?? [];

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
              مواعيد التوافر
            </h1>
          </div>

          <div className="flex gap-2">
            <Link
              href="/teacher/bookings"
              className="rounded-full border border-[#182431]/10 px-4 py-2 text-sm font-bold"
            >
              حجوزات الطلاب
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
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-3xl bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0e2]">
                <Plus className="h-5 w-5 text-[#ff7a00]" />
              </div>

              <div>
                <h2 className="font-bold">إضافة وقت توافر</h2>
                <p className="mt-1 text-xs text-[#182431]/50">
                  حددي المواعيد التي يمكن للطلاب حجزها.
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold">
                  يوم متكرر
                </label>

                <select
                  value={form.dayOfWeek}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dayOfWeek: event.target.value,
                      specificDate: "",
                    }))
                  }
                  className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3 text-sm outline-none"
                >
                  <option value="">اختاري يومًا</option>

                  {days.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-xs font-bold text-[#182431]/40">
                أو
              </div>

              <div>
                <label className="text-sm font-bold">
                  تاريخ محدد
                </label>

                <input
                  type="date"
                  value={form.specificDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      specificDate: event.target.value,
                      dayOfWeek: "",
                    }))
                  }
                  className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold">
                    البداية
                  </label>

                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold">
                    النهاية
                  </label>

                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold">
                  المنطقة الزمنية
                </label>

                <select
                  value={form.timezone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3 text-sm outline-none"
                >
                  <option value="Asia/Riyadh">
                    السعودية — الرياض
                  </option>
                  <option value="Africa/Cairo">
                    مصر — القاهرة
                  </option>
                  <option value="UTC">
                    UTC
                  </option>
                </select>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={createAvailability.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a00] py-4 font-bold text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />

                {createAvailability.isPending
                  ? "جاري الحفظ..."
                  : "إضافة موعد"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  مواعيد التوافر الحالية
                </h2>

                <p className="mt-1 text-sm text-[#182431]/50">
                  هذه المواعيد هي التي سيتم الاعتماد عليها عند الحجز.
                </p>
              </div>

              <CalendarDays className="h-6 w-6 text-[#ff7a00]" />
            </div>

            {availability.isLoading && (
              <div className="mt-8 rounded-2xl bg-[#fbf8f4] p-8 text-center">
                جاري تحميل المواعيد...
              </div>
            )}

            {!availability.isLoading &&
              rows.length === 0 && (
                <div className="mt-8 rounded-2xl bg-[#fbf8f4] p-10 text-center">
                  <Clock3 className="mx-auto h-10 w-10 text-[#ff7a00]" />

                  <p className="mt-4 font-bold">
                    لا توجد مواعيد مضافة حتى الآن
                  </p>

                  <p className="mt-2 text-sm text-[#182431]/50">
                    أضيفي أول موعد ليتمكن الطلاب من الحجز.
                  </p>
                </div>
              )}

            <div className="mt-6 space-y-3">
              {rows.map((slot) => (
                <article
                  key={slot.id}
                  className="flex flex-col gap-4 rounded-2xl bg-[#fbf8f4] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-[#ff7a00]" />

                      <b>
                        {slot.specificDate
                          ? `تاريخ محدد: ${slot.specificDate}`
                          : `كل ${dayLabel(slot.dayOfWeek)}`}
                      </b>
                    </div>

                    <p className="mt-2 text-sm text-[#182431]/60">
                      {slot.startTime} — {slot.endTime}
                    </p>

                    <p className="mt-1 text-xs text-[#182431]/40">
                      المنطقة الزمنية: {slot.timezone}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={deleteAvailability.isPending}
                    onClick={() => {
                      setError("");
                      deleteAvailability.mutate({
                        id: slot.id,
                      });
                    }}
                    className="flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    تعطيل
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}