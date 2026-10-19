
import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Menu,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
  Clock,
  Laptop,
} from "lucide-react";

const ORANGE = "#f27600";

const subjects = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "الدراسات الاجتماعية",
  "القرآن الكريم",
  "البرمجة",
];

const features = [
  {
    icon: ShieldCheck,
    title: "اختيار المعلم المناسب",
    text: "تعرّف على بيانات المعلمين وتخصصاتهم قبل حجز الدرس.",
  },
  {
    icon: Clock,
    title: "مواعيد تناسبك",
    text: "اختر الوقت المناسب لك وفقًا للمواعيد المتاحة.",
  },
  {
    icon: Laptop,
    title: "تعلم أونلاين",
    text: "تابع دروسك من المنزل من خلال تجربة تعليمية سهلة.",
  },
  {
    icon: Users,
    title: "متابعة الحجز",
    text: "تابع تفاصيل حجوزاتك ومواعيد دروسك من حسابك.",
  },
];

const faqs = [
  {
    q: "كيف أبحث عن معلم؟",
    a: "اختر المادة والمرحلة الدراسية، ثم استعرض المعلمين المتاحين واختر المعلم المناسب.",
  },
  {
    q: "هل يمكنني اختيار موعد الدرس؟",
    a: "يمكنك اختيار موعد من المواعيد المتاحة لدى المعلم أثناء عملية الحجز.",
  },
  {
    q: "كيف أنضم إلى المنصة كمعلم؟",
    a: "أنشئ حسابًا للمعلم واستكمل بياناتك التعليمية، ثم اتبع خطوات التحقق الظاهرة في حسابك.",
  },
  {
    q: "كيف أتابع حجوزاتي؟",
    a: "سجّل الدخول إلى حسابك للوصول إلى الحجوزات وتفاصيل مواعيد الدروس.",
  },
];

export default function Home() {
  const [subject, setSubject] = useState("");
  const [stage, setStage] = useState("");
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function searchTeachers() {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (stage) params.set("stage", stage);

    window.location.href = `/teachers${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[#fbf8f4] text-[#182431]"
      style={{ fontFamily: "Cairo, Tahoma, sans-serif" }}
    >
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-[#fbf8f4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f27600] text-white">
              <GraduationCap size={26} />
            </span>
            <span className="text-xl font-black">
              مُعلّم<span className="text-[#f27600]">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold md:flex">
            <a href="#how" className="transition hover:text-[#f27600]">
              كيف تعمل المنصة؟
            </a>
            <Link href="/teachers" className="transition hover:text-[#f27600]">
              المعلمون
            </Link>
            <a href="#parents" className="transition hover:text-[#f27600]">
              لأولياء الأمور
            </a>
            <a href="#join" className="transition hover:text-[#f27600]">
              للمعلمين
            </a>
            <a href="#faq" className="transition hover:text-[#f27600]">
              الأسئلة الشائعة
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-3 text-sm font-extrabold hover:bg-orange-50"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#f27600] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700"
            >
              ابدأ الآن
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            className="rounded-xl p-2 hover:bg-orange-50 md:hidden"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <nav className="grid gap-1 border-t border-orange-100 p-4 md:hidden">
            <a href="#how" onClick={() => setMenuOpen(false)} className="rounded-xl p-3 hover:bg-orange-50">كيف تعمل المنصة؟</a>
            <Link href="/teachers" onClick={() => setMenuOpen(false)} className="rounded-xl p-3 hover:bg-orange-50">المعلمون</Link>
            <a href="#parents" onClick={() => setMenuOpen(false)} className="rounded-xl p-3 hover:bg-orange-50">لأولياء الأمور</a>
            <a href="#join" onClick={() => setMenuOpen(false)} className="rounded-xl p-3 hover:bg-orange-50">للمعلمين</a>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-xl p-3 hover:bg-orange-50">تسجيل الدخول</Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-xl bg-[#f27600] p-3 text-center font-bold text-white">إنشاء حساب</Link>
          </nav>
        )}
      </header>

      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-extrabold text-[#d96300]">
              <Star size={16} fill="currentColor" />
              تعليم على مقاسك
            </span>

            <h1 className="max-w-2xl text-4xl font-black leading-[1.5] sm:text-5xl lg:text-6xl">
              رحلتك نحو
              <span className="relative mx-2 inline-block text-[#f27600]">
                التفوق
              </span>
              تبدأ من هنا!
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-9 text-slate-600">
              اكتشف المعلم المناسب لك، واختر المادة والموعد الذي يناسبك،
              وابدأ رحلتك التعليمية بخطوات بسيطة.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#search"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f27600] px-6 py-4 font-extrabold text-white shadow-xl shadow-orange-200 transition hover:-translate-y-1 hover:bg-orange-700"
              >
                ابحث عن معلم <ArrowLeft size={19} />
              </a>
              <Link
                href="/register"
                className="rounded-2xl border border-orange-200 bg-white px-6 py-4 font-extrabold transition hover:border-[#f27600]"
              >
                انضم كمعلم
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="text-[#f27600]" size={18} />
                مواد ومراحل متنوعة
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="text-[#f27600]" size={18} />
                حجز ومتابعة سهلة
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[3rem] bg-orange-100/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=85"
                alt="طلاب يتعلمون داخل فصل دراسي"
                className="h-[320px] w-full object-cover sm:h-[440px]"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-[#f27600]">
                    <BookOpen size={25} />
                  </span>
                  <div>
                    <p className="font-black">خطوتك الأولى نحو النجاح</p>
                    <p className="mt-1 text-sm text-slate-500">
                      ابحث، اختر، واحجز درسك
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="search" className="px-4 pb-14">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-100/60 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black">ابحث عن معلمك</h2>
            <p className="mt-2 text-slate-500">
              اختر المادة والمرحلة للوصول إلى المعلمين المناسبين.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">المادة الدراسية</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbf8f4] px-4 py-4 outline-none focus:border-[#f27600]"
              >
                <option value="">جميع المواد</option>
                {subjects.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">المرحلة الدراسية</span>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbf8f4] px-4 py-4 outline-none focus:border-[#f27600]"
              >
                <option value="">جميع المراحل</option>
                <option value="ابتدائي">ابتدائي</option>
                <option value="إعدادي">إعدادي</option>
                <option value="ثانوي">ثانوي</option>
                <option value="جامعي">جامعي</option>
              </select>
            </label>

            <button
              type="button"
              disabled={searching}
              onClick={() => {
                setSearching(true);
                searchTeachers();
              }}
              className="mt-auto flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#f27600] px-7 font-extrabold text-white transition hover:bg-orange-700 disabled:opacity-60"
            >
              <Search size={20} />
              ابحث الآن
            </button>
          </div>
        </div>
      </section>

      <section id="how" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="font-extrabold text-[#f27600]">لماذا مُعلّم؟</span>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              تجربة تعليمية أسهل لك ولأسرتك
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              أدوات واضحة تساعدك على العثور على المعلم ومتابعة مواعيد الدروس.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-3xl border border-orange-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100"
              >
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-[#f27600]">
                  <Icon size={28} />
                </span>
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-3 leading-8 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="parents" className="bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="font-extrabold text-[#f27600]">لأولياء الأمور والطلاب</span>
            <h2 className="mt-3 text-3xl font-black leading-relaxed sm:text-4xl">
              وقت أقل في البحث،
              <span className="text-[#f27600]"> واهتمام أكبر بالتعلم</span>
            </h2>
            <p className="mt-4 leading-9 text-slate-600">
              استعرض المعلمين، قارن التخصصات والمواعيد المتاحة، ثم تابع حجوزاتك
              من خلال حسابك.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                "استعراض المعلمين حسب المادة والمرحلة",
                "اختيار المواعيد المتاحة للحجز",
                "متابعة تفاصيل الحجز من حسابك",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 font-bold">
                  <CheckCircle2 className="shrink-0 text-[#f27600]" size={21} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/teachers"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#f27600] px-6 py-4 font-extrabold text-white hover:bg-orange-700"
            >
              استكشف المعلمين <ArrowLeft size={19} />
            </Link>
          </div>

          <div className="rounded-[2rem] bg-[#fbf0e4] p-6 sm:p-10">
            <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-[#f27600]">
                  <GraduationCap size={30} />
                </div>
                <div>
                  <h3 className="text-xl font-black">ابدأ من هنا</h3>
                  <p className="mt-1 text-sm text-slate-500">خطوات بسيطة للتعلم</p>
                </div>
              </div>
              <div className="mt-8 space-y-6">
                {[
                  ["01", "ابحث عن المعلم", "حدد المادة والمرحلة الدراسية."],
                  ["02", "اختر الموعد", "راجع المواعيد المتاحة لدى المعلم."],
                  ["03", "تابع حجزك", "ارجع إلى حسابك لمعرفة التفاصيل."],
                ].map(([number, title, text]) => (
                  <div key={number} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f27600] font-black text-white">
                      {number}
                    </span>
                    <div>
                      <h4 className="font-black">{title}</h4>
                      <p className="mt-1 text-sm leading-7 text-slate-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="join" className="px-4 py-16 sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-[2rem] bg-[#182431] p-7 text-white sm:p-12 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <span className="font-extrabold text-orange-400">للمعلمين</span>
            <h2 className="mt-3 text-3xl font-black leading-relaxed sm:text-4xl">
              شارك خبرتك ووصل إلى طلاب جدد
            </h2>
            <p className="mt-4 leading-8 text-slate-300">
              أنشئ حسابك، أضف بياناتك وتخصصاتك، وتابع طلبات الحجز من خلال المنصة.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#f27600] px-7 py-4 font-extrabold text-white transition hover:bg-orange-600"
          >
            انضم إلى مُعلّم <ArrowLeft size={19} />
          </Link>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <span className="font-extrabold text-[#f27600]">آراء المستخدمين</span>
          <h2 className="mt-3 text-3xl font-black">تجربة تعليمية تتمحور حول احتياجاتك</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-600">
            نعمل على جعل البحث عن المعلمين وحجز الدروس ومتابعتها أكثر سهولة ووضوحًا.
          </p>
          <div className="mt-8 grid gap-5 text-right sm:grid-cols-2">
            <article className="rounded-3xl border border-orange-100 bg-[#fbf8f4] p-6">
              <div className="mb-4 flex gap-1 text-[#f27600]">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={17} />)}
              </div>
              <p className="leading-8 text-slate-700">
                «سهولة الوصول إلى معلومات المعلم والمواعيد تساعد الأسرة على تنظيم الدروس.»
              </p>
              <p className="mt-4 font-black">ولي أمر</p>
            </article>
            <article className="rounded-3xl border border-orange-100 bg-[#fbf8f4] p-6">
              <div className="mb-4 flex gap-1 text-[#f27600]">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={17} />)}
              </div>
              <p className="leading-8 text-slate-700">
                «وجود المواعيد والحجوزات في مكان واحد يجعل متابعة الدروس أكثر تنظيمًا.»
              </p>
              <p className="mt-4 font-black">طالب</p>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <span className="font-extrabold text-[#f27600]">هل لديك سؤال؟</span>
            <h2 className="mt-3 text-3xl font-black">الأسئلة الشائعة</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <article key={faq.q} className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-right font-extrabold"
                >
                  <span>{faq.q}</span>
                  <span className="text-xl text-[#f27600]">{openFaq === index ? "−" : "+"}</span>
                </button>
                {openFaq === index && (
                  <p className="border-t border-orange-50 px-5 py-4 leading-8 text-slate-600">
                    {faq.a}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#182431] px-4 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-2xl font-black">
            مُعلّم<span className="text-orange-400">.</span>
          </Link>
          <p className="text-sm leading-7 text-slate-300">
            منصة تساعد الطلاب وأولياء الأمور على الوصول إلى المعلمين.
          </p>
          <div className="flex flex-wrap gap-5 text-sm font-bold text-slate-300">
            <Link href="/teachers" className="hover:text-orange-400">المعلمون</Link>
            <Link href="/login" className="hover:text-orange-400">تسجيل الدخول</Link>
            <Link href="/register" className="hover:text-orange-400">إنشاء حساب</Link>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} مُعلّم. جميع الحقوق محفوظة.
        </div>
      </footer>
    </main>
  );
}
