import { useEffect, useState } from "react";
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
  "ما طريقة الدراسة في مُعلّم؟",
  "كيف أتحقق من كفاءة المعلم؟",
  "كيف يتم الحجز بعد اختيار المعلم؟",
  "كيف أدفع مقابل الدروس؟",
  "ماذا لو لم يناسبني المعلم؟",
  "هل يمكنني مشاهدة تسجيل الحصة؟",
  "كيف أحضر الحصة عن بُعد؟",
  "هل توجد باقات شهرية وسياسة استرداد؟",
];

const navLinks = [
  ["كيف تعمل", "/#how"],
  ["المعلمون", "/#teachers"],
  ["لأولياء الأمور", "/#parents"],
  ["للمعلمين", "/#tutors"],
  ["الأسئلة الشائعة", "/#faq"],
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
    setOnboarding((current) => {
      if (key === "stage") return { ...current, stage: value, grade: "", subject: "" };
      if (key === "grade") return { ...current, grade: value, subject: "" };
      return { ...current, [key]: value };
    });
  const openOnboarding = () => {
    setStep(0);
    setOnboardingOpen(true);
  };

  useEffect(() => {
    if (window.location.pathname === "/onboarding") openOnboarding();
  }, []);

  const questions = [
    ["لمن نبحث عن معلم؟", "role", ["طالب", "ولي أمر"]],
    ["ما المرحلة الدراسية؟", "stage", ["روضة", "ابتدائي", "إعدادي", "ثانوي", "جامعي"]],
    ["ما الصف؟", "grade", []],
    ["ما المادة؟", "subject", []],
    ["ما هدفك من التعلم؟", "goal", ["رفع الدرجة", "الاستعداد للاختبار", "فهم الأساسيات", "تنظيم المذاكرة"]],
    ["كيف تصف مستواك؟", "level", ["أحتاج تأسيسًا", "متوسط", "متقدم"]],
    ["ما أكثر ما تحتاجه؟", "needs", ["حل المسائل", "شرح المفاهيم", "خطة مذاكرة", "ثقة قبل الامتحان"]],
    ["ما نوع الدروس المفضل؟", "format", ["فردية مباشرة", "مرنة حسب الجدول", "مزيج من الاثنين"]],
    ["متى يناسبك التعلم؟", "time", ["بعد الظهر", "المساء", "نهاية الأسبوع"]],
  ] as const;
  const gradeOptionsByStage: Record<string, string[]> = {
    "روضة": ["المستوى الأول روضة", "المستوى الثاني روضة", "المستوى الثالث روضة"],
    "ابتدائي": ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي", "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"],
    "إعدادي": ["الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"],
    "ثانوي": ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"],
    "جامعي": ["السنة الجامعية الأولى", "السنة الجامعية الثانية", "السنة الجامعية الثالثة", "السنة الجامعية الرابعة", "دراسات عليا"],
  };
  const subjectsByStage: Record<string, string[]> = {
    "روضة": ["لغة عربية", "لغة إنجليزية", "رياضيات", "علوم", "حاسب آلي"],
    "ابتدائي": ["لغة عربية", "لغة إنجليزية", "رياضيات", "علوم", "دراسات اجتماعية", "حاسب آلي", "قرآن كريم", "تجويد"],
    "إعدادي": ["لغة عربية", "لغة إنجليزية", "رياضيات", "علوم", "دراسات اجتماعية", "حاسب آلي", "برمجة", "فقه", "أصول الدين", "قرآن كريم", "تجويد"],
    "ثانوي": ["لغة عربية", "لغة إنجليزية", "رياضيات", "فيزياء", "كيمياء", "أحياء", "جيولوجيا", "تاريخ", "جغرافيا", "فلسفة ومنطق", "علم نفس واجتماع"],
    "جامعي": ["رياضيات", "فيزياء", "كيمياء", "أحياء", "برمجة", "تكنولوجيا المعلومات", "علوم الحاسب", "لغة إنجليزية", "لغة عربية"],
  };
  const current = questions[step];
  const currentOptions =
    step === 2 ? (gradeOptionsByStage[onboarding.stage] ?? []) :
    step === 3 ? (subjectsByStage[onboarding.stage] ?? []) :
    current?.[2] ?? [];
  const completed = Math.round((getOnboardingProgress(onboarding, 9) / 100) * 9);
  const searchSubjectOptions =
    search.grade === "ابتدائي"
      ? ["لغة عربية", "لغة إنجليزية", "رياضيات", "علوم", "دراسات اجتماعية", "حاسب آلي", "قرآن كريم", "تجويد"]
      : search.grade === "إعدادي"
        ? ["لغة عربية", "لغة إنجليزية", "رياضيات", "علوم", "دراسات اجتماعية", "حاسب آلي", "برمجة", "فقه", "أصول الدين", "قرآن كريم", "تجويد"]
        : search.grade === "ثانوي"
          ? ["لغة عربية", "لغة إنجليزية", "رياضيات", "فيزياء", "كيمياء", "أحياء", "جيولوجيا", "تاريخ", "جغرافيا", "فلسفة ومنطق", "علم نفس واجتماع"]
          : search.grade === "جامعي"
            ? ["رياضيات", "فيزياء", "كيمياء", "أحياء", "برمجة", "تكنولوجيا المعلومات", "علوم الحاسب", "لغة إنجليزية", "لغة عربية"]
            : ["رياضيات", "لغة عربية", "لغة إنجليزية", "علوم", "دراسات اجتماعية", "حاسب آلي", "قرآن كريم", "تجويد", "برمجة", "فقه", "أصول الدين", "فيزياء", "كيمياء", "تكنولوجيا المعلومات", "علوم الحاسب"];

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
            <Link href="/parent-request" className="rounded-full border border-[#182431]/20 px-5 py-3 text-sm font-bold text-[#182431] hover:bg-[#182431]/5">سجّل الآن وتواصل مع مستشارك التعليمي</Link>
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
                <Sparkles className="h-4 w-4" /> مدرسين خصوصيين
              </div>
              <h1 className="max-w-2xl text-[43px] font-bold leading-[1.2] tracking-[-.04em] sm:text-6xl lg:text-[68px]">
                رحلتك نحو<br />
                <span className="relative inline-block text-[#f27600]">التفوق تبدأ من هنا!<span className="absolute -bottom-1 right-0 h-2 w-2/3 rounded-full bg-[#ffd7b5]/80" /></span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#182431]/65 sm:text-lg">
                مع مُعلّم، اختَر المدرس المناسب، وتعلّم بالطريقة التي تناسبك، وحقّق أهدافك خطوة بخطوة.
              </p>
              <div className="mt-7 grid max-w-xl gap-4 sm:grid-cols-2">
                <article className="flex items-start gap-3 rounded-2xl border border-[#182431]/[0.07] bg-white/80 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0e2] text-[#d86100]"><Sparkles className="h-5 w-5" /></span>
                  <div><h2 className="font-bold">تعلّم على مقاسك</h2><p className="mt-1 text-sm leading-6 text-[#182431]/60">خطة تعليمية تراعي مستواك واحتياجاتك وتساعدك على التقدم بثقة.</p></div>
                </article>
                <article className="flex items-start gap-3 rounded-2xl border border-[#182431]/[0.07] bg-white/80 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0e2] text-[#d86100]"><BookOpen className="h-5 w-5" /></span>
                  <div><h2 className="font-bold">حصص فردية أونلاين</h2><p className="mt-1 text-sm leading-6 text-[#182431]/60">تواصل مباشر واهتمام أكبر بأسئلتك ونقاط احتياجك.</p></div>
                </article>
                <article className="flex items-start gap-3 rounded-2xl border border-[#182431]/[0.07] bg-white/80 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0e2] text-[#d86100]"><Wallet className="h-5 w-5" /></span>
                  <div><h2 className="font-bold">اختيارات تناسب ميزانيتك</h2><p className="mt-1 text-sm leading-6 text-[#182431]/60">أسعار واضحة وباقات مرنة تساعدك على تنظيم مصروفات التعلّم.</p></div>
                </article>
                <article className="flex items-start gap-3 rounded-2xl border border-[#182431]/[0.07] bg-white/80 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0e2] text-[#d86100]"><GraduationCap className="h-5 w-5" /></span>
                  <div><h2 className="font-bold">من الروضة إلى الجامعة</h2><p className="mt-1 text-sm leading-6 text-[#182431]/60">دعم تعليمي لمختلف المراحل والتخصصات المتاحة على المنصة.</p></div>
                </article>
              </div>
              {/* Removed extra trust/marketing strip to keep the agreed hero focused on the four benefit cards. */}
            </div>

            <div className="relative mx-auto w-full max-w-[520px]">
              {/* Removed the extra floating badge not included in the agreed hero. */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-[#eee4d8] shadow-[0_25px_70px_-30px_rgba(24,36,49,.35)] sm:aspect-[1.08/1]">
                <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=85" alt="معلمة تشرح لطالبة خلال جلسة تعلم منزلية" className="absolute inset-0 h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#182431]/70 via-transparent to-transparent" />
                <div className="absolute right-5 top-5 rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#182431]">حصص فردية أونلاين</div>
                <div className="absolute bottom-5 right-5 left-5 flex items-end justify-between gap-3 text-white">
                  <div><span className="text-xs text-white/75">تعلم خطوة بخطوة</span><h2 className="mt-1 text-xl font-bold sm:text-2xl">كل حصة تقرّبك لهدفك</h2></div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ff7a00] shadow-lg"><BookOpen className="h-5 w-5" /></span>
                </div>
              </div>
              {/* Removed the extra floating badge not included in the agreed hero. */}
            </div>
          </div>

          <div id="teacher-search" className="relative z-20 mt-14 rounded-[1.75rem] border border-white bg-white p-4 shadow-[0_20px_55px_-35px_rgba(24,36,49,.38)] sm:p-5 lg:mt-20">
            <div className="mb-4 flex items-center gap-2 px-1"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff0e2] text-[#d86100]"><Search className="h-4 w-4" /></span><div><b className="block text-sm">ابدأ البحث عن معلم</b><span className="text-[11px] text-[#182431]/50">اختر ما يناسبك — ويمكنك تعديل التصفية لاحقًا</span></div></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SearchSelect label="المرحلة" value={search.grade} onChange={(grade) => setSearch((s) => ({ ...s, grade, subject: "" }))} options={["روضة", "ابتدائي", "إعدادي", "ثانوي", "جامعي"]} placeholder="كل المراحل" />
              <SearchSelect label="المادة" value={search.subject} onChange={(subject) => setSearch((s) => ({ ...s, subject }))} options={searchSubjectOptions} placeholder="اختر المادة" />
              <SearchSelect label="الدولة" value={search.country} onChange={(country) => setSearch((s) => ({ ...s, country }))} options={["مصر", "السعودية", "الإمارات", "الكويت", "الأردن", "قطر", "البحرين", "عُمان", "العراق", "فلسطين", "لبنان", "سوريا", "اليمن", "ليبيا", "السودان", "المغرب", "الجزائر", "تونس", "تركيا", "الولايات المتحدة", "المملكة المتحدة", "كندا", "أستراليا", "ألمانيا", "فرنسا", "دولة أخرى"]} placeholder="اختر الدولة" />
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
          <SectionHeading eyebrow="للطلاب وأولياء الأمور" title={<>لماذا أدرس أبنائي في منصة مُعلّم؟</>} copy="نساعدك على اختيار تجربة تعلم واضحة، ومتابعة تقدم أبنائك بثقة." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [ShieldCheck, "الضمان الذهبي", "في حال لم تناسبك الحصة الأولى فلن يتم احتسابها ويمكنك استرجاع المبلغ، وفي حال لم يناسبك المعلم سيتم تبديله فورًا."],
              [CalendarDays, "تقارير دورية", "تصلك تقارير منتظمة عن أداء الأبناء من المعلمين بعد الحصص لمتابعة التقدم أولًا بأول."],
              [BookOpen, "جميع المواد والمراحل", "توفر جميع المواد والمراحل للتعليم العام والجامعي — من الروضة وحتى الجامعة."],
              [Users, "معلمون مختارون بعناية", "أفضل المعلمين المختارين بعناية فائقة عبر مقابلات واختبارات كفاءة قبل الانضمام للمنصة."],
            ].map(([Icon, title, copy]) => {
              const BenefitIcon = Icon as typeof ShieldCheck;
              return <article key={String(title)} className="group rounded-[1.5rem] bg-[#f4efe9] p-5 transition hover:-translate-y-1 hover:bg-[#fff0e2]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#df6900] shadow-sm"><BenefitIcon className="h-5 w-5" /></span><h3 className="mt-6 text-lg font-bold">{String(title)}</h3><p className="mt-2 text-sm leading-7 text-[#182431]/65">{String(copy)}</p></article>;
            })}
          </div>
        </section>

        <section id="teachers" className="bg-[#f2ece5] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionHeading eyebrow="اختيار المعلم المناسب" title={<>ابدأ من احتياجك،<br className="hidden sm:block" /> ثم اختر بثقة.</>} copy="استكشف ملفات المعلمين المتاحة، وقارن التخصصات والمواعيد والتكلفة قبل إرسال طلبك." /><Link href="/teachers" className="mb-1 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#c35a00]">استكشف المعلمين <ArrowLeft className="h-4 w-4" /></Link></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: BookOpen, title: "حسب المادة والمرحلة", text: "حدّد ما تريد دراسته لتصل إلى الخيارات الأقرب لاحتياجك." },
                { icon: CalendarDays, title: "حسب الموعد المناسب", text: "راجع تفاصيل التوفر قبل إرسال طلب الحجز." },
                { icon: Wallet, title: "بتكلفة واضحة", text: "راجع سعر الحصة ومدتها قبل اتخاذ قرارك." },
              ].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[1.5rem] border border-[#182431]/[0.07] bg-white p-6 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e2] text-[#c35a00]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#182431]/60">{text}</p><Link href="/teachers" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#c35a00]">عرض المعلمين <ArrowLeft className="h-4 w-4" /></Link></article>)}
            </div>
          </div>
        </section>

        <section id="parents" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10 lg:py-24">
          <div><p className="mb-4 text-sm font-bold text-[#c35a00]">للطلاب وأولياء الأمور</p><h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">تعلم أوضح.<br />وطمأنينة أكبر.</h2><p className="mt-5 max-w-lg leading-8 text-[#182431]/60">ملف لكل طالب، ومتابعة للحصص القادمة والتقارير والواجبات — حتى تعرف الأسرة ما تم وما الخطوة التالية.</p><button onClick={openOnboarding} className="mt-7 rounded-full bg-[#182431] px-6 py-3.5 text-sm font-bold text-white">ابنِ ملف تعلمك <ArrowLeft className="mr-1 inline h-4 w-4" /></button></div>
          <div className="rounded-[1.75rem] bg-[#182431] p-6 text-white shadow-xl shadow-[#182431]/15 sm:p-8"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff7a00]"><GraduationCap className="h-6 w-6" /></span><div><span className="text-xs font-semibold text-white/55">مساحة تعلمك</span><h3 className="mt-1 text-xl font-bold">كل ما تحتاجه في مكان واحد</h3></div></div><div className="mt-7 space-y-4">{[{icon: CalendarDays,title:"الحصص والمواعيد",text:"تابع طلبات الحجز ومواعيد دروسك."},{icon: BookOpen,title:"ملف التعلم",text:"احتفظ بأهدافك والمواد التي تتابعها."},{icon: MessageCircle,title:"التواصل والمتابعة",text:"تابع تفاصيل الطلب والخطوة التالية."}].map(({icon: Icon,title,text})=><div key={title} className="flex items-start gap-3 rounded-2xl bg-white/[0.07] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#ffb36e]"><Icon className="h-5 w-5" /></span><div><b className="block text-sm">{title}</b><p className="mt-1 text-xs leading-6 text-white/60">{text}</p></div></div>)}</div><Link href="/portal" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff7a00] px-5 py-3 text-sm font-bold text-white">افتح مساحة حسابك <ArrowLeft className="h-4 w-4" /></Link></div>
        </section>

        <section id="tutors" className="bg-[#fff0e2] py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-7 px-5 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10"><div><p className="text-sm font-bold text-[#a84c00]">للمعلمين</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">علّم بطريقتك، ووسّع أثرك.</h2><p className="mt-3 max-w-2xl leading-7 text-[#182431]/65">أنشئ ملفك، أضف المواد والمراحل التي تدرّسها، وحدد أوقاتك المناسبة. طلبات الانضمام تخضع للمراجعة قبل الظهور في السوق.</p></div><Link href="/teacher/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7a00] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/15">قدّم كمعلم <ArrowLeft className="h-4 w-4" /></Link></div>
        </section>

        <section id="account-areas" className="border-y border-[#182431]/[0.07] bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <SectionHeading eyebrow="مساحات المنصة" title={<>كل مستخدم له مساحة<br className="hidden sm:block" /> تناسب دوره.</>} copy="ادخل إلى حسابك لمتابعة المهام والمواعيد والبيانات المخصصة لصلاحياتك. تظهر أدوات الإدارة للموظفين المخوّلين فقط." />
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: GraduationCap, title: "الطالب", text: "الحجوزات والدروس وخطوات التعلم.", href: "/portal", action: "دخول مساحة الطالب" },
                { icon: Users, title: "ولي الأمر", text: "متابعة الأبناء وطلبات الدروس من الحساب.", href: "/portal", action: "دخول حساب ولي الأمر" },
                { icon: BookOpen, title: "المعلم", text: "إدارة الملف والمواعيد وطلبات الحجز.", href: "/teacher/register", action: "مساحة المعلم" },
                { icon: ShieldCheck, title: "الإدارة", text: "إدارة المستخدمين ومراجعة طلبات الانضمام.", href: "/admin", action: "دخول الإدارة" },
              ].map(({ icon: Icon, title, text, href, action }) => (
                <article key={title} className="flex flex-col rounded-[1.5rem] border border-[#182431]/[0.08] bg-[#fbf8f4] p-5 transition hover:-translate-y-1 hover:border-[#ff7a00]/40 hover:shadow-lg hover:shadow-[#182431]/[0.05]">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0e2] text-[#c35a00]"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#182431]/60">{text}</p>
                  <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#b85400]">{action}<ArrowLeft className="h-4 w-4" /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-[#f2ece5] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <SectionHeading eyebrow="آراء أولياء الأمور" title={<>خطوات صغيرة، وثقة أكبر في رحلة التعلم.</>} copy="نماذج توضيحية لصياغة آراء أولياء الأمور. استبدليها بتقييمات حقيقية من مستخدمي المنصة قبل النشر." />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                { quote: "كنت أبحث عن طريقة أساعد بها ابني في تنظيم مذاكرته. وجود مواعيد واضحة ومعلم يتابع احتياجاته ساعدنا على جعل وقت الدراسة أكثر انتظامًا.", name: "أم يوسف", detail: "ولية أمر · نموذج توضيحي" },
                { quote: "أكثر ما أعجبني أنني أستطيع مراجعة تفاصيل المعلم وسعر الحصة قبل إرسال طلب الحجز، وأختار الموعد الذي يناسب جدول ابنتي.", name: "أبو مريم", detail: "ولي أمر · نموذج توضيحي" },
                { quote: "ابنتي كانت تحتاج إلى شرح إضافي في بعض المواد. البحث حسب المرحلة والمادة سهّل علينا مقارنة الخيارات واختيار ما يناسب احتياجها.", name: "أم ليلى", detail: "ولية أمر · نموذج توضيحي" },
              ].map(({ quote, name, detail }) => (
                <article key={name} className="flex h-full flex-col rounded-[1.5rem] border border-[#182431]/[0.07] bg-white p-6 shadow-sm">
                  <div className="flex gap-1 text-[#e87800]" aria-label="نموذج رأي"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>
                  <blockquote className="mt-5 flex-1 text-sm leading-8 text-[#182431]/75">«{quote}»</blockquote>
                  <div className="mt-6 border-t border-[#182431]/[0.08] pt-4"><p className="font-bold">{name}</p><p className="mt-1 text-xs text-[#182431]/50">{detail}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
          <SectionHeading eyebrow="قبل إرسال طلب الحجز" title="تفاصيل واضحة قبل الحجز" copy="راجع سعر الحصة ومدتها وشروط الحجز الظاهرة في ملف المعلم قبل إرسال الطلب." />
          <div className="mt-8 grid gap-4 md:grid-cols-3"><PriceInfo icon={Wallet} title="سعر ظاهر" text="يعرض ملف المعلم سعر الحصة ومدتها قبل أن تبدأ طلب الحجز." /><PriceInfo icon={CalendarDays} title="موعد يناسبك" text="تعرّف على المواعيد المتاحة، ثم أرسل طلبك لمراجعة التوفر." /><PriceInfo icon={ShieldCheck} title="بدون مفاجآت" text="بوابات الدفع واسترداد الأموال تحتاج إلى تهيئة مزود رسمي قبل الإطلاق." /></div>
        </section>

        <section id="faq" className="border-y border-[#182431]/[0.06] bg-white py-20">
          <div className="mx-auto max-w-3xl px-5"><div className="text-center"><p className="mb-3 text-sm font-bold text-[#c35a00]">الأسئلة الشائعة</p><h2 className="text-3xl font-bold sm:text-4xl">كل ما تحتاج معرفته</h2></div><div className="mt-9 space-y-3">{faqs.map((question, index) => <div key={question} className="rounded-2xl bg-[#fbf8f4] px-5"><button className="flex w-full items-center justify-between gap-4 py-5 text-right font-bold" onClick={() => setFaq(faq === index ? null : index)}>{question}<ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${faq === index ? "rotate-180" : ""}`} /></button>{faq === index && <p className="pb-5 text-sm leading-7 text-[#182431]/60">{["اختر المادة والمرحلة التعليمية، ثم قارن بين المعلمين من خلال بيانات ملفاتهم والمواعيد والأسعار المعروضة.", "راجع التخصص والمواد والمراحل والخبرة المذكورة في ملف المعلم. لا تعتمد على أي ضمان أو اعتماد إلا إذا كان ظاهرًا بوضوح في المنصة.", "اختر موعدًا متاحًا وأرسل طلب الحجز، ثم تابع حالته من حسابك. لا تعتبر الحجز مؤكدًا إلا عندما تظهر حالته مؤكدة.", "استخدم فقط وسيلة الدفع التي تظهر فعليًا داخل المنصة. لا ترسل بيانات بطاقتك أو أموالك خارج قناة دفع موثوقة، وتحقق من حالة العملية قبل اعتبارها ناجحة.", "تواصل مع دعم المنصة لشرح المشكلة. استبدال المعلم أو استرداد المبلغ ليس مضمونًا إلا إذا كانت شروط الخدمة المنشورة تنص على ذلك.", "لا تفترض أن الحصة مسجلة. التسجيل لا يكون متاحًا إلا إذا ظهر رابط تسجيل فعلي وكانت آلية التسجيل وموافقة المشاركين واضحة.", "بعد تأكيد الحجز، راجع تفاصيله بحثًا عن رابط الحصة أو تعليمات الانضمام. إذا لم تظهر، تواصل مع الدعم قبل موعد الدرس.", "راجع تفاصيل السعر وشروط الإلغاء والاسترداد قبل الدفع. لا تفترض وجود باقات شهرية أو استرداد تلقائي ما لم تكن هذه الخيارات والشروط معروضة ومفعلة داخل المنصة."][index]}</p>}</div>)}</div></div>
        </section>
      </main>

      <footer className="bg-[#182431] px-5 py-12 text-white lg:px-10"><div className="mx-auto grid max-w-7xl gap-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff7a00]"><GraduationCap className="h-5 w-5" /></span><b className="text-lg">مُعلّم</b></div><p className="mt-4 max-w-xs text-sm leading-7 text-white/55">اختر معلمك، احجز موعدك، وابدأ رحلة تعلم مصممة لك.</p><p className="mt-4 text-[10px] text-white/35">منصة مُعلّم التعليمية · مصر · © ٢٠٢٦</p></div><FooterGroup title="اكتشف" links={[["المعلمون", "/teachers"], ["كيف تعمل", "/#how"], ["الأسئلة الشائعة", "/#faq"]]} /><FooterGroup title="مجتمع مُعلّم" links={[["للطلاب", "/#parents"], ["لأولياء الأمور", "/#parents"], ["للمعلمين", "/teacher/register"]]} /><div><b className="text-sm">تواصل معنا</b><p className="mt-4 flex items-center gap-2 text-sm text-white/55"><MessageCircle className="h-4 w-4" /> لخدمة العملاء والاستفسارات</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-white/40"><Link href="/auth">حسابك</Link><Link href="/teachers">المعلمون</Link></div></div></div></footer>

      {onboardingOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#182431]/60 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-[1.75rem] bg-[#fbf8f4] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><span className="text-xs font-bold text-[#c35a00]">خطوة {Math.min(step + 1, 9)} من ٩ · ملف تعلّم مبدئي</span><h2 id="onboarding-title" className="mt-2 text-2xl font-bold">{step < 9 ? "لنجد نقطة البداية المناسبة لك" : "هذه بداية ملف تعلمك"}</h2></div><button aria-label="إغلاق" onClick={() => setOnboardingOpen(false)} className="rounded-xl p-2 hover:bg-white"><X /></button></div><div className="mt-5 h-2 rounded-full bg-[#182431]/10"><div className="h-2 rounded-full bg-[#ff7a00] transition-all" style={{ width: `${Math.min(100, (step / 9) * 100)}%` }} /></div>{step < 9 ? <><p className="mt-8 text-xl font-bold">{current[0]}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{currentOptions.map((option) => <button key={option} onClick={() => { update(current[1] as keyof Onboarding, option); setStep((value) => value + 1); }} className="rounded-2xl border border-[#182431]/10 bg-white p-4 text-right font-semibold transition hover:-translate-y-0.5 hover:border-[#ff7a00] hover:bg-[#fff4e9]">{option}</button>)}</div><div className="mt-8 flex justify-between"><button disabled={step === 0} onClick={() => setStep((value) => value - 1)} className="rounded-full border border-[#182431]/15 px-5 py-2 text-sm font-bold disabled:opacity-30">السابق</button><span className="self-center text-xs text-[#182431]/45">يمكنك العودة لتغيير إجاباتك</span></div></> : <OnboardingResult data={onboarding} onClose={() => setOnboardingOpen(false)} />}</div></div>}
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
  const teacherSearchHref = "/teachers";
  return <div className="mt-8"><div className="rounded-2xl bg-[#fff0e2] p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white"><Check /></span><div><b>اكتملت تفضيلات البحث</b><p className="mt-1 text-sm leading-6 text-[#182431]/60">راجع اختياراتك ثم انتقل إلى قائمة المعلمين. يمكنك تسجيل الدخول لحفظ بيانات حسابك ومتابعة الحجوزات.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{[data.role, data.stage, data.grade, data.subject, data.goal, data.time].filter(Boolean).map((item) => <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{item}</span>)}</div></div><div className="mt-6 rounded-2xl border border-[#182431]/10 bg-white p-5"><h3 className="font-bold">الخطوة التالية</h3><p className="mt-2 text-sm leading-7 text-[#182431]/60">انتقل إلى قائمة المعلمين المتاحة، وراجع التفاصيل قبل إرسال طلب الحجز.</p><div className="mt-5 flex flex-wrap gap-3"><Link href={teacherSearchHref} onClick={onClose} className="rounded-full bg-[#ff7a00] px-5 py-3 text-center text-sm font-bold text-white">استكشف المعلمين المطابقين</Link><button onClick={onClose} className="rounded-full border border-[#182431]/15 px-5 py-3 text-sm font-bold">إغلاق</button></div></div></div>;
}
