import { useEffect, useMemo, useState } from "react";
import { ArrowRight, GraduationCap, Search, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
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

const stages = ["ابتدائي", "إعدادي", "ثانوي", "جامعي"];
const subjects = ["رياضيات", "لغة عربية", "لغة إنجليزية", "فيزياء", "كيمياء", "علوم", "برمجة", "تكنولوجيا المعلومات", "علوم الحاسب"];

export default function Teachers() {
  const [location] = useLocation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [stage, setStage] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currency, setCurrency] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSubject(params.get("subject") || "");
    setStage(params.get("grade") || "");
    const price = params.get("price") || "";
    setMaxPrice(price);
    setQuery(params.get("q") || "");
    setCurrency(params.get("currency") || "");
    setCountry(params.get("country") || "");

    let active = true;
    supabase
      .from("public_teacher_directory")
      .select("id,display_name,country,bio,specialization,years_experience,subjects,education_stages,grades,teaching_format,hourly_rate,currency")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error(error);
          setTeachers([]);
        } else {
          setTeachers((data ?? []) as Teacher[]);
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [location]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const price = maxPrice ? Number(maxPrice) : null;
    return teachers.filter((teacher) => {
      const text = [
        teacher.display_name || "",
        teacher.bio || "",
        teacher.specialization || "",
        ...(teacher.subjects || []),
        ...(teacher.education_stages || []),
        ...(teacher.grades || []),
      ].join(" ").toLowerCase();

      const matchesQuery = !q || text.includes(q);
      const matchesSubject = !subject || teacher.subjects?.includes(subject);
      const matchesStage =
        !stage ||
        teacher.education_stages?.some((item) => item.includes(stage)) ||
        teacher.grades?.some((item) => item.includes(stage));
      const matchesPrice = price === null || teacher.hourly_rate === null || teacher.hourly_rate <= price;
      const matchesCurrency = !currency || teacher.currency === currency;
      const matchesCountry = !country || teacher.country === country;

      return matchesQuery && matchesSubject && matchesStage && matchesPrice && matchesCurrency && matchesCountry;
    });
  }, [teachers, query, subject, stage, maxPrice, currency, country]);

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <b>مُعلّم</b>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black/55">
            العودة للرئيسية <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
        <div className="rounded-[2rem] bg-[#182431] p-7 text-white lg:p-10">
          <div className="flex items-center gap-2 text-sm font-bold text-[#ffb36e]">
            <ShieldCheck className="h-5 w-5" /> المعلمون المعتمدون
          </div>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">اختر المعلم المناسب لك</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
            تظهر هنا الملفات التي اجتازت مراجعة الإدارة فقط.
          </p>
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-6">
          <label className="rounded-2xl bg-[#f7f3ee] px-4 py-3">
            <span className="block text-[10px] font-bold text-black/45">بحث</span>
            <div className="mt-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-black/35" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اسم أو مادة أو تخصص" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </label>
          <Select label="المادة" value={subject} onChange={setSubject} options={subjects} placeholder="كل المواد" />
          <Select label="المرحلة" value={stage} onChange={setStage} options={stages} placeholder="كل المراحل" />
          <Select label="السعر" value={maxPrice} onChange={setMaxPrice} options={["300", "500", "700"]} labels={["حتى ٣٠٠", "حتى ٥٠٠", "حتى ٧٠٠"]} placeholder="كل الأسعار" />
          <Select label="العملة" value={currency} onChange={setCurrency} options={["EGP","SAR","AED","KWD","QAR","BHD","OMR","USD","EUR","GBP","CAD","AUD","TRY","JOD","MAD","DZD","TND"]} placeholder="كل العملات" />
          <Select label="الدولة" value={country} onChange={setCountry} options={["مصر","السعودية","الإمارات","الكويت","قطر","البحرين","عُمان","الأردن","المغرب","الجزائر","تونس","الولايات المتحدة","المملكة المتحدة","كندا","أستراليا","تركيا"]} placeholder="كل الدول" />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-black/45">جارٍ تحميل المعلمين المعتمدين...</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
            <ShieldCheck className="mx-auto h-10 w-10 text-black/15" />
            <h2 className="mt-4 text-xl font-extrabold">لا توجد نتائج مطابقة</h2>
            <p className="mt-2 text-sm text-black/45">جرّبي تغيير المادة أو المرحلة أو السعر.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((teacher) => <TeacherCard key={teacher.id} teacher={teacher} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function Select({
  label, value, onChange, options, labels, placeholder,
}: {
  label: string; value: string; onChange: (value: string) => void;
  options: string[]; labels?: string[]; placeholder: string;
}) {
  return (
    <label className="rounded-2xl bg-[#f7f3ee] px-4 py-3">
      <span className="block text-[10px] font-bold text-black/45">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-semibold outline-none">
        <option value="">{placeholder}</option>
        {options.map((option, i) => <option key={option} value={option}>{labels?.[i] || option}</option>)}
      </select>
    </label>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const initials = (teacher.display_name || "معلم").split(/\s+/).map((x) => x[0]).slice(0, 2).join("");
  return (
    <article className="rounded-[1.5rem] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#fff0e2] font-extrabold text-[#c55d08]">{initials}</span>
        <div className="min-w-0">
          <h2 className="truncate font-extrabold">{teacher.display_name || "معلم معتمد"}</h2>
          <p className="mt-1 text-xs text-black/50">{teacher.subjects?.join(" · ") || "مواد تعليمية"}</p>{teacher.country && <p className="mt-1 text-xs text-black/40">{teacher.country}</p>}
          {teacher.specialization && <p className="mt-1 text-xs text-black/40">{teacher.specialization}</p>}
        </div>
        <span className="mr-auto rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">معتمد</span>
      </div>
      <p className="mt-5 min-h-12 text-sm leading-6 text-black/55">{teacher.bio || "معلم معتمد على منصة مُعلّم."}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <span className="rounded-xl bg-[#fbf8f4] p-3"><b>{teacher.years_experience}</b> سنوات خبرة</span>
        <span className="rounded-xl bg-[#fbf8f4] p-3"><b>{teacher.hourly_rate ?? "—"}</b> {teacher.currency} / ساعة</span>
      </div>
      <Link href={"/teachers/" + teacher.id} className="mt-4 block w-full rounded-full bg-[#182431] py-3 text-center text-sm font-bold text-white">
        عرض الملف
      </Link>
    </article>
  );
}
