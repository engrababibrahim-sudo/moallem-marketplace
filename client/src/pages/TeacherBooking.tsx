import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, GraduationCap } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Teacher = {
  id: string;
  display_name: string | null;
  hourly_rate: number | null;
  currency: string;
  subjects: string[];
};
type Availability = {
  id: string;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
};
type Slot = Availability & { date: string; start: string; end: string };

function localDateKey(date: Date) {
  // Keep the calendar date in the browser's local timezone.
  // toISOString() converts to UTC and can shift the date in UTC+/- timezones.
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatSlotDate(date: string) {
  // Parse a date-only value as local noon to avoid UTC date rollover.
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export default function TeacherBooking() {
  const [, params] = useRoute("/book/:id");
  const [, navigate] = useLocation();
  const { profile } = useAuth();
  const teacherId = params?.id || "";

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [selected, setSelected] = useState<Slot | null>(null);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!teacherId) {
      setMessage("لم يتم تحديد المعلم.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setMessage("");
    setAvailabilityError("");

    Promise.all([
      supabase
        .from("public_teacher_directory")
        .select("id,display_name,hourly_rate,currency,subjects")
        .eq("id", teacherId)
        .maybeSingle(),
      supabase
        .from("teacher_availability")
        .select("id,day_of_week,specific_date,start_time,end_time,timezone")
        .eq("teacher_id", teacherId)
        .eq("status", "active")
        .order("specific_date", { ascending: true }),
    ])
      .then(([teacherResult, availabilityResult]) => {
        if (!active) return;

        if (teacherResult.error || !teacherResult.data) {
          console.error("Failed to load teacher for booking", teacherResult.error);
          setMessage(
            teacherResult.error
              ? "تعذر تحميل بيانات المعلم. يرجى تحديث الصفحة والمحاولة مرة أخرى."
              : "المعلم غير موجود أو لم يعد متاحًا للحجز.",
          );
        } else {
          setTeacher(teacherResult.data as Teacher);
        }

        if (availabilityResult.error) {
          console.error("Failed to load teacher availability", availabilityResult.error);
          setAvailabilityError(
            "تعذر تحميل المواعيد من الخادم. لم يتم التأكد من أن المعلم لا يملك مواعيد؛ يرجى المحاولة مرة أخرى لاحقًا.",
          );
        } else {
          setAvailability((availabilityResult.data ?? []) as Availability[]);
          setAvailabilityError("");
        }
      })
      .catch((error: unknown) => {
        console.error("Unexpected booking page load error", error);
        if (active) {
          setMessage("حدث خطأ غير متوقع أثناء تحميل بيانات الحجز. يرجى تحديث الصفحة.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [teacherId]);

  const slots = useMemo(() => {
    const out: Slot[] = [];
    const today = new Date();

    for (let offset = 0; offset < 21; offset++) {
      const dateValue = new Date(today);
      dateValue.setHours(12, 0, 0, 0);
      dateValue.setDate(today.getDate() + offset);
      const date = localDateKey(dateValue);
      const day = dateValue.getDay();

      availability
        .filter(
          (item) =>
            item.specific_date === date ||
            (!item.specific_date && item.day_of_week === day),
        )
        .forEach((item) => {
          let currentMinutes =
            Number(item.start_time.slice(0, 2)) * 60 +
            Number(item.start_time.slice(3, 5));
          const endMinutes =
            Number(item.end_time.slice(0, 2)) * 60 +
            Number(item.end_time.slice(3, 5));

          while (currentMinutes + 60 <= endMinutes) {
            const nextMinutes = currentMinutes + 60;
            out.push({
              ...item,
              date,
              start:
                String(Math.floor(currentMinutes / 60)).padStart(2, "0") +
                ":" +
                String(currentMinutes % 60).padStart(2, "0"),
              end:
                String(Math.floor(nextMinutes / 60)).padStart(2, "0") +
                ":" +
                String(nextMinutes % 60).padStart(2, "0"),
            });
            currentMinutes = nextMinutes;
          }
        });
    }

    // Some teachers have overlapping or duplicated availability rows.
    // Collapse identical date/time slots so students only see each option once.
    const unique = new Map<string, Slot>();
    for (const slot of out) {
      const key = `${slot.date}|${slot.start}|${slot.end}`;
      if (!unique.has(key)) unique.set(key, slot);
    }

    // Hide slots that have already started, including today's earlier slots.
    const now = new Date();
    return [...unique.values()].filter((slot) => {
      const [year, month, day] = slot.date.split("-").map(Number);
      const [hour, minute] = slot.start.split(":").map(Number);
      const slotStart = new Date(year, month - 1, day, hour, minute, 0);
      return slotStart > now;
    });
  }, [availability]);

  async function createBooking() {
    if (!profile) {
      navigate("/auth");
      return;
    }
    if (profile.role !== "student" || profile.account_status !== "active") {
      setMessage("الحجز متاح للطالب النشط فقط.");
      return;
    }
    if (!teacher || !selected) {
      setMessage("اختاري موعدًا أولًا.");
      return;
    }

    setBusy(true);
    setMessage("");

    // Construct local wall-clock times rather than parsing a date-only string
    // as UTC. The selected timezone is still saved for downstream processing.
    const [year, month, day] = selected.date.split("-").map(Number);
    const [startHour, startMinute] = selected.start.split(":").map(Number);
    const [endHour, endMinute] = selected.end.split(":").map(Number);
    const start = new Date(year, month - 1, day, startHour, startMinute, 0);
    const end = new Date(year, month - 1, day, endHour, endMinute, 0);

    const { error } = await supabase.from("bookings").insert({
      student_id: profile.id,
      teacher_id: teacher.id,
      subject: subject || teacher.subjects?.[0] || null,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      timezone: selected.timezone || "Africa/Cairo",
      hourly_rate_snapshot: teacher.hourly_rate,
      total_price: Number(teacher.hourly_rate ?? 0),
      currency: teacher.currency,
      status: "pending",
      payment_status: "unpaid",
      notes: notes.trim() || null,
    });

    setBusy(false);
    if (error) {
      console.error("Failed to create booking", error);
      setMessage(
        error.code === "23P01"
          ? "هذا الموعد تم حجزه بالفعل. اختاري موعدًا آخر."
          : error.message || "تعذر إنشاء الحجز. يرجى المحاولة مرة أخرى.",
      );
    } else {
      setMessage("تم إرسال طلب الحجز بنجاح. الحالة: في انتظار التأكيد.");
      setSelected(null);
    }
  }

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          جارٍ تحميل مواعيد المعلم...
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-10">
          <Link href={"/teachers/" + teacherId} className="inline-flex items-center gap-2 text-sm font-bold text-black/55">
            <ArrowRight className="h-4 w-4" /> العودة لملف المعلم
          </Link>
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <b>مُعلّم</b>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm lg:p-8">
            <p className="text-sm font-bold text-[#c55d08]">حجز درس</p>
            <h1 className="mt-2 text-3xl font-extrabold">{teacher?.display_name || "المعلم"}</h1>
            <p className="mt-2 text-sm text-black/50">{teacher?.subjects?.join(" · ") || "مواد تعليمية"}</p>

            <div className="mt-8 flex items-center gap-2 text-sm font-bold">
              <CalendarDays className="h-5 w-5 text-[#ff7a00]" /> المواعيد المتاحة خلال 21 يومًا
            </div>

            {availabilityError ? (
              <div role="alert" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
                {availabilityError}
              </div>
            ) : slots.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-[#fbf8f4] p-6 text-sm leading-7 text-black/55">
                لا توجد مواعيد قابلة للحجز خلال الـ21 يومًا القادمة. قد يكون المعلم لم يضف مواعيد لهذه الفترة، أو أن مواعيده الحالية انتهت. يرجى المحاولة لاحقًا.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {slots.map((slot) => {
                  const active =
                    selected?.id === slot.id &&
                    selected.date === slot.date &&
                    selected.start === slot.start;
                  return (
                    <button
                      type="button"
                      key={slot.id + slot.date + slot.start}
                      onClick={() => setSelected(slot)}
                      className={"rounded-2xl border p-4 text-right " + (active ? "border-[#ff7a00] bg-[#fff0e2]" : "border-black/5 bg-[#fbf8f4] hover:border-[#ff7a00]/40")}
                    >
                      <b className="block">
                        {new Intl.DateTimeFormat("ar-EG", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        }).format(formatSlotDate(slot.date))}
                      </b>
                      <span className="mt-2 inline-flex items-center gap-2 text-sm text-black/55">
                        <Clock3 className="h-4 w-4" /> {slot.start} - {slot.end}
                      </span>
                      <span className="mt-2 block text-[11px] text-black/35">{slot.timezone}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selected && !availabilityError && (
              <div className="mt-7 rounded-3xl bg-[#fff0e2] p-5">
                <div className="flex items-center gap-2 font-extrabold">
                  <CheckCircle2 className="h-5 w-5 text-[#e96e00]" /> الموعد المختار
                </div>
                <p className="mt-2 text-sm">{selected.date} · {selected.start} - {selected.end}</p>
                <label className="mt-5 block">
                  <span className="text-xs font-bold text-black/50">المادة</span>
                  <select value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full rounded-xl bg-white p-3 text-sm outline-none">
                    <option value="">اختيار المادة</option>
                    {(teacher?.subjects || []).map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="mt-4 block">
                  <span className="text-xs font-bold text-black/50">ملاحظة للمعلم</span>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl bg-white p-3 text-sm outline-none" placeholder="مثال: أحتاج مراجعة درس..." />
                </label>
                <button type="button" disabled={busy} onClick={createBooking} className="mt-5 w-full rounded-full bg-[#ff7a00] py-3.5 text-sm font-extrabold text-white disabled:opacity-50">
                  {busy ? "جارٍ إنشاء الحجز..." : "تأكيد طلب الحجز"}
                </button>
              </div>
            )}

            {message && <p role="status" className="mt-5 rounded-2xl bg-[#fbf8f4] p-4 text-sm leading-6">{message}</p>}
          </section>

          <aside className="rounded-[2rem] bg-[#182431] p-6 text-white">
            <p className="text-sm text-white/55">السعر بالساعة</p>
            <p className="mt-2 text-3xl font-extrabold">{teacher?.hourly_rate ?? "—"} <span className="text-base">{teacher?.currency}</span></p>
            <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm leading-7 text-white/65">
              سيتم إنشاء الطلب بحالة <b className="text-white">pending</b> ودون خصم مالي في هذه المرحلة.
            </div>
            <Link href={"/teachers/" + teacherId} className="mt-5 block rounded-full border border-white/15 py-3 text-center text-sm font-bold">
              مراجعة الملف
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
