import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, GraduationCap, ShieldCheck } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  country: string | null;
  display_name: string | null;
  bio: string | null;
  specialization: string | null;
  years_experience: number;
  subjects: string[];
  education_stages: string[];
  grades: string[];
  teaching_format: string | null;
  hourly_rate: number | null;
  currency: string;
};

export default function TeacherDetail() {
  const [, params] = useRoute("/teachers/:id");
  const [, navigate] = useLocation();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = params?.id;
    if (!id) {
      setError("لم يتم تحديد المعلم.");
      setLoading(false);
      return;
    }

    let active = true;
    supabase
      .from("public_teacher_directory")
      .select("id,display_name,country,bio,specialization,years_experience,subjects,education_stages,grades,teaching_format,hourly_rate,currency")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          console.error(queryError);
          setError("تعذر تحميل بيانات المعلم.");
        } else if (!data) {
          setError("المعلم غير موجود أو لم يعد معتمدًا.");
        } else {
          setTeacher(data as Teacher);
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [params?.id]);

  if (loading) {
    return <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]"><div className="mx-auto max-w-5xl px-5 py-16 text-center">جارٍ تحميل ملف المعلم...</div></main>;
  }

  if (error || !teacher) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <p className="text-lg font-bold">{error || "تعذر العثور على المعلم."}</p>
          <button onClick={() => navigate("/teachers")} className="mt-6 rounded-full bg-[#182431] px-6 py-3 text-sm font-bold text-white">العودة إلى المعلمين</button>
        </div>
      </main>
    );
  }

  const initials = (teacher.display_name || "معلم").split(/\s+/).map((x) => x[0]).slice(0, 2).join("");

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-10">
          <Link href="/teachers" className="inline-flex items-center gap-2 text-sm font-bold text-black/55"><ArrowRight className="h-4 w-4" /> العودة للمعلمين</Link>
          <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white"><GraduationCap className="h-5 w-5" /></span><b>مُعلّم</b></Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <div className="bg-[#182431] px-6 py-8 text-white lg:px-10 lg:py-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[1.75rem] bg-[#fff0e2] text-2xl font-extrabold text-[#c55d08]">{initials}</span>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffb36e]"><ShieldCheck className="h-5 w-5" /> معلم معتمد</div>
                <h1 className="mt-2 text-3xl font-extrabold">{teacher.display_name || "معلم معتمد"}</h1>
                <p className="mt-2 text-sm text-white/65">{teacher.country || "دولة غير محددة"}{teacher.specialization ? ` · ${teacher.specialization}` : ""}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-10">
            <div>
              <h2 className="text-lg font-extrabold">نبذة عن المعلم</h2>
              <p className="mt-3 leading-8 text-black/60">{teacher.bio || "لا توجد نبذة مضافة حاليًا."}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Info label="الخبرة" value={`${teacher.years_experience} سنوات`} />
                <Info label="طريقة التدريس" value={teacher.teaching_format || "غير محددة"} />
                <Info label="المواد" value={teacher.subjects?.join(" · ") || "غير محددة"} />
                <Info label="المراحل" value={teacher.education_stages?.join(" · ") || "غير محددة"} />
                <Info label="الصفوف" value={teacher.grades?.join(" · ") || "غير محددة"} />
              </div>
            </div>

            <aside className="rounded-3xl bg-[#fbf8f4] p-5">
              <p className="text-sm font-bold text-black/45">السعر بالساعة</p>
              <p className="mt-2 text-3xl font-extrabold">{teacher.hourly_rate ?? "—"} <span className="text-base">{teacher.currency}</span></p>
              <button type="button" onClick={() => navigate(`/book/${teacher.id}`)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a00] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#e86e00]">
                <CalendarDays className="h-4 w-4" /> اختيار موعد وحجز
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-black/45">سننتقل في الخطوة التالية لاختيار الموعد وإنشاء الحجز.</p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#fbf8f4] p-4"><p className="text-xs font-bold text-black/40">{label}</p><p className="mt-1 text-sm font-semibold leading-6">{value}</p></div>;
}
