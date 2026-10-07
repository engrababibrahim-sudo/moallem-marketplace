import { useEffect, useMemo, useRef, useState } from "react";
import { getOnboardingProgress } from "../../../shared/onboarding";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  GraduationCap,
  Languages,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Onboarding = {
  role: string;
  stage: string;
  grade: string;
  subject: string;
  goal: string;
  level: string;
  needs: string;
  format: string;
  time: string;
};

const initial: Onboarding = {
  role: "",
  stage: "",
  grade: "",
  subject: "",
  goal: "",
  level: "",
  needs: "",
  format: "",
  time: "",
};

const teachers = [
  {
    id: "sara",
    name: "سارة محمود",
    subject: "رياضيات",
    stage: "الثانوية العامة",
    years: 8,
    rating: "4.9",
    price: "٣٢٠",
    match: "٩٤٪",
    initials: "س",
    color: "#f6e2d5",
    area: "القاهرة · أونلاين",
  },
  {
    id: "omar",
    name: "عمر عبدالسلام",
    subject: "فيزياء",
    stage: "الثانوية العامة",
    years: 6,
    rating: "4.8",
    price: "٢٨٠",
    match: "٩١٪",
    initials: "ع",
    color: "#e4eadc",
    area: "الجيزة · أونلاين",
  },
  {
    id: "noura",
    name: "نورهان علي",
    subject: "لغة إنجليزية",
    stage: "الإعدادية",
    years: 10,
    rating: "5.0",
    price: "٢٥٠",
    match: "٨٩٪",
    initials: "ن",
    color: "#e9e2f1",
    area: "الإسكندرية · أونلاين",
  },
];

const faqs = [
  "كيف أختار المعلم المناسب؟",
  "هل أستطيع متابعة تعلم أكثر من ابن؟",
  "كيف يتم حجز الدرس؟",
  "هل الأسعار المعروضة نهائية؟",
];

const navLinks = [
  ["كيف تعمل", "#how"],
  ["المعلمون", "#teachers"],
  ["لأولياء الأمور", "#parents"],
  ["للمعلمين", "#tutors"],
  ["الأسئلة الشائعة", "#faq"],
] as const;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState({ grade: "", subject: "", country: "مصر", format: "فردي مباشر", price: "", availability: "" });
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboarding, setOnboarding] = useState(initial);
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();

  const notify = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2800);
  };
  const update = (key: keyof Onboarding, value: string) =>
    setOnboarding((current) => ({ ...current, [key]: value }));
  const openOnboarding = () => {
    setStep(0);
    setOnboardingOpen(true);
  };

  useEffect(() => {
    if (window.location.pathname === "/onboarding") openOnboarding();
  }, []);

  const questions = [
    ["لمن نبحث عن معلم؟", "role", ["طالب", "ولي أمر"]],
    ["ما المرحلة الدراسية؟", "stage", ["ابتدائي", "إعدادي", "ثانوي", "جامعي"]],
    ["ما الصف؟", "grade", ["الصف السادس", "الأول الإعدادي", "الأول الثانوي", "الثالث الثانوي"]],
    ["ما المادة؟", "subject", ["رياضيات", "لغة عربية", "لغة إنجليزية", "فيزياء", "كيمياء"]],
    ["ما هدفك من التعلم؟", "goal", ["رفع الدرجة", "الاستعداد للاختبار", "فهم الأساسيات", "تنظيم المذاكرة"]],
    ["كيف تصف مستواك؟", "level", ["أحتاج تأسيسًا", "متوسط", "متقدم"]],
    ["ما أكثر ما تحتاجه؟", "needs", ["حل المسائل", "شرح المفاهيم", "خطة مذاكرة", "ثقة قبل الامتحان"]],
    ["ما نوع الدروس المفضل؟", "format", ["فردية مباشرة", "مرنة حسب الجدول", "مزيج من الاثنين"]],
    ["متى يناسبك التعلم؟", "time", ["بعد الظهر", "المساء", "نهاية الأسبوع"]],
  ] as const;
  const current = questions[step];
  const completed = Math.round((getOnboardingProgress(onboarding, 9) / 100) * 9);

  const findTeachers = () => {
    const params = new URLSearchParams();
    if (search.subject) params.set("subject", search.subject);
    if (search.grade) params.set("grade", search.grade);
    if (search.country) params.set("country", search.country);
    if (search.price) {
      const digits = search.price.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
      params.set("price", digits.replace(/\D/g, ""));
    }
    if (search.availability) params.set("availability", search.availability);
    setLocation(`/teachers${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <div dir="rtl" className="min-h-screen overflow-hidden bg-[#fbf8f4] text-[#182431]">
      {notice && (
        <div role="status" className="fixed bottom-5 right-5 z-[70] rounded-2xl bg-[#182431] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#182431]/[0.07] bg-[#fbf8f4]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-10">
          <Link href="/" aria-label="مُعلّم - الرئيسية" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#ff7a00] text-white shadow-lg shadow-orange-500/20">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <b className="block text-[19px] tracking-tight">مُعلّم</b>
              <span className="mt-1 block text-[9px] font-semibold tracking-[.13em] text-[#182431]/45">تعلم على مقاسك</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] font-semibold text-[#182431]/65 xl:flex">
            {navLinks.map(([label, href]) => <a key={href} className="hover:text-[#d86100]" href={href}>{label}</a>)}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <Link href="/auth" className="rounded-full px-4 py-2.5 text-sm font-bold hover:bg-white">تسجيل الدخول</Link>
            <button onClick={openOnboarding} className="rounded-full bg-[#182431] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#182431]/10 hover:bg-[#273b4e]">ابدأ مجانًا <ArrowLeft className="mr-1 inline h-4 w-4" /></button>
          </div>

          <button aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMenuOpen((open) => !open)} className="rounded-xl p-2 md:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="space-y-3 border-t border-[#182431]/[0.07] bg-[#fbf8f4] px-5 py-5 md:hidden">
            {navLinks.map(([label, href]) => <a key={href} className="block py-1 font-semibold" href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
            <Link className="block py-1 font-semibold" href="/auth">تسجيل الدخول</Link>
            <button onClick={openOnboarding} className="w-full rounded-full bg-[#ff7a00] py-3 font-bold text-white">ابدأ مجانًا</button>
          </div>
        )}
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 lg:px-10 lg:pb-24 lg:pt-16">
          <div className="pointer-events-none absolute -right-40 top-8 h-80 w-80 rounded-full bg-[#ff7a00]/[0.08] blur-3xl" />
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_.92fr] lg:gap-14">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ff7a00]/20 bg-white/80 px-4 py-2 text-xs font-bold text-[#b85400]">
                <Sparkles className="h-4 w-4" /> تعلّم فردي مع معلمين موثّقين
              </div>
              <h1 className="max-w-2xl text-[43px] font-bold leading-[1.2] tracking-[-.04em] sm:text-6xl lg:text-[68px]">
                تعلم مع أفضل<br />
                <span className="relative inline-block text-[#f27600]">المعلمين من أي مكان<span className="absolute -bottom-1 right-0 h-2 w-2/3 rounded-full bg-[#ffd7b5]/80" /></span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#182431]/65 sm:text-lg">
                اختر معلمك، احجز موعدك، وابدأ رحلة تعلم مصممة لك — بخطوات واضحة ومتابعة تطمّن الأسرة.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={() => document.getElementById("teacher-search")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="rounded-full bg-[#ff7a00] px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-500/20 hover:-translate-y-0.5">
                  ابحث عن معلم <ArrowLeft className="mr-2 inline h-4 w-4" />
                </button>
                <Link href="/teacher/register" className="rounded-full border border-[#182431]/15 bg-white/70 px-6 py-3.5 font-bold hover:bg-white">انضم كمعلم</Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[#182431]/55">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#f27600]" /> ملفات معلمين قيد التحقق</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#f27600]" /> مواعيد تناسب يومك</span>
                <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-[#f27600]" /> السعر واضح قبل الطلب</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="absolute -left-4 top-12 z-10 hidden rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-[#182431]/10 sm:block">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0e2] text-[#d86100]"><BadgeCheck className="h-5 w-5" /></span>
                  <span><b className="block text-xs">تعلم بثقة</b><small className="mt-1 block text-[10px] text-[#182431]/55">ملفات واضحة ومراجعة</small></span>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-[#eee4d8] shadow-[0_25px_70px_-30px_rgba(24,36,49,.35)] sm:aspect-[1.08/1]">
                <img src="/manus-storage/moallem-tutor-hero_c772e0b2.jpg" alt="معلمة تشرح لطالبة خلال جلسة تعلم منزلية" className="absolute inset-0 h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#182431]/70 via-transparent to-transparent" />
                <div className="absolute right-5 top-5 rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#182431]">مصر · حصص أونلاين</div>
                <div className="absolute bottom-5 right-5 left-5 flex items-end justify-between gap-3 text-white">
                  <div><span className="text-xs text-white/75">تعلم خطوة بخطوة</span><h2 className="mt-1 text-xl font-bold sm:text-2xl">كل حصة تقرّبك لهدفك</h2></div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ff7a00] shadow-lg"><BookOpen className="h-5 w-5" /></span>
                </div>
              </div>
              <div className="absolute -bottom-5 -right-3 hidden rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-xl sm:block">
                <div className="flex items-center gap-2 text-xs font-bold"><span className="rounded-full bg-[#fff0e2] px-2 py-1 text-[#b85a08]">Demo</span><span>بطاقة توضيحية</span></div>
                <p className="mt-1 text-[10px] text-[#182431]/50">قارن الخبرة، المادة، والسعر عند توفر ملفات حقيقية</p>
              </div>
            </div>
          </div>

          <div id="teacher-search" className="relative z-20 mt-14 rounded-[1.75rem] border border-white bg-white p-4 shadow-[0_20px_55px_-35px_rgba(24,36,49,.38)] sm:p-5 lg:mt-20">
            <div className="mb-4 flex items-center gap-2 px-1"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff0e2] text-[#d86100]"><Search className="h-4 w-4" /></span><div><b className="block text-sm">ابدأ البحث عن معلم</b><span className="text-[11px] text-[#182431]/50">اختر ما يناسبك — ويمكنك تعديل التصفية لاحقًا</span></div></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SearchSelect label="المرحلة" value={search.grade} onChange={(grade) => setSearch((s) => ({ ...s, grade }))} options={["ابتدائي", "إعدادي", "ثانوي", "جامعي"]} placeholder="كل المراحل" />
              <SearchSelect label="المادة" value={search.subject} onChange={(subject) => setSearch((s) => ({ ...s, subject }))} options={["رياضيات", "لغة عربية", "لغة إنجليزية", "فيزياء", "كيمياء", "علوم"]} placeholder="اختر المادة" />
              <SearchSelect label="الدولة" value={search.country} onChange={(country) => setSearch((s) => ({ ...s, country }))} options={["مصر", "السعودية", "الإمارات", "الكويت", "الأردن"]} placeholder="اختر الدولة" />
              <SearchSelect label="نوع الدرس" value={search.format} onChange={(format) => setSearch((s) => ({ ...s, format }))} options={["فردي مباشر", "تجربة تعريفية", "مراجعة اختبار"]} placeholder="كل الأنواع" />
              <SearchSelect label="السعر" value={search.price} onChange={(price) => setSearch((s) => ({ ...s, price }))} options={["حتى ٣٠٠ ج.م", "حتى ٥٠٠ ج.م", "حتى ٧٠٠ ج.م"]} placeholder="كل الأسعار" />
              <SearchSelect label="التوفر" value={search.availability} onChange={(availability) => setSearch((s) => ({ ...s, availability }))} options={["اليوم", "المساء", "نهاية الأسبوع"]} placeholder="أي وقت" />
              <button onClick={findTeachers} className="flex items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-500/15 hover:bg-[#e96e00]"><Search className="h-4 w-4" /> ابحث الآن</button>
            </div>
          </div>
        </section>

        <section className="border-y border-[#182431]/[0.06] bg-white py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 text-xs font-semibold text-[#182431]/55 lg:justify-between lg:px-10">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#f27600]" /> معلمون يخضعون للمراجعة</span>
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#f27600]" /> احجز في الوقت المناسب</span>
            <span className="inline-flex items-center gap-2"><Languages className="h-4 w-4 text-[#f27600]" /> تجربة عربية من البداية</span>
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#f27600]" /> متابعة للأسرة والطالب</span>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-24">
          <SectionHeading eyebrow="بكل بساطة" title={<>من البحث إلى أول إنجاز،<br className="hidden sm:block" /> نرتبها معك.</>} copy="خطوات واضحة تساعدك تختار، تحجز، وتتابع التقدم دون تعقيد." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Search, "١", "ابحث بذكاء", "اختر المادة والمرحلة، ثم قارن الملفات والأسعار."],
              [ShieldCheck, "٢", "اختر بثقة", "اطلع على خبرة المعلم وطريقته والمواعيد المتاحة."],
              [CalendarDays, "٣", "احجز موعدك", "أرسل طلب الدرس في الوقت الذي يناسبك."],
              [BookOpen, "٤", "تابع تقدمك", "احتفظ بملخص الدرس والخطوة القادمة للتعلم."],
            ].map(([Icon, number, title, copy]) => {
              const StepIcon = Icon as typeof Search;
              return <article key={String(number)} className="group rounded-[1.5rem] bg-[#f4efe9] p-5 transition hover:-translate-y-1 hover:bg-[#fff0e2]"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#df6900] shadow-sm"><StepIcon className="h-5 w-5" /></span><span className="text-xs font-bold text-[#182431]/25">{String(number)}</span></div><h3 className="mt-7 text-lg font-bold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-[#182431]/58">{String(copy)}</p></article>;
            })}
          </div>
        </section>

        <section id="teachers" className="bg-[#f2ece5] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionHeading eyebrow="معلمون في مجالات مختلفة" title={<>تعرّف على من<br className="hidden sm:block" /> يناسب رحلتك.</>} copy="نماذج توضيحية لبطاقات المعلمين — البيانات والأسعار المعروضة تجريبية." /><Link href="/teachers" className="mb-1 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#c35a00]">استكشف المعلمين <ArrowLeft className="h-4 w-4" /></Link></div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => <article key={teacher.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start gap-3"><span style={{ backgroundColor: teacher.color }} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-bold text-[#182431]">{teacher.initials}</span><div className="min-w-0"><div className="flex items-center gap-1.5"><h3 className="truncate font-bold">{teacher.name}</h3></div><p className="mt-1 text-xs text-[#182431]/55">{teacher.subject} · {teacher.stage}</p><p className="mt-1.5 text-[11px] text-[#182431]/45">{teacher.area}</p></div><span className="mr-auto rounded-full bg-[#fff0e2] px-2 py-1 text-[10px] font-bold text-[#b85a08]">Demo</span></div>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-[#fff5eb] px-3.5 py-3"><span className="text-xs text-[#182431]/55">نموذج بطاقة</span><b className="text-sm text-[#c35a00]">بيانات توضيحية</b></div>
                <div className="mt-4 flex items-center justify-between gap-2"><span><b className="text-sm">{teacher.price} ج.م</b><small className="mr-1 text-[10px] text-[#182431]/45">/ ٦٠ دقيقة</small></span><Link href={`/teachers/${teacher.id}`} className="rounded-full bg-[#182431] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#31485e]">عرض الملف</Link></div>
                <p className="mt-3 text-[10px] text-[#182431]/40">ملف تجريبي للتوضيح فقط · خبرة {teacher.years} سنوات</p>
              </article>)}
            </div>
          </div>
        </section>

        <section id="parents" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10 lg:py-24">
          <div><p className="mb-4 text-sm font-bold text-[#c35a00]">للطلاب وأولياء الأمور</p><h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">تعلم أوضح.<br />وطمأنينة أكبر.</h2><p className="mt-5 max-w-lg leading-8 text-[#182431]/60">ملف لكل طالب، ومتابعة للحصص القادمة والتقارير والواجبات — حتى تعرف الأسرة ما تم وما الخطوة التالية.</p><button onClick={openOnboarding} className="mt-7 rounded-full bg-[#182431] px-6 py-3.5 text-sm font-bold text-white">ابنِ ملف تعلمك <ArrowLeft className="mr-1 inline h-4 w-4" /></button></div>
          <div className="rounded-[1.75rem] bg-[#182431] p-5 text-white shadow-xl shadow-[#182431]/15 sm:p-7"><div className="flex items-center justify-between"><div><span className="text-[10px] font-semibold tracking-wide text-white/45">لوحة متابعة · نموذج تجريبي</span><h3 className="mt-2 text-xl font-bold">رحلة تعلّم ليلى</h3></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff7a00] text-white"><GraduationCap className="h-5 w-5" /></span></div><div className="mt-6 grid grid-cols-3 gap-2 text-center"><Metric value="٨" label="دروس مكتملة" /><Metric value="٧٦٪" label="تقدم هذا الشهر" /><Metric value="٢" label="واجبات قادمة" /></div><div className="mt-4 rounded-2xl bg-white/[0.08] p-4"><div className="flex items-center justify-between text-xs"><b>الخطوة القادمة</b><span className="text-white/50">الخميس · ٦:٣٠ م</span></div><div className="mt-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[#ffb36e]"><BookOpen className="h-4 w-4" /></span><div><b className="block text-sm">مراجعة الجبر</b><span className="mt-1 block text-[10px] text-white/50">مع أ. سارة · درس أونلاين</span></div><ArrowLeft className="mr-auto h-4 w-4 text-white/45" /></div></div><p className="mt-4 text-[10px] text-white/45">واجهة توضيحية؛ المعلومات الشخصية والحصص ليست حقيقية.</p></div>
        </section>

        <section id="tutors" className="bg-[#fff0e2] py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-7 px-5 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10"><div><p className="text-sm font-bold text-[#a84c00]">للمعلمين</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">علّم بطريقتك، ووسّع أثرك.</h2><p className="mt-3 max-w-2xl leading-7 text-[#182431]/65">أنشئ ملفك، أضف المواد والمراحل التي تدرّسها، وحدد أوقاتك المناسبة. طلبات الانضمام تخضع للمراجعة قبل الظهور في السوق.</p></div><Link href="/teacher/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7a00] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/15">قدّم كمعلم <ArrowLeft className="h-4 w-4" /></Link></div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
          <SectionHeading eyebrow="الوضوح من البداية" title="كيف تعمل الأسعار؟" copy="قارن أسعار المعلمين قبل إرسال طلبك. لا تُدخل بيانات دفع في هذه النسخة التجريبية." />
          <div className="mt-8 grid gap-4 md:grid-cols-3"><PriceInfo icon={Wallet} title="سعر ظاهر" text="يعرض ملف المعلم سعر الحصة ومدتها قبل أن تبدأ طلب الحجز." /><PriceInfo icon={CalendarDays} title="موعد يناسبك" text="تعرّف على المواعيد المتاحة، ثم أرسل طلبك لمراجعة التوفر." /><PriceInfo icon={ShieldCheck} title="بدون مفاجآت" text="بوابات الدفع واسترداد الأموال تحتاج إلى تهيئة مزود رسمي قبل الإطلاق." /></div>
        </section>

        <section id="faq" className="border-y border-[#182431]/[0.06] bg-white py-20">
          <div className="mx-auto max-w-3xl px-5"><div className="text-center"><p className="mb-3 text-sm font-bold text-[#c35a00]">الأسئلة الشائعة</p><h2 className="text-3xl font-bold sm:text-4xl">كل ما تحتاج معرفته</h2></div><div className="mt-9 space-y-3">{faqs.map((question, index) => <div key={question} className="rounded-2xl bg-[#fbf8f4] px-5"><button className="flex w-full items-center justify-between gap-4 py-5 text-right font-bold" onClick={() => setFaq(faq === index ? null : index)}>{question}<ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${faq === index ? "rotate-180" : ""}`} /></button>{faq === index && <p className="pb-5 text-sm leading-7 text-[#182431]/60">نُعلّم تساعدك على استكشاف ملفات المعلمين ومقارنة المواد والمواعيد والأسعار. أي ملف يحمل وسم «تجريبي» هو بيانات عرض فقط؛ أما الحجز والدفع الفعليان فيعتمدان على تهيئة حسابك ومزودي الخدمة المعتمدين.</p>}</div>)}</div></div>
        </section>
      </main>

      <footer className="bg-[#182431] px-5 py-12 text-white lg:px-10"><div className="mx-auto grid max-w-7xl gap-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff7a00]"><GraduationCap className="h-5 w-5" /></span><b className="text-lg">مُعلّم</b></div><p className="mt-4 max-w-xs text-sm leading-7 text-white/55">اختر معلمك، احجز موعدك، وابدأ رحلة تعلم مصممة لك.</p><p className="mt-4 text-[10px] text-white/35">نسخة عرض للمرحلة الأولى · مصر · © ٢٠٢٦</p></div><FooterGroup title="اكتشف" links={[["المعلمون", "/teachers"], ["كيف تعمل", "#how"], ["الأسئلة الشائعة", "#faq"]]} /><FooterGroup title="مجتمع مُعلّم" links={[["للطلاب", "#parents"], ["لأولياء الأمور", "#parents"], ["للمعلمين", "/teacher/register"]]} /><div><b className="text-sm">تواصل معنا</b><p className="mt-4 flex items-center gap-2 text-sm text-white/55"><MessageCircle className="h-4 w-4" /> مركز المساعدة قيد التجهيز</p><div className="mt-3 flex gap-4 text-xs text-white/40"><span>الخصوصية قيد التجهيز</span><span>الشروط قيد التجهيز</span></div></div></div></footer>

      {onboardingOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#182431]/60 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-[1.75rem] bg-[#fbf8f4] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><span className="text-xs font-bold text-[#c35a00]">خطوة {Math.min(step + 1, 9)} من ٩ · ملف تعلّم مبدئي</span><h2 id="onboarding-title" className="mt-2 text-2xl font-bold">{step < 9 ? "لنجد نقطة البداية المناسبة لك" : "هذه بداية ملف تعلمك"}</h2></div><button aria-label="إغلاق" onClick={() => setOnboardingOpen(false)} className="rounded-xl p-2 hover:bg-white"><X /></button></div><div className="mt-5 h-2 rounded-full bg-[#182431]/10"><div className="h-2 rounded-full bg-[#ff7a00] transition-all" style={{ width: `${Math.min(100, (step / 9) * 100)}%` }} /></div>{step < 9 ? <><p className="mt-8 text-xl font-bold">{current[0]}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{current[2].map((option) => <button key={option} onClick={() => { update(current[1] as keyof Onboarding, option); setStep((value) => value + 1); }} className="rounded-2xl border border-[#182431]/10 bg-white p-4 text-right font-semibold transition hover:-translate-y-0.5 hover:border-[#ff7a00] hover:bg-[#fff4e9]">{option}</button>)}</div><div className="mt-8 flex justify-between"><button disabled={step === 0} onClick={() => setStep((value) => value - 1)} className="rounded-full border border-[#182431]/15 px-5 py-2 text-sm font-bold disabled:opacity-30">السابق</button><span className="self-center text-xs text-[#182431]/45">يمكنك العودة لتغيير إجاباتك</span></div></> : <OnboardingResult data={onboarding} onClose={() => setOnboardingOpen(false)} />}</div></div>}
    </div>
  );
}

function SearchSelect({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder: string }) {
  return <label className="block rounded-2xl bg-[#f7f3ee] px-3.5 py-2.5"><span className="block text-[10px] font-bold text-[#182431]/45">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full appearance-none bg-transparent text-sm font-semibold outline-none"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: React.ReactNode; copy: string }) {
  return <div><p className="mb-3 text-sm font-bold text-[#c35a00]">{eyebrow}</p><h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[#182431]/55">{copy}</p></div>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-white/[0.08] p-3"><b className="block text-lg">{value}</b><span className="mt-1 block text-[9px] text-white/55">{label}</span></div>;
}

function PriceInfo({ icon: Icon, title, text }: { icon: typeof Wallet; title: string; text: string }) {
  return <article className="rounded-2xl border border-[#182431]/[0.08] bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0e2] text-[#d86100]"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#182431]/55">{text}</p></article>;
}

function FooterGroup({ title, links }: { title: string; links: [string, string][] }) {
  return <div><b className="text-sm">{title}</b><div className="mt-4 space-y-3">{links.map(([label, href]) => <a key={href + label} href={href} className="block text-sm text-white/55 hover:text-white">{label}</a>)}</div></div>;
}

function OnboardingResult({ data, onClose }: { data: Onboarding; onClose: () => void }) {
  const me = trpc.auth.me.useQuery();
  const save = trpc.student.learningProfile.save.useMutation();
  const savedPayload = useRef<string | null>(null);
  const payload = JSON.stringify(data);

  useEffect(() => {
    if (me.data && savedPayload.current !== payload) {
      savedPayload.current = payload;
      save.mutate({ ...data, answers: data });
    }
  }, [data, me.data, payload, save.mutate]);

  const recommendations = useMemo(() => {
    if (data.subject === "فيزياء") return teachers.slice(1, 2);
    if (data.subject === "لغة إنجليزية") return teachers.slice(2, 3);
    return teachers.slice(0, 2);
  }, [data.subject]);

  return <div className="mt-8"><div className="rounded-2xl bg-[#fff0e2] p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white"><Check /></span><div><b>اكتمل ملف التفضيلات</b><p className="mt-1 text-sm leading-6 text-[#182431]/60">{me.data ? (save.isSuccess ? "تم حفظ تفضيلات التعلم على الخادم." : "جارٍ حفظ تفضيلات التعلم…") : "يمكن حفظ الملف بعد تسجيل الدخول. هذه الترشيحات تجريبية."}</p></div></div><div className="mt-4 flex flex-wrap gap-2">{[data.role, data.stage, data.grade, data.subject, data.goal, data.time].filter(Boolean).map((item) => <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{item}</span>)}</div></div><h3 className="mt-7 text-lg font-bold">ترشيحات أولية · Demo</h3><div className="mt-3 space-y-3">{recommendations.map((teacher) => <div key={teacher.id} className="flex items-center gap-3 rounded-2xl bg-white p-4"><span style={{ backgroundColor: teacher.color }} className="grid h-11 w-11 place-items-center rounded-xl font-bold">{teacher.initials}</span><div><b className="text-sm">{teacher.name}</b><p className="mt-1 text-xs text-[#182431]/50">{teacher.subject} · {teacher.stage} · بيانات تجريبية</p></div><span className="mr-auto rounded-full bg-[#fff0e2] px-3 py-1 text-xs font-bold text-[#c35a00]">{teacher.match}</span></div>)}</div><div className="mt-6 flex gap-3"><Link href="/teachers" onClick={onClose} className="flex-1 rounded-full bg-[#ff7a00] py-3 text-center text-sm font-bold text-white">استكشف المعلمين</Link><button onClick={onClose} className="rounded-full border border-[#182431]/15 px-5 py-3 text-sm font-bold">إغلاق</button></div></div>;
}
