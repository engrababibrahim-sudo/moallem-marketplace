<SearchSelect label="المرحلة" value={search.grade} onChange={(grade) => setSearch((s) => ({ ...s, grade }))} options={["ابتدائي", "إعدادي", "ثانوي", "جامعي"]} placeholder="كل المراحل" />
              <SearchSelect label="المادة" value={search.subject} onChange={(subject) => setSearch((s) => ({ ...s, subject }))} options={["رياضيات", "لغة عربية", "لغة إنجليزية", "فيزياء", "كيمياء", "علوم", "برمجة", "تكنولوجيا المعلومات", "علوم الحاسب"]} placeholder="اختر المادة" />
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
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionHeading eyebrow="اختيار المعلم المناسب" title={<>ابدأ من احتياجك،<br className="hidden sm:block" /> ثم اختر بثقة.</>} copy="استكشف ملفات المعلمين المتاحة، وقارن التخصصات والمواعيد والتكلفة قبل إرسال طلبك." /><Link href={teacherSearchHref} className="mb-1 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#c35a00]">استكشف المعلمين <ArrowLeft className="h-4 w-4" /></Link></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: BookOpen, title: "حسب المادة والمرحلة", text: "حدّد ما تريد دراسته لتصل إلى الخيارات الأقرب لاحتياجك." },
                { icon: CalendarDays, title: "حسب الموعد المناسب", text: "راجع تفاصيل التوفر قبل إرسال طلب الحجز." },
                { icon: Wallet, title: "بتكلفة واضحة", text: "راجع سعر الحصة ومدتها قبل اتخاذ قرارك." },
              ].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[1.5rem] border border-[#182431]/[0.07] bg-white p-6 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e2] text-[#c35a00]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#182431]/60">{text}</p><Link href={teacherSearchHref} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#c35a00]">عرض المعلمين <ArrowLeft className="h-4 w-4" /></Link></article>)}
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

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
          <SectionHeading eyebrow="الوضوح من البداية" title="تفاصيل واضحة قبل الحجز" copy="راجع سعر الحصة ومدتها وشروط الحجز الظاهرة في ملف المعلم قبل إرسال الطلب." />
          <div className="mt-8 grid gap-4 md:grid-cols-3"><PriceInfo icon={Wallet} title="سعر ظاهر" text="يعرض ملف المعلم سعر الحصة ومدتها قبل أن تبدأ طلب الحجز." /><PriceInfo icon={CalendarDays} title="موعد يناسبك" text="تعرّف على المواعيد المتاحة، ثم أرسل طلبك لمراجعة التوفر." /><PriceInfo icon={ShieldCheck} title="بدون مفاجآت" text="بوابات الدفع واسترداد الأموال تحتاج إلى تهيئة مزود رسمي قبل الإطلاق." /></div>
        </section>

        <section id="faq" className="border-y border-[#182431]/[0.06] bg-white py-20">
          <div className="mx-auto max-w-3xl px-5"><div className="text-center"><p className="mb-3 text-sm font-bold text-[#c35a00]">الأسئلة الشائعة</p><h2 className="text-3xl font-bold sm:text-4xl">كل ما تحتاج معرفته</h2></div><div className="mt-9 space-y-3">{faqs.map((question, index) => <div key={question} className="rounded-2xl bg-[#fbf8f4] px-5"><button className="flex w-full items-center justify-between gap-4 py-5 text-right font-bold" onClick={() => setFaq(faq === index ? null : index)}>{question}<ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${faq === index ? "rotate-180" : ""}`} /></button>{faq === index && <p className="pb-5 text-sm leading-7 text-[#182431]/60">{["ابدأ بتحديد المادة والمرحلة، ثم راجع خبرة المعلم وطريقة تدريسه والتوفر والسعر قبل إرسال طلب الحجز.", "يمكنك استخدام حساب ولي الأمر لمتابعة ملفات الأبناء وطلبات الحجز المرتبطة بالحساب، وفق الصلاحيات المتاحة.", "اختر المعلم والموعد المتاح، ثم أرسل طلب الحجز وتابع حالته من مساحة حسابك.", "يعرض ملف المعلم السعر ومدة الحصة المتاحة. راجع التفاصيل قبل تأكيد طلبك."][index]}</p>}</div>)}</div></div>
        </section>
      </main>

      <footer className="bg-[#182431] px-5 py-12 text-white lg:px-10"><div className="mx-auto grid max-w-7xl gap-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff7a00]"><GraduationCap className="h-5 w-5" /></span><b className="text-lg">مُعلّم</b></div><p className="mt-4 max-w-xs text-sm leading-7 text-white/55">اختر معلمك، احجز موعدك، وابدأ رحلة تعلم مصممة لك.</p><p className="mt-4 text-[10px] text-white/35">منصة مُعلّم التعليمية · مصر · © ٢٠٢٦</p></div><FooterGroup title="اكتشف" links={[["المعلمون", "/teachers"], ["كيف تعمل", "#how"], ["الأسئلة الشائعة", "#faq"]]} /><FooterGroup title="مجتمع مُعلّم" links={[["للطلاب", "#parents"], ["لأولياء الأمور", "#parents"], ["للمعلمين", "/teacher/register"]]} /><div><b className="text-sm">تواصل معنا</b><p className="mt-4 flex items-center gap-2 text-sm text-white/55"><MessageCircle className="h-4 w-4" /> لخدمة العملاء والاستفسارات</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-white/40"><Link href="/auth">حسابك</Link><Link href={teacherSearchHref}>المعلمون</Link></div></div></div></footer>

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

  return <div className="mt-8"><div className="rounded-2xl bg-[#fff0e2] p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white"><Check /></span><div><b>تم تسجيل تفضيلاتك</b><p className="mt-1 text-sm leading-6 text-[#182431]/60">{me.data ? (save.isSuccess ? "حُفظت تفضيلات التعلم في حسابك." : "جارٍ حفظ تفضيلات التعلم…") : "سجّل الدخول لحفظ تفضيلاتك ومتابعتها من حسابك."}</p></div></div><div className="mt-4 flex flex-wrap gap-2">{[data.role, data.stage, data.grade, data.subject, data.goal, data.time].filter(Boolean).map((item) => <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{item}</span>)}</div></div><div className="mt-6 rounded-2xl border border-[#182431]/10 bg-white p-5"><h3 className="font-bold">الخطوة التالية</h3><p className="mt-2 text-sm leading-7 text-[#182431]/60">انتقل إلى قائمة المعلمين المتاحة، وراجع التفاصيل قبل إرسال طلب الحجز.</p><div className="mt-5 flex flex-wrap gap-3"><Link href={teacherSearchHref} onClick={onClose} className="rounded-full bg-[#ff7a00] px-5 py-3 text-center text-sm font-bold text-white">استكشف المعلمين</Link><button onClick={onClose} className="rounded-full border border-[#182431]/15 px-5 py-3 text-sm font-bold">إغلاق</button></div></div></div>;
}

// Explicit default export required by client/src/App.tsx
export default Home;
