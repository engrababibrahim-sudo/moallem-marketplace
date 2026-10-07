import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Filter,
  Search,
  ShieldCheck,
  Star,
  X,
  BookOpen,
  Clock3,
  Wallet,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export const demoTeachers = [
  {
    id: "sara",
    name: "سارة محمود",
    country: "مصر",
    subject: "رياضيات",
    stage: "ثانوي",
    grade: "الثاني الثانوي",
    curriculum: "المنهج المصري",
    rating: 4.9,
    price: 320,
    experience: 8,
    availability: "المساء",
    color: "#dbe9e4",
    initials: "س",
    bio: "أساعد طلاب المرحلة الثانوية على فهم الرياضيات بثقة، من خلال أمثلة عملية وخطة مراجعة واضحة.",
    qualifications: "ماجستير تعليم الرياضيات",
    style: "تفاعلي قائم على حل المسائل",
    match: 94,
  },
  {
    id: "omar",
    name: "عمر عبدالسلام",
    country: "مصر",
    subject: "فيزياء",
    stage: "ثانوي",
    grade: "الثالث الثانوي",
    curriculum: "المنهج المصري",
    rating: 4.8,
    price: 280,
    experience: 6,
    availability: "بعد الظهر",
    color: "#e9e0d0",
    initials: "ع",
    bio: "فيزياء أبسط. أركز على بناء الفهم أولًا ثم تحويله إلى مهارة حل مسائل.",
    qualifications: "بكالوريوس فيزياء",
    style: "عملي ومبني على الأمثلة",
    match: 91,
  },
  {
    id: "noura",
    name: "نورهان علي",
    country: "مصر",
    subject: "لغة إنجليزية",
    stage: "إعدادي",
    grade: "الأول الإعدادي",
    curriculum: "المنهج المصري",
    rating: 4.9,
    price: 250,
    experience: 10,
    availability: "نهاية الأسبوع",
    color: "#e3dff0",
    initials: "ن",
    bio: "منهج تفاعلي يربط اللغة باهتمامات الطالب اليومية ويقيس تقدمه أسبوعيًا.",
    qualifications: "شهادة TESOL",
    style: "محادثة وتطبيق",
    match: 89,
  },
  {
    id: "khaled",
    name: "خالد حسن",
    country: "مصر",
    subject: "كيمياء",
    stage: "ثانوي",
    grade: "الثاني الثانوي",
    curriculum: "المنهج المصري",
    rating: 4.7,
    price: 270,
    experience: 5,
    availability: "المساء",
    color: "#dce8ee",
    initials: "خ",
    bio: "أبني خطة تعلم مرنة للطلاب الذين يريدون رفع مستواهم قبل الاختبارات.",
    qualifications: "بكالوريوس كيمياء",
    style: "منظم وموجه للاختبارات",
    match: 86,
  },
];

function currencyForCountry(country: string | null | undefined) {
  const normalized = (country ?? "مصر").trim().toLowerCase();

  if (
    normalized.includes("السعود") ||
    normalized.includes("saudi")
  ) {
    return "ر.س";
  }

  if (
    normalized.includes("الإمار") ||
    normalized.includes("uae")
  ) {
    return "د.إ";
  }

  if (
    normalized.includes("الكويت") ||
    normalized.includes("kuwait")
  ) {
    return "د.ك";
  }

  if (
    normalized.includes("قطر") ||
    normalized.includes("qatar")
  ) {
    return "ر.ق";
  }

  if (
    normalized.includes("الأردن") ||
    normalized.includes("jordan")
  ) {
    return "د.أ";
  }

  return "ج.م";
}

function countryKey(country: string | null | undefined) {
  const normalized = (country ?? "").trim().toLowerCase();

  if (
    normalized.includes("مصر") ||
    normalized.includes("egypt")
  ) {
    return "egypt";
  }

  if (
    normalized.includes("السعود") ||
    normalized.includes("saudi")
  ) {
    return "saudi";
  }

  if (
    normalized.includes("الإمار") ||
    normalized.includes("uae")
  ) {
    return "uae";
  }

  if (
    normalized.includes("الكويت") ||
    normalized.includes("kuwait")
  ) {
    return "kuwait";
  }

  if (
    normalized.includes("الأردن") ||
    normalized.includes("jordan")
  ) {
    return "jordan";
  }

  return normalized;
}

function Header() {
  return (
    <header className="border-b border-[#182431]/10 bg-[#fbf8f4]/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#182431] font-bold text-[#e8a64a]">
            م
          </span>

          <b className="text-xl">مُعلّم</b>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="hidden text-[#182431]/60 sm:block"
          >
            الرئيسية
          </Link>

          <Link
            href="/teachers"
            className="hidden font-bold text-[#182431]/60 sm:block"
          >
            المعلمون
          </Link>

          <Link
            href="/auth"
            className="rounded-full bg-[#182431] px-4 py-2 font-bold text-white"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Marketplace() {
  const [, params] = useRoute("/teachers/:id");
  const [, setLocation] = useLocation();

  const live = trpc.marketplace.teachers.useQuery();
  const { user } = useAuth();

  const favorites =
    trpc.student.favorites.list.useQuery(undefined, {
      enabled: user?.role === "student",
    });

  const utils = trpc.useUtils();

  const addFavorite =
    trpc.student.favorites.add.useMutation({
      onSuccess: () =>
        utils.student.favorites.list.invalidate(),
    });

  const removeFavorite =
    trpc.student.favorites.remove.useMutation({
      onSuccess: () =>
        utils.student.favorites.list.invalidate(),
    });

  const paramsFromSearch = new URLSearchParams(
    window.location.search,
  );

  const [query, setQuery] = useState("");

  const [subject, setSubject] = useState(
    paramsFromSearch.get("subject") ?? "كل المواد",
  );

  const [grade, setGrade] = useState(
    paramsFromSearch.get("grade") ?? "",
  );

  const [country, setCountry] = useState(
    paramsFromSearch.get("country") ?? "مصر",
  );

  const [availabilityFilter, setAvailabilityFilter] =
    useState(
      paramsFromSearch.get("availability") ?? "",
    );

  const [maxPrice, setMaxPrice] = useState(
    Number(paramsFromSearch.get("price")) || 1000,
  );

  const [sortBy, setSortBy] = useState("experience");

  const [bookingTeacher, setBookingTeacher] =
    useState<typeof demoTeachers[number] | null>(null);

  const teachers = (live.data ?? []).map((t) => ({
    id: String(t.id),
    name: t.name,
    country: t.country ?? "مصر",
    subject: t.subjects[0] ?? "تدريس عام",
    stage: t.educationStages[0] ?? "مراحل متعددة",
    grade: t.grades[0] ?? "صفوف متعددة",
    curriculum: "مُعلّم",
    rating: 0,
    price: t.hourlyRate ?? 0,
    experience: t.yearsOfExperience,
    availability:
      t.availability[0] ?? "حسب التوفر",
    color: "#dbe9e4",
    initials: t.name.slice(0, 1),
    bio:
      t.bio ??
      "ملف معلم معتمد في مُعلّم.",
    qualifications:
      t.qualification ?? "",
    style:
      t.teachingFormat ?? "",
    match: 100,
  }));

  const allTeachers =
    teachers.length > 0
      ? teachers
      : demoTeachers;

  const selected = params?.id
    ? allTeachers.find(
        (t) => t.id === params.id,
      )
    : null;

  const favoriteIds = new Set(
    (favorites.data ?? [])
      .filter(
        (item) =>
          item.favoriteType === "teacher",
      )
      .map((item) => item.targetId),
  );

  const toggleTeacherFavorite = (
    teacher: typeof demoTeachers[number],
  ) => {
    if (
      user?.role !== "student" ||
      !/^\d+$/.test(teacher.id)
    ) {
      return;
    }

    if (favoriteIds.has(teacher.id)) {
      removeFavorite.mutate({
        favoriteType: "teacher",
        targetId: teacher.id,
      });
    } else {
      addFavorite.mutate({
        favoriteType: "teacher",
        targetId: teacher.id,
        title: teacher.name,
      });
    }
  };

  const filtered = useMemo(
    () =>
      allTeachers.filter(
        (t) =>
          (!query ||
            `${t.name} ${t.subject}`
              .toLowerCase()
              .includes(
                query.toLowerCase(),
              )) &&
          (subject === "كل المواد" ||
            t.subject === subject) &&
          (!grade ||
            grade === "كل المراحل" ||
            t.stage.includes(grade) ||
            t.grade.includes(grade)) &&
          (!country ||
            countryKey(t.country) ===
              countryKey(country)) &&
          (!availabilityFilter ||
            t.availability.includes(
              availabilityFilter,
            )) &&
          t.price <= maxPrice,
      ),
    [
      allTeachers,
      query,
      subject,
      grade,
      country,
      availabilityFilter,
      maxPrice,
    ],
  );

  const sorted = useMemo(() => {
    const result = [...filtered];

    if (sortBy === "rating") {
      result.sort(
        (a, b) => b.rating - a.rating,
      );
    } else if (sortBy === "price") {
      result.sort(
        (a, b) => a.price - b.price,
      );
    } else {
      result.sort(
        (a, b) =>
          b.experience - a.experience,
      );
    }

    return result;
  }, [filtered, sortBy]);

  const startBooking = (
    teacher: typeof demoTeachers[number],
  ) => {
    setBookingTeacher(teacher);
  };

  if (selected) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#fbf8f4] text-[#182431]"
      >
        <Header />

        <main className="mx-auto max-w-5xl px-5 py-10 lg:px-10">
          <button
            type="button"
            onClick={() =>
              setLocation("/teachers")
            }
            className="mb-8 flex items-center gap-2 text-sm font-bold text-[#182431]/55"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للمعلمين
          </button>

          <div className="grid gap-7 lg:grid-cols-[1fr_1.4fr]">
            <aside className="rounded-[2rem] bg-[#182431] p-7 text-white">
              <div
                className="grid h-24 w-24 place-items-center rounded-3xl text-4xl font-bold text-[#ff7a00]"
                style={{
                  backgroundColor:
                    selected.color,
                }}
              >
                {selected.initials}
              </div>

              <h1 className="mt-6 text-3xl font-bold">
                {selected.name}
              </h1>

              <p className="mt-2 text-white/55">
                {selected.subject} ·{" "}
                {selected.stage}
              </p>

              <div className="mt-8 flex items-center gap-2">
                {selected.id.match(
                  /^\d+$/,
                ) &&
                selected.rating > 0 ? (
                  <Star className="h-5 w-5 fill-[#e8a64a] text-[#e8a64a]" />
                ) : (
                  <BadgeCheck className="h-5 w-5 text-[#e8a64a]" />
                )}

                <b>
                  {selected.id.match(
                    /^\d+$/,
                  )
                    ? selected.rating
                      ? selected.rating
                      : "لا توجد مراجعات بعد"
                    : "بيانات نموذجية"}
                </b>
              </div>

              <div className="mt-8 rounded-2xl bg-white/8 p-4 text-sm leading-7 text-white/65">
                <ShieldCheck className="mb-2 h-5 w-5 text-[#e8a64a]" />

                {selected.id.match(
                  /^\d+$/,
                )
                  ? "ملف معلم معتمد في السوق"
                  : "هذا ملف توضيحي — لا يمثل معلمًا حقيقيًا"}
              </div>
            </aside>

            <section className="rounded-[2rem] bg-white p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#ff7a00]">
                    ملف المعلم
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {selected.bio}
                  </h2>
                </div>

                <div className="rounded-2xl bg-[#fff0e2] px-4 py-3 text-center">
                  <b className="block text-xl text-[#ff7a00]">
                    {selected.price}{" "}
                    {currencyForCountry(
                      selected.country,
                    )}
                  </b>

                  <span className="text-xs text-[#182431]/50">
                    للساعة
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    selected &&
                    toggleTeacherFavorite(
                      selected,
                    )
                  }
                  disabled={
                    user?.role !== "student" ||
                    !selected ||
                    !/^\d+$/.test(
                      selected.id,
                    )
                  }
                  className={`rounded-full border px-4 py-3 text-xs font-bold ${
                    selected &&
                    favoriteIds.has(
                      selected.id,
                    )
                      ? "border-[#e8a64a] bg-[#fff3df] text-[#8a5b27]"
                      : "border-[#182431]/12"
                  }`}
                >
                  {selected &&
                  favoriteIds.has(
                    selected.id,
                  )
                    ? "إزالة من المفضلة"
                    : "حفظ في المفضلة"}
                </button>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Info
                  label="المؤهل"
                  value={
                    selected.qualifications
                  }
                />

                <Info
                  label="أسلوب التدريس"
                  value={selected.style}
                />

                <Info
                  label="الخبرة"
                  value={`${selected.experience} سنوات`}
                />

                <Info
                  label="المواد والصفوف"
                  value={`${selected.subject} · ${selected.grade}`}
                />
              </div>

              <h3 className="mt-9 text-lg font-bold">
                احجز موعدًا
              </h3>

              <button
                type="button"
                onClick={() =>
                  startBooking(selected)
                }
                className="mt-4 w-full rounded-full bg-[#ff7a00] py-4 font-bold text-white"
              >
                احجز درسًا
                <CalendarDays className="mr-2 inline h-4 w-4" />
              </button>
            </section>
          </div>
        </main>

        {bookingTeacher && (
          <BookingModal
            teacher={bookingTeacher}
            close={() =>
              setBookingTeacher(null)
            }
            navigate={setLocation}
          />
        )}
      </div>
    );
  }

  const subjects = Array.from(
    new Set(
      allTeachers.map(
        (t) => t.subject,
      ),
    ),
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#fbf8f4] text-[#182431]"
    >
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold text-[#ff7a00]">
              سوق مُعلّم
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              اختر معلمك
            </h1>

            <p className="mt-3 text-[#182431]/55">
              عروض توضيحية في هذه النسخة؛
              بيانات المعلمين والأسعار
              والملفات التجريبية ليست عروضًا
              فعلية.
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-[#182431]/55"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </div>

        <div className="mt-10 grid gap-7 lg:grid-cols-[250px_1fr]">
          <aside className="rounded-[1.5rem] bg-white p-5">
            <div className="flex items-center justify-between">
              <b>تصفية النتائج</b>

              <Filter className="h-4 w-4 text-[#ff7a00]" />
            </div>

            <label className="mt-6 block text-xs font-bold text-[#182431]/50">
              ابحث
            </label>

            <div className="mt-2 flex items-center rounded-xl bg-[#fbf8f4] px-3">
              <Search className="h-4 w-4 text-[#182431]/40" />

              <input
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="اسم أو مادة"
                className="w-full bg-transparent px-2 py-3 text-sm outline-none"
              />
            </div>

            <label className="mt-5 block text-xs font-bold text-[#182431]/50">
              المادة
            </label>

            <select
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
              className="mt-2 w-full rounded-xl bg-[#fbf8f4] px-3 py-3 text-sm outline-none"
            >
              <option value="كل المواد">
                كل المواد
              </option>

              {subjects.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-xs font-bold text-[#182431]/50">
              المرحلة
            </label>

            <select
              value={grade}
              onChange={(e) =>
                setGrade(e.target.value)
              }
              className="mt-2 w-full rounded-xl bg-[#fbf8f4] px-3 py-3 text-sm outline-none"
            >
              <option value="">
                كل المراحل
              </option>

              {[
                "ابتدائي",
                "إعدادي",
                "ثانوي",
                "جامعي",
              ].map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-xs font-bold text-[#182431]/50">
              الدولة
            </label>

            <select
              value={country}
              onChange={(e) =>
                setCountry(e.target.value)
              }
              className="mt-2 w-full rounded-xl bg-[#fbf8f4] px-3 py-3 text-sm outline-none"
            >
              <option value="">
                كل الدول
              </option>

              {[
                "مصر",
                "السعودية",
                "الإمارات",
                "الكويت",
                "الأردن",
              ].map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-xs font-bold text-[#182431]/50">
              التوفر
            </label>

            <select
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(
                  e.target.value,
                )
              }
              className="mt-2 w-full rounded-xl bg-[#fbf8f4] px-3 py-3 text-sm outline-none"
            >
              <option value="">
                أي وقت
              </option>

              {[
                "اليوم",
                "بعد الظهر",
                "المساء",
                "نهاية الأسبوع",
              ].map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-xs font-bold text-[#182431]/50">
              الحد الأقصى للسعر ·{" "}
              {maxPrice} ج.م
            </label>

            <input
              className="mt-3 w-full"
              type="range"
              min="50"
              max="1000"
              step="10"
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(
                  Number(e.target.value),
                )
              }
            />
          </aside>

          <section>
            <div className="mb-4 flex items-center justify-between text-sm text-[#182431]/50">
              <span>
                {filtered.length} معلمًا متاحًا
              </span>

              <label className="flex items-center gap-2">
                <span>ترتيب حسب</span>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value,
                    )
                  }
                  className="rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-[#182431] outline-none"
                >
                  <option value="experience">
                    الخبرة الأعلى
                  </option>

                  <option value="rating">
                    التقييم الأعلى
                  </option>

                  <option value="price">
                    السعر الأقل
                  </option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sorted.map((t) => (
                <article
                  key={t.id}
                  className="rounded-[1.5rem] bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-[#ff7a00]"
                      style={{
                        backgroundColor:
                          t.color,
                      }}
                    >
                      {t.initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold">
                          {t.name}
                        </h2>

                        {/^[0-9]+$/.test(
                          t.id,
                        ) && (
                          <BadgeCheck className="h-4 w-4 text-[#ff7a00]" />
                        )}
                      </div>

                      <p className="mt-1 text-sm text-[#182431]/55">
                        {t.subject} ·{" "}
                        {t.stage}
                      </p>

                      <div className="mt-2 flex items-center gap-1 text-xs">
                        {!/^\d+$/.test(
                          t.id,
                        ) ? (
                          <span className="rounded-full bg-[#fff0e2] px-2 py-1 text-[10px] font-bold text-[#b85a08]">
                            ملف تجريبي
                          </span>
                        ) : t.rating > 0 ? (
                          <>
                            <Star className="h-3.5 w-3.5 fill-[#e8a64a] text-[#e8a64a]" />

                            <b>{t.rating}</b>
                          </>
                        ) : (
                          <span className="text-[#182431]/50">
                            لا توجد مراجعات بعد
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="mr-auto rounded-full bg-[#fff0e2] px-2.5 py-1 text-[10px] font-bold text-[#ff7a00]">
                      {/^\d+$/.test(t.id)
                        ? "ملف موثّق"
                        : "بيانات عرض"}
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-[#182431]/60">
                    {t.bio}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-[#182431]/8 pt-4">
                    <span>
                      <b>
                        {t.price}{" "}
                        {currencyForCountry(
                          t.country,
                        )}
                      </b>

                      <small className="mr-1 text-[#182431]/40">
                        / ساعة
                      </small>
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleTeacherFavorite(
                            t,
                          )
                        }
                        disabled={
                          user?.role !==
                            "student" ||
                          !/^\d+$/.test(
                            t.id,
                          )
                        }
                        className={`rounded-full border px-3 py-2 text-xs font-bold ${
                          favoriteIds.has(
                            t.id,
                          )
                            ? "border-[#e8a64a] bg-[#fff3df] text-[#8a5b27]"
                            : "border-[#182431]/12"
                        }`}
                      >
                        {favoriteIds.has(
                          t.id,
                        )
                          ? "محفوظ"
                          : "مفضلة"}
                      </button>

                      <Link
                        href={`/teachers/${t.id}`}
                        className="rounded-full border border-[#182431]/12 px-3 py-2 text-xs font-bold"
                      >
                        عرض الملف
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          startBooking(t)
                        }
                        className="rounded-full bg-[#182431] px-3 py-2 text-xs font-bold text-white"
                      >
                        حجز
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-3xl bg-white p-12 text-center">
                <X className="mx-auto text-[#ff7a00]" />

                <p className="mt-3 font-bold">
                  لا توجد نتائج بهذه التصفية
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {bookingTeacher && (
        <BookingModal
          teacher={bookingTeacher}
          close={() =>
            setBookingTeacher(null)
          }
          navigate={setLocation}
        />
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#fbf8f4] p-4">
      <span className="text-xs text-[#182431]/45">
        {label}
      </span>

      <b className="mt-2 block text-sm">
        {value || "—"}
      </b>
    </div>
  );
}

function BookingModal({
  teacher,
  close,
  navigate,
}: {
  teacher: typeof demoTeachers[number];
  close: () => void;
  navigate: (path: string) => void;
}) {
  const teacherId = Number(
    teacher.id,
  );

  const validTeacherId =
    Number.isInteger(teacherId) &&
    teacherId > 0;

  const [date, setDate] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [selectedSlot, setSelectedSlot] =
    useState("");

  const [type, setType] =
    useState("فردي");

  const [confirmed, setConfirmed] =
    useState(false);

  const [error, setError] = useState("");

  const availability =
    trpc.marketplace.availability.useQuery(
      { teacherId },
      {
        enabled: validTeacherId,
      },
    );

  const createBooking =
    trpc.student.booking.create.useMutation(
      {
        onSuccess: () => {
          setError("");
          setConfirmed(true);
        },

        onError: (err) => {
          setError(err.message);
        },
      },
    );

  const availableSlots =
    (availability.data ?? []).filter(
      (slot) => {
        if (slot.status !== "active") {
          return false;
        }

        const selectedDate = new Date(
          `${date}T00:00:00`,
        );

        const dayOfWeek =
          selectedDate.getDay();

        return (
          slot.specificDate === date ||
          (slot.specificDate === null &&
            slot.dayOfWeek === dayOfWeek)
        );
      },
    );

  const selectedSlotData =
    availableSlots.find(
      (item) =>
        String(item.id) ===
        selectedSlot,
    );

  const selectedDurationMinutes =
    selectedSlotData
      ? Math.round(
          (timeToMinutes(
            selectedSlotData.endTime,
          ) -
            timeToMinutes(
              selectedSlotData.startTime,
            )),
        )
      : 0;

  const selectedPrice =
    selectedDurationMinutes > 0
      ? Number(
          (
            (teacher.price *
              selectedDurationMinutes) /
            60
          ).toFixed(2),
        )
      : 0;

  function timeToMinutes(
    value: string,
  ) {
    const [hours, minutes] =
      value
        .split(":")
        .map(Number);

    return (
      hours * 60 + minutes
    );
  }

  function zonedDateTimeToUtc(
    dateString: string,
    timeString: string,
    timezone: string,
  ) {
    const baseUtc = new Date(
      `${dateString}T${timeString}:00Z`,
    );

    if (
      !Number.isFinite(
        baseUtc.getTime(),
      )
    ) {
      throw new Error(
        "التاريخ أو الوقت غير صالح",
      );
    }

    let guess = baseUtc;

    for (let i = 0; i < 3; i += 1) {
      const parts =
        new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          },
        )
          .formatToParts(guess)
          .reduce<
            Record<string, string>
          >((acc, part) => {
            acc[part.type] =
              part.value;

            return acc;
          }, {});

      const representedUtc =
        Date.UTC(
          Number(parts.year),
          Number(parts.month) - 1,
          Number(parts.day),
          Number(parts.hour),
          Number(parts.minute),
        );

      const difference =
        representedUtc -
        baseUtc.getTime();

      guess = new Date(
        baseUtc.getTime() -
          difference,
      );
    }

    return guess;
  }

  async function confirmBooking() {
    setError("");

    if (!validTeacherId) {
      setError(
        "هذا المعلم تجريبي ولا يمكن إنشاء حجز فعلي له.",
      );

      return;
    }

    if (!selectedSlot) {
      setError(
        "اختاري موعدًا للحجز.",
      );

      return;
    }

    const slot =
      availableSlots.find(
        (item) =>
          String(item.id) ===
          selectedSlot,
      );

    if (!slot) {
      setError(
        "الموعد المختار غير متاح.",
      );

      return;
    }

    const durationMinutes =
      Math.round(
        timeToMinutes(
          slot.endTime,
        ) -
          timeToMinutes(
            slot.startTime,
          ),
      );

    if (
      durationMinutes < 15 ||
      durationMinutes > 480
    ) {
      setError(
        "مدة الحجز يجب أن تكون بين 15 دقيقة و8 ساعات.",
      );

      return;
    }

    try {
      const startAt =
        zonedDateTimeToUtc(
          date,
          slot.startTime,
          slot.timezone,
        );

      const endAt =
        zonedDateTimeToUtc(
          date,
          slot.endTime,
          slot.timezone,
        );

      await createBooking.mutateAsync(
        {
          teacherId,
          subject: teacher.subject,
          startAt:
            startAt.toISOString(),
          endAt:
            endAt.toISOString(),
          timezone:
            slot.timezone,
          notes: `نوع الدرس: ${type}`,
        },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر إنشاء الحجز",
      );
    }
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#182431]/60 p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-lg rounded-[2rem] bg-[#fbf8f4] p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#ff7a00]">
                حجز حقيقي
              </span>

              <h2 className="mt-2 text-2xl font-bold">
                تم إرسال الحجز
              </h2>
            </div>

            <button
              type="button"
              aria-label="إغلاق"
              onClick={close}
            >
              <X />
            </button>
          </div>

          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-[#ff7a00]" />

            <h3 className="mt-4 text-xl font-bold">
              تم إرسال حجزك إلى{" "}
              {teacher.name}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#182431]/60">
              المادة:{" "}
              {teacher.subject}
              <br />
              التاريخ: {date}
              <br />
              نوع الدرس: {type}
              <br />
              مدة الدرس:{" "}
              {selectedDurationMinutes}{" "}
              دقيقة
              <br />
              السعر المتوقع:{" "}
              {selectedPrice}{" "}
              {currencyForCountry(
                teacher.country,
              )}
              <br />
              الحجز في انتظار تأكيد المعلم.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/student/bookings",
                )
              }
              className="mt-7 rounded-full bg-[#ff7a00] px-6 py-3 font-bold text-white"
            >
              عرض حجوزاتي
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#182431]/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="my-6 w-full max-w-lg rounded-[2rem] bg-[#fbf8f4] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-[#ff7a00]">
              حجز درس
            </span>

            <h2 className="mt-2 text-2xl font-bold">
              احجز مع {teacher.name}
            </h2>
          </div>

          <button
            type="button"
            aria-label="إغلاق"
            onClick={close}
          >
            <X />
          </button>
        </div>

        {!validTeacherId && (
          <div className="mt-5 rounded-2xl bg-[#fff4df] p-4 text-sm font-semibold text-[#8a5a00]">
            هذا المعلم من بيانات العرض
            التجريبية ولا يمكن إنشاء حجز
            فعلي له.
          </div>
        )}

        {availability.isLoading &&
          validTeacherId && (
            <div className="mt-6 rounded-2xl bg-white p-5 text-center text-sm">
              جاري تحميل المواعيد...
            </div>
          )}

        {availability.isError && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
            تعذر تحميل مواعيد المعلم.
          </div>
        )}

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            المعلم

            <input
              value={teacher.name}
              disabled
              className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
            />
          </label>

          <label className="block text-sm font-bold">
            المادة

            <input
              value={teacher.subject}
              disabled
              className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
            />
          </label>

          <label className="block text-sm font-bold">
            التاريخ

            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(
                  event.target.value,
                );

                setSelectedSlot("");

                setError("");
              }}
              className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
            />
          </label>

          <div>
            <label className="text-sm font-bold">
              المواعيد المتاحة
            </label>

            {availableSlots.length ===
            0 ? (
              <div className="mt-2 rounded-xl bg-white p-4 text-sm text-[#182431]/55">
                لا توجد مواعيد متاحة في
                هذا التاريخ.
              </div>
            ) : (
              <div className="mt-2 grid gap-2">
                {availableSlots.map(
                  (slot) => {
                    const duration =
                      timeToMinutes(
                        slot.endTime,
                      ) -
                      timeToMinutes(
                        slot.startTime,
                      );

                    const price =
                      Number(
                        (
                          (teacher.price *
                            duration) /
                          60
                        ).toFixed(2),
                      );

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() =>
                          setSelectedSlot(
                            String(
                              slot.id,
                            ),
                          )
                        }
                        className={`rounded-xl border p-3 text-right text-sm font-bold ${
                          selectedSlot ===
                          String(
                            slot.id,
                          )
                            ? "border-[#ff7a00] bg-[#fff0e2] text-[#ff7a00]"
                            : "border-[#182431]/10 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>
                            {slot.startTime}{" "}
                            —{" "}
                            {slot.endTime}
                          </span>

                          <span className="text-xs font-semibold">
                            {duration} دقيقة
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs font-normal text-[#182431]/45">
                          <span>
                            {slot.timezone}
                          </span>

                          <span>
                            {price}{" "}
                            {currencyForCountry(
                              teacher.country,
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>

          <label className="block text-sm font-bold">
            نوع الدرس

            <select
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
            >
              <option value="فردي">
                فردي
              </option>

              <option value="جماعي مستقبلًا">
                جماعي مستقبلًا
              </option>
            </select>
          </label>

          {selectedSlotData &&
            selectedDurationMinutes >
              0 && (
              <div className="rounded-2xl bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-[#ff7a00]" />

                    <div>
                      <span className="block text-xs text-[#182431]/45">
                        المادة
                      </span>

                      <b>
                        {teacher.subject}
                      </b>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock3 className="h-4 w-4 text-[#ff7a00]" />

                    <div>
                      <span className="block text-xs text-[#182431]/45">
                        المدة
                      </span>

                      <b>
                        {
                          selectedDurationMinutes
                        }{" "}
                        دقيقة
                      </b>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-[#ff7a00]" />

                    <div>
                      <span className="block text-xs text-[#182431]/45">
                        السعر المتوقع
                      </span>

                      <b>
                        {selectedPrice}{" "}
                        {currencyForCountry(
                          teacher.country,
                        )}
                      </b>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-[#182431]/45">
                  السعر النهائي يتم حسابه
                  والتحقق منه على الخادم
                  عند إنشاء الحجز.
                </p>
              </div>
            )}

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={
            !validTeacherId ||
            !selectedSlot ||
            createBooking.isPending
          }
          onClick={confirmBooking}
          className="mt-7 w-full rounded-full bg-[#ff7a00] py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createBooking.isPending
            ? "جاري إنشاء الحجز..."
            : "تأكيد الحجز"}
        </button>
      </div>
    </div>
  );
}
