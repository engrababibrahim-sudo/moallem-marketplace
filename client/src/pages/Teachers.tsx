
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

const stages = ["روضة", "ابتدائي", "إعدادي", "ثانوي", "جامعي"];

const subjectsByStage: Record<string, string[]> = {
  روضة: ["لغة عربية", "لغة إنجليزية", "رياضيات", "علوم", "حاسب آلي"],
  ابتدائي: [
    "لغة عربية",
    "لغة إنجليزية",
    "رياضيات",
    "علوم",
    "دراسات اجتماعية",
    "حاسب آلي",
    "قرآن كريم",
    "تجويد",
  ],
  إعدادي: [
    "لغة عربية",
    "لغة إنجليزية",
    "رياضيات",
    "علوم",
    "دراسات اجتماعية",
    "حاسب آلي",
    "برمجة",
    "فقه",
    "أصول الدين",
    "قرآن كريم",
    "تجويد",
  ],
  ثانوي: [
    "لغة عربية",
    "لغة إنجليزية",
    "رياضيات",
    "فيزياء",
    "كيمياء",
    "أحياء",
    "جيولوجيا",
    "تاريخ",
    "جغرافيا",
    "فلسفة ومنطق",
    "علم نفس واجتماع",
    "فقه",
    "أصول الدين",
    "قرآن كريم",
    "تجويد",
  ],
  جامعي: [
    "رياضيات",
    "فيزياء",
    "كيمياء",
    "أحياء",
    "برمجة",
    "تكنولوجيا المعلومات",
    "علوم الحاسب",
    "لغة إنجليزية",
    "لغة عربية",
  ],
};

const allSubjects = [...new Set(Object.values(subjectsByStage).flat())];

const gradesByStage: Record<string, string[]> = {
  روضة: ["المستوى الأول روضة", "المستوى الثاني روضة", "المستوى الثالث روضة"],
  ابتدائي: [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي",
    "الصف الخامس الابتدائي",
    "الصف السادس الابتدائي",
  ],
  إعدادي: [
    "الصف الأول الإعدادي",
    "الصف الثاني الإعدادي",
    "الصف الثالث الإعدادي",
  ],
  ثانوي: [
    "الصف الأول الثانوي",
    "الصف الثاني الثانوي",
    "الصف الثالث الثانوي",
  ],
  جامعي: [
    "السنة الجامعية الأولى",
    "السنة الجامعية الثانية",
    "السنة الجامعية الثالثة",
    "السنة الجامعية الرابعة",
    "دراسات عليا",
  ],
};

const countries = [
  "مصر",
  "السعودية",
  "الإمارات",
  "الكويت",
  "قطر",
  "البحرين",
  "عُمان",
  "الأردن",
  "المغرب",
  "الجزائر",
  "تونس",
  "الولايات المتحدة",
  "المملكة المتحدة",
  "كندا",
  "أستراليا",
  "تركيا",
];

const currencies = [
  "EGP",
  "SAR",
  "AED",
  "KWD",
  "QAR",
  "BHD",
  "OMR",
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "TRY",
  "JOD",
  "MAD",
  "DZD",
  "TND",
];

function normalizeArabic(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[ـ\s_-]+/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي");
}

function normalizeSubject(value: string) {
  const normalized = normalizeArabic(value);

  const aliases: Record<string, string> = {
    english: "لغةانجليزية",
    englishlanguage: "لغةانجليزية",
    لغةانجليزية: "لغةانجليزية",
    اللغةالانجليزية: "لغةانجليزية",
    انجليزي: "لغةانجليزية",
    انجليزى: "لغةانجليزية",
    انجليزية: "لغةانجليزية",
    عربية: "لغةعربية",
    عربي: "لغةعربية",
    اللغةالعربية: "لغةعربية",
    math: "رياضيات",
    mathematics: "رياضيات",
    computer: "حاسبالي",
    computerscience: "علومالحاسب",
    quran: "قرانكريم",
    قرانكريم: "قرانكريم",
    tajweed: "تجويد",
    علوم: "علوم",
    دراسات: "دراساتاجتماعية",
    دراساتاجتماعية: "دراساتاجتماعية",
  };

  return aliases[normalized] || normalized;
}

function normalizeStage(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي");

  if (
    normalized.includes("روضة") ||
    normalized.includes("روضه") ||
    normalized.includes("kindergarten") ||
    normalized.includes("preschool")
  ) {
    return "روضة";
  }

  if (
    normalized.includes("ابتدائي") ||
    normalized.includes("primary") ||
    normalized.includes("elementary")
  ) {
    return "ابتدائي";
  }

  if (
    normalized.includes("اعدادي") ||
    normalized.includes("preparatory") ||
    normalized.includes("middle")
  ) {
    return "إعدادي";
  }

  if (
    normalized.includes("ثانوي") ||
    normalized.includes("secondary") ||
    normalized.includes("high school")
  ) {
    return "ثانوي";
  }

  if (
    normalized.includes("جامعي") ||
    normalized.includes("university") ||
    normalized.includes("college")
  ) {
    return "جامعي";
  }

  return normalized;
}

function normalizeFormat(value: string | null) {
  const normalized = (value || "").trim().toLowerCase();

  if (
    normalized.includes("فرد") ||
    normalized.includes("individual") ||
    normalized.includes("one-to-one")
  ) {
    return "individual";
  }

  if (normalized.includes("جماعي") || normalized.includes("group")) {
    return "group";
  }

  return normalized;
}

function parsePrice(value: string) {
  const arabicDigits = value.replace(/[٠-٩]/g, (digit) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
  );

  return Number(arabicDigits.replace(/[^0-9.]/g, ""));
}

export default function Teachers() {
  const [location] = useLocation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [stage, setStage] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [currency, setCurrency] = useState("");
  const [country, setCountry] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [format, setFormat] = useState("");

  const subjectOptions = stage
    ? subjectsByStage[stage] ?? allSubjects
    : allSubjects;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const requestedStage = params.get("grade") || params.get("stage") || "";
    const normalizedRequestedStage = normalizeStage(requestedStage);

    setStage(
      stages.find(
        (item) => normalizeStage(item) === normalizedRequestedStage
      ) || ""
    );

    setSubject(params.get("subject") || "");
    setClassGrade(params.get("classGrade") || "");
    setQuery(params.get("q") || "");
    setCurrency(params.get("currency") || "");
    setCountry(params.get("country") || "");
    setMaxPrice(params.get("maxPrice") || params.get("price") || "");
    setFormat(params.get("format") || "");

    let active = true;

    async function loadTeachers() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("public_teacher_directory")
        .select(
          "id,display_name,country,bio,specialization,years_experience,subjects,education_stages,grades,teaching_format,hourly_rate,currency"
        )
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Failed to load public teacher directory:", error);
        setTeachers([]);
        setLoadError(
          "تعذر تحميل قائمة المعلمين. يرجى المحاولة مرة أخرى."
        );
      } else {
        setTeachers((data ?? []) as unknown as Teacher[]);
      }

      setLoading(false);
    }

    void loadTeachers();

    return () => {
      active = false;
    };
  }, [location]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const teacherSubjects = teacher.subjects || [];
      const teacherStages = teacher.education_stages || [];
      const teacherGrades = teacher.grades || [];

      const searchableText = [
        teacher.display_name || "",
        teacher.bio || "",
        teacher.specialization || "",
        ...teacherSubjects,
        ...teacherStages,
        ...teacherGrades,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || searchableText.includes(q);

      const normalizedSelectedSubject = normalizeSubject(subject);

      const subjectCandidates = [
        ...teacherSubjects,
        teacher.specialization || "",
      ].filter(Boolean);

      const matchesSubject =
        !subject ||
        subjectCandidates.some((item) => {
          const normalizedItem = normalizeSubject(item);

          return (
            normalizedItem === normalizedSelectedSubject ||
            normalizedItem.includes(normalizedSelectedSubject) ||
            normalizedSelectedSubject.includes(normalizedItem)
          );
        });

      // عند اختيار مرحلة، لا نعرض مدرسًا لا توجد له بيانات مرحلة مطابقة.
      const normalizedSelectedStage = normalizeStage(stage);

      const matchesStage =
        !stage ||
        teacherStages.some(
          (item) => normalizeStage(item) === normalizedSelectedStage
        ) ||
        teacherGrades.some(
          (item) => normalizeStage(item) === normalizedSelectedStage
        );

      // عند اختيار صف محدد، يجب أن يتطابق مع أحد صفوف المدرس المسجلة.
      const normalizedSelectedGrade = normalizeArabic(classGrade);

      const matchesClassGrade =
        !classGrade ||
        teacherGrades.some((item) => {
          const normalizedTeacherGrade = normalizeArabic(item);

          return (
            normalizedTeacherGrade.includes(normalizedSelectedGrade) ||
            normalizedSelectedGrade.includes(normalizedTeacherGrade)
          );
        });

      const selectedFormat = normalizeFormat(format);
      const teacherFormat = normalizeFormat(teacher.teaching_format);

      const matchesFormat =
        !format || !teacherFormat || teacherFormat === selectedFormat;

      const priceLimit = parsePrice(maxPrice);

      const matchesPrice =
        !maxPrice ||
        !Number.isFinite(priceLimit) ||
        priceLimit <= 0 ||
        (teacher.hourly_rate !== null &&
          teacher.hourly_rate <= priceLimit);

      const matchesCurrency =
        !currency || teacher.currency === currency;

      const matchesCountry =
        !country || teacher.country === country;

      return (
        matchesQuery &&
        matchesSubject &&
        matchesStage &&
        matchesClassGrade &&
        matchesFormat &&
        matchesPrice &&
        matchesCurrency &&
        matchesCountry
      );
    });
  }, [
    teachers,
    query,
    subject,
    stage,
    classGrade,
    currency,
    country,
    maxPrice,
    format,
  ]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fbf8f4] text-[#182431]"
    >
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <b>مُعلّم</b>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-black/55"
          >
            العودة للرئيسية
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
        <div className="rounded-[2rem] bg-[#182431] p-7 text-white lg:p-10">
          <div className="flex items-center gap-2 text-sm font-bold text-[#ffb36e]">
            <ShieldCheck className="h-5 w-5" />
            المعلمون المعتمدون
          </div>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            اختر المعلم المناسب لك
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
            تظهر هنا الملفات التي اجتازت مراجعة الإدارة فقط.
          </p>
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-4">
          <label className="rounded-2xl bg-[#f7f3ee] px-4 py-3">
            <span className="block text-[10px] font-bold text-black/45">
              بحث
            </span>

            <div className="mt-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-black/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="اسم أو مادة أو تخصص"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <Select
            label="المادة"
            value={subject}
            onChange={setSubject}
            options={subjectOptions}
            placeholder="كل المواد"
          />

          <Select
            label="المرحلة"
            value={stage}
            onChange={(value) => {
              setStage(value);
              setSubject("");
              setClassGrade("");
            }}
            options={stages}
            placeholder="كل المراحل"
          />

          <Select
            label="الصف"
            value={classGrade}
            onChange={setClassGrade}
            options={stage ? gradesByStage[stage] || [] : []}
            placeholder={stage ? "كل الصفوف" : "اختاري المرحلة أولًا"}
          />

          <Select
            label="نوع الدرس"
            value={format}
            onChange={setFormat}
            options={["فردي مباشر", "جماعي"]}
            placeholder="كل الأنواع"
          />

          <Select
            label="أقصى سعر للحصة"
            value={maxPrice}
            onChange={setMaxPrice}
            options={["300", "500", "700"]}
            labels={["حتى ٣٠٠", "حتى ٥٠٠", "حتى ٧٠٠"]}
            placeholder="كل الأسعار"
          />

          <Select
            label="العملة"
            value={currency}
            onChange={setCurrency}
            options={currencies}
            placeholder="كل العملات"
          />

          <Select
            label="الدولة"
            value={country}
            onChange={setCountry}
            options={countries}
            placeholder="كل الدول"
          />
        </div>

        {loadError ? (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="font-bold text-red-700">{loadError}</p>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-sm text-black/45">
            جارٍ تحميل المعلمين المعتمدين...
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
            <ShieldCheck className="mx-auto h-10 w-10 text-black/15" />

            <h2 className="mt-4 text-xl font-extrabold">
              {subject
                ? `لا يوجد معلم مطابق لمادة ${subject}${
                    stage ? ` في مرحلة ${stage}` : ""
                  } حاليًا`
                : "لا توجد نتائج مطابقة"}
            </h2>

            <p className="mt-2 text-sm text-black/45">
              {subject
                ? "يمكنك إزالة بعض الفلاتر أو تجربة مرحلة أخرى."
                : "جرّبي تغيير المادة أو المرحلة أو الدولة."}
            </p>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSubject("");
                setStage("");
                setClassGrade("");
                setCurrency("");
                setCountry("");
                setMaxPrice("");
                setFormat("");
              }}
              className="mt-5 rounded-full bg-[#182431] px-6 py-3 text-sm font-bold text-white"
            >
              مسح الفلاتر
            </button>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-black/50">
              عدد المعلمين المطابقين: {filtered.length}
            </p>

            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: string[];
  placeholder: string;
}) {
  return (
    <label className="rounded-2xl bg-[#f7f3ee] px-4 py-3">
      <span className="block text-[10px] font-bold text-black/45">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
      >
        <option value="">{placeholder}</option>

        {options.map((option, index) => (
          <option key={option} value={option}>
            {labels?.[index] || option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const initials = (teacher.display_name || "معلم")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <article className="rounded-[1.5rem] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#fff0e2] font-extrabold text-[#c55d08]">
          {initials}
        </span>

        <div className="min-w-0">
          <h2 className="truncate font-extrabold">
            {teacher.display_name || "معلم معتمد"}
          </h2>

          <p className="mt-1 text-xs text-black/50">
            {teacher.subjects?.join(" · ") || "مواد تعليمية"}
          </p>

          {teacher.country && (
            <p className="mt-1 text-xs text-black/40">
              {teacher.country}
            </p>
          )}

          {teacher.specialization && (
            <p className="mt-1 text-xs text-black/40">
              {teacher.specialization}
            </p>
          )}
        </div>

        <span className="mr-auto rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
          معتمد
        </span>
      </div>

      <p className="mt-5 min-h-12 text-sm leading-6 text-black/55">
        {teacher.bio || "معلم معتمد على منصة مُعلّم."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <span className="rounded-xl bg-[#fbf8f4] p-3">
          <b>{teacher.years_experience ?? 0}</b> سنوات خبرة
        </span>

        <span className="rounded-xl bg-[#fbf8f4] p-3">
          <b>{teacher.hourly_rate ?? "—"}</b>{" "}
          {teacher.currency || ""} / ساعة
        </span>
      </div>

      <Link
        href={"/teachers/" + teacher.id}
        className="mt-4 block w-full rounded-full bg-[#182431] py-3 text-center text-sm font-bold text-white"
      >
        عرض الملف
      </Link>
    </article>
  );
}
