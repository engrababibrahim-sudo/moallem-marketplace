
import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  HeartHandshake,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";

const subjects = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "الدراسات الاجتماعية",
  "القرآن الكريم",
  "البرمجة",
];

const steps = [
  {
    icon: Search,
    number: "01",
    title: "ابحث عن معلمك",
    description:
      "اختر المادة والمرحلة الدراسية وابحث عن المعلم المناسب لاحتياجاتك.",
  },
  {
    icon: CalendarDays,
    number: "02",
    title: "احجز موعدك",
    description:
      "راجع مواعيد المعلم المتاحة واختر الوقت المناسب لك ولأسرتك.",
  },
  {
    icon: Video,
    number: "03",
    title: "ابدأ التعلم",
    description:
      "تابع حصتك عبر الإنترنت وواصل رحلتك نحو التفوق خطوة بخطوة.",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "تعليم أكثر أمانًا",
    description:
      "نهتم بتجربة تعليمية منظمة تساعد الطالب وولي الأمر على متابعة الرحلة التعليمية.",
  },
  {
    icon: Users,
    title: "معلمون لمراحل مختلفة",
    description:
      "ابحث عن معلم يناسب المرحلة الدراسية والمادة التي يحتاجها الطالب.",
  },
  {
    icon: CalendarDays,
    title: "مواعيد تناسبك",
    description:
      "اختر الموعد المناسب وفق المواعيد المتاحة لدى المعلم.",
  },
  {
    icon: HeartHandshake,
    title: "تجربة تتمحور حول الطالب",
    description:
      "اجعل احتياجات الطالب وأهدافه نقطة البداية في اختيار الحصص.",
  },
];

const faqs = [
  {
    question: "كيف أجد المعلم المناسب؟",
    answer:
      "انتقل إلى صفحة المعلمين، ثم استخدم البحث والمرشحات المتاحة للوصول إلى المعلم المناسب للمادة والمرحلة الدراسية.",
  },
  {
    question: "كيف أحجز حصة؟",
    answer:
      "افتح صفحة المعلم، وراجع المواعيد المتاحة، ثم اتبع خطوات الحجز المعروضة على المنصة.",
  },
  {
    question: "هل يمكنني متابعة حجوزاتي؟",
    answer:
      "سجّل الدخول إلى حسابك واستخدم الصفحات المتاحة لحسابك لمراجعة حجوزاتك وتفاصيلها.",
  },
  {
    question: "كيف ينضم المعلم إلى المنصة؟",
    answer:
      "يمكن للمعلم البدء من صفحة التسجيل المخصصة للمعلمين واستكمال البيانات المطلوبة.",
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchSubject, setSearchSubject] = useState("");
  const [searchGrade, setSearchGrade] = useState("");

  const findTeachers = () => {
    const params = new URLSearchParams();

    if (searchSubject) params.set("subject", searchSubject);
    if (searchGrade) params.set("grade", searchGrade);

    window.location.href = `/teachers${params.toString() ? `?${params}` : ""}`;
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-white text-slate-800"
    >
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={28} />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight text-slate-900">
                مُعلّم
              </span>
              <span className="block text-xs text-slate-500">
                تعلّم على مقاسك
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <a href="#how" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
              كيف تعمل المنصة؟
            </a>
            <Link href="/teachers" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
              المعلمون
            </Link>
            <a href="#parents" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
              لأولياء الأمور
            </a>
            <a href="#join" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
              للمعلمين
            </a>
            <a href="#faq" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
              الأسئلة الشائعة
            </a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              ابدأ الآن
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-slate-200 p-2.5 lg:hidden"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <a onClick={() => setMobileMenuOpen(false)} href="#how" className="rounded-xl px-4 py-3 font-semibold hover:bg-slate-50">
                كيف تعمل المنصة؟
              </a>
              <Link onClick={() => setMobileMenuOpen(false)} href="/teachers" className="rounded-xl px-4 py-3 font-semibold hover:bg-slate-50">
                المعلمون
              </Link>
              <a onClick={() => setMobileMenuOpen(false)} href="#parents" className="rounded-xl px-4 py-3 font-semibold hover:bg-slate-50">
                لأولياء الأمور
              </a>
              <a onClick={() => setMobileMenuOpen(false)} href="#join" className="rounded-xl px-4 py-3 font-semibold hover:bg-slate-50">
                للمعلمين
              </a>
              <Link href="/login" className="mt-2 rounded-xl border border-slate-200 px-4 py-3 text-center font-bold">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="rounded-xl bg-indigo-600 px-4 py-3 text-center font-bold text-white">
                إنشاء حساب
              </Link>
            </div>
          </nav>
        )}
      </header>

      <section className="relative isolate bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="pointer-events-none absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 -z-10 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm">
              <Sparkles size={17} />
              تعلّم أفضل، بثقة أكبر
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-[1.35] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              رحلتك نحو
              <span className="block text-indigo-600">التفوق تبدأ من هنا!</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-9 text-slate-600">
              اكتشف معلمك المناسب، واختر المادة والموعد الذي يناسبك، واجعل
              التعلّم تجربة أقرب إلى أهدافك وطموحاتك.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/teachers"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-xl shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                اكتشف المعلمين
                <ArrowLeft size={19} />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                انضم إلى مُعلّم
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                ابحث بسهولة
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                اختر موعدك
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                تعلّم من أي مكان
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 top-8 h-28 w-28 rounded-3xl bg-cyan-200/60 rotate-12" />
            <div className="absolute -right-4 bottom-10 h-24 w-24 rounded-full bg-indigo-200/70" />

            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-indigo-200/50 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    ابدأ رحلة التعلّم
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    من أين نبدأ؟
                  </h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <BookOpen size={25} />
                </span>
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <label htmlFor="home-subject" className="mb-2 block text-sm font-bold text-slate-700">
                    المادة الدراسية
                  </label>
                  <select
                    id="home-subject"
                    value={searchSubject}
                    onChange={(event) => setSearchSubject(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">جميع المواد</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="home-grade" className="mb-2 block text-sm font-bold text-slate-700">
                    المرحلة الدراسية
                  </label>
                  <select
                    id="home-grade"
                    value={searchGrade}
                    onChange={(event) => setSearchGrade(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">جميع المراحل</option>
                    <option value="ابتدائي">المرحلة الابتدائية</option>
                    <option value="إعدادي">المرحلة الإعدادية</option>
                    <option value="ثانوي">المرحلة الثانوية</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={findTeachers}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  <Search size={20} />
                  ابحث عن معلم
                  <ArrowLeft size={18} />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                <ShieldCheck className="shrink-0" size={22} />
                <span>اختر ما يناسبك، ثم راجع تفاصيل المعلم ومواعيده المتاحة.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { icon: BookOpen, title: "مواد متنوعة", subtitle: "لمراحل دراسية مختلفة" },
            { icon: CalendarDays, title: "حجز منظم", subtitle: "وفق المواعيد المتاحة" },
            { icon: Video, title: "تعلّم عن بُعد", subtitle: "من المكان المناسب لك" },
            { icon: Wallet, title: "تفاصيل واضحة", subtitle: "راجع بيانات الحصة قبلها" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <item.icon size={23} />
              </span>
              <div>
                <p className="font-extrabold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-extrabold text-indigo-600">كيف تعمل مُعلّم؟</span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              ثلاث خطوات نحو تجربة تعليمية أفضل
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              خطوات بسيطة تساعدك على الوصول إلى المعلم المناسب والبدء في التعلّم.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="group rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/60"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <step.icon size={27} />
                  </span>
                  <span className="text-4xl font-black text-slate-100">{step.number}</span>
                </div>
                <h3 className="mt-6 text-xl font-extrabold text-slate-900">{step.title}</h3>
                <p className="mt-3 leading-8 text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="text-sm font-extrabold text-indigo-600">تعلّم بالطريقة التي تناسبك</span>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                اكتشف المواد التي تحتاجها
              </h2>
              <p className="mt-3 max-w-2xl leading-8 text-slate-600">
                ابدأ من المادة الدراسية، ثم استخدم صفحة المعلمين للوصول إلى الخيارات المتاحة.
              </p>
            </div>
            <Link href="/teachers" className="inline-flex shrink-0 items-center gap-2 font-bold text-indigo-600 hover:text-indigo-800">
              عرض المعلمين
              <ArrowLeft size={18} />
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {subjects.map((subject, index) => (
              <Link
                key={subject}
                href={`/teachers?${new URLSearchParams({ subject })}`}
                className="group flex min-h-36 flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${index % 2 === 0 ? "bg-indigo-50 text-indigo-600" : "bg-cyan-50 text-cyan-700"}`}>
                  <BookOpen size={22} />
                </span>
                <span className="mt-5 flex items-center justify-between gap-2 font-extrabold text-slate-800">
                  {subject}
                  <ArrowLeft size={17} className="text-slate-300 transition group-hover:-translate-x-1 group-hover:text-indigo-600" />
                </span>
              </Link>
            ))}
            <Link
              href="/teachers"
              className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5 text-center transition hover:bg-indigo-50"
            >
              <Search size={27} className="text-indigo-600" />
              <span className="mt-3 font-extrabold text-indigo-800">استكشف المزيد</span>
              <span className="mt-1 text-sm text-slate-500">كل المعلمين المتاحين</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="parents" className="scroll-mt-24 bg-indigo-950 py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-indigo-100">
              <HeartHandshake size={17} />
              لأولياء الأمور
            </span>
            <h2 className="mt-6 text-3xl font-black leading-relaxed sm:text-4xl">
              شارك في رحلة ابنك التعليمية بثقة
            </h2>
            <p className="mt-5 max-w-xl leading-9 text-indigo-100/80">
              ابدأ باختيار المادة والمعلم المناسبين، وراجع بيانات الحجز وتفاصيله من خلال حسابك على المنصة.
            </p>
            <div className="mt-7 space-y-4">
              {[
                "البحث عن المعلم حسب المادة والمرحلة",
                "مراجعة بيانات الحصص ومواعيدها",
                "الوصول إلى المعلومات المتاحة داخل الحساب",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={21} className="mt-1 shrink-0 text-cyan-300" />
                  <span className="leading-7 text-indigo-50">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/teachers" className="rounded-xl bg-white px-6 py-3.5 font-bold text-indigo-950 transition hover:bg-indigo-50">
                ابحث عن معلم
              </Link>
              <Link href="/register" className="rounded-xl border border-white/25 px-6 py-3.5 font-bold text-white transition hover:bg-white/10">
                إنشاء حساب
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <GraduationCap size={26} />
              </span>
              <h3 className="mt-6 text-xl font-extrabold">اختيار واعٍ</h3>
              <p className="mt-3 text-sm leading-7 text-indigo-100/75">
                قارن المعلومات المتاحة عن المعلمين قبل اتخاذ قرار الحجز.
              </p>
            </div>
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <CalendarDays size={26} />
              </span>
              <h3 className="mt-6 text-xl font-extrabold">تنظيم الوقت</h3>
              <p className="mt-3 text-sm leading-7 text-indigo-100/75">
                اختر المواعيد المتاحة التي تتناسب مع جدول الطالب.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <MessageCircle size={26} />
              </span>
              <h3 className="mt-6 text-xl font-extrabold">تواصل أوضح</h3>
              <p className="mt-3 text-sm leading-7 text-indigo-100/75">
                تابع المعلومات والإرشادات المتاحة لك عبر المنصة.
              </p>
            </div>
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <ShieldCheck size={26} />
              </span>
              <h3 className="mt-6 text-xl font-extrabold">وضوح التفاصيل</h3>
              <p className="mt-3 text-sm leading-7 text-indigo-100/75">
                راجع تفاصيل الحجز وشروطه قبل إتمام الخطوات المطلوبة.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-extrabold text-indigo-600">لماذا مُعلّم؟</span>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              تجربة تعليمية تبدأ باحتياجاتك
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-2xl border border-slate-100 p-6 transition hover:border-indigo-100 hover:bg-indigo-50/40">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <benefit.icon size={25} />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-slate-900">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="join" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-indigo-700 to-indigo-600 p-8 text-white shadow-xl shadow-indigo-200 sm:p-12 lg:p-14">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-100">
                  <Star size={17} />
                  للمعلمين
                </span>
                <h2 className="mt-4 text-3xl font-black leading-relaxed sm:text-4xl">
                  شارك خبرتك، ووسّع فرصك التعليمية
                </h2>
                <p className="mt-4 max-w-2xl leading-8 text-indigo-100">
                  أنشئ حسابك كمعلم، واستكمل بياناتك وتخصصاتك ومواعيدك وفق خطوات التسجيل المتاحة.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-extrabold text-indigo-700 transition hover:bg-indigo-50"
              >
                انضم كمعلم
                <ArrowLeft size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-sm font-extrabold text-indigo-600">هل لديك سؤال؟</span>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              الأسئلة الشائعة
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => (
              <article key={faq.question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-right font-extrabold text-slate-900 sm:px-6"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-indigo-600 transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === index && (
                  <div className="border-t border-slate-100 px-5 py-5 leading-8 text-slate-600 sm:px-6">
                    {faq.answer}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500">
                  <GraduationCap size={25} />
                </span>
                <span className="text-xl font-black">مُعلّم</span>
              </Link>
              <p className="mt-4 max-w-md leading-8 text-slate-400">
                منصة تساعد الطلاب وأولياء الأمور على البحث عن المعلمين وتنظيم تجربة التعلّم.
              </p>
            </div>

            <div>
              <h3 className="font-extrabold">روابط مهمة</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link href="/teachers" className="transition hover:text-white">المعلمون</Link>
                <Link href="/login" className="transition hover:text-white">تسجيل الدخول</Link>
                <Link href="/register" className="transition hover:text-white">إنشاء حساب</Link>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold">ابدأ رحلتك</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                اختر المادة والمرحلة، ثم اكتشف الخيارات المتاحة لك.
              </p>
              <Link href="/teachers" className="mt-4 inline-flex items-center gap-2 font-bold text-indigo-300 transition hover:text-white">
                ابحث عن معلم
                <ArrowLeft size={17} />
              </Link>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} مُعلّم — تعلّم على مقاسك
          </div>
        </div>
      </footer>
    </main>
  );
}
