import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Send, UserRound, Globe2, Phone, BookOpen, GraduationCap, NotebookText, ArrowRight, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";

const stages = ["الروضة", "الابتدائي", "الإعدادي", "الثانوي", "الجامعة"];
const subjects = ["لغة عربية", "لغة إنجليزية", "رياضيات", "علوم", "دراسات اجتماعية", "فيزياء", "كيمياء", "أخرى"];
const countryCodes = [
  ["مصر", "+20"], ["السعودية", "+966"], ["الإمارات", "+971"], ["الكويت", "+965"],
  ["قطر", "+974"], ["البحرين", "+973"], ["عُمان", "+968"], ["الأردن", "+962"],
  ["المغرب", "+212"], ["الجزائر", "+213"], ["تونس", "+216"], ["العراق", "+964"],
  ["تركيا", "+90"], ["الولايات المتحدة", "+1"], ["المملكة المتحدة", "+44"],
  ["كندا", "+1"], ["أستراليا", "+61"], ["ألمانيا", "+49"], ["فرنسا", "+33"],
  ["دولة أخرى", ""],
] as const;

export default function ParentRequest() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("مصر");
  const [dialCode, setDialCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<string[]>([]);
  const [subject, setSubject] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const toggle = (list: string[], value: string, setter: (next: string[]) => void) =>
    setter(list.includes(value) ? list.filter(item => item !== value) : [...list, value]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!stage.length || !subject.length) {
      setError("اختَر مرحلة دراسية ومادة واحدة على الأقل.");
      return;
    }
    setBusy(true);
    const { error: saveError } = await supabase.from("parent_requests").insert({
      parent_name: name.trim(),
      country,
      phone: phone.trim(),
      dial_code: dialCode,
      stages: stage,
      subjects: subject,
      notes: notes.trim() || null,
      status: "new",
    });
    setBusy(false);
    if (saveError) {
      setError("تعذر إرسال الطلب الآن. يرجى المحاولة لاحقًا أو التواصل مع إدارة مُعلّم.");
      return;
    }
    setSent(true);
  }

  const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";
  const labelClass = "mb-2 block text-sm font-bold text-[#18365c]";
  const optionClass = "flex min-h-[54px] cursor-pointer items-center gap-3 rounded-xl border border-orange-100 bg-gradient-to-l from-orange-50/70 to-white px-3 py-3 text-sm font-medium text-[#24436a] transition hover:border-orange-300 hover:bg-orange-50 has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50 has-[:checked]:text-orange-700";

  return <main dir="rtl" className="min-h-screen bg-[#fffaf5] text-slate-800">
    <header className="border-b border-orange-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 transition hover:text-orange-700"><ArrowRight className="h-4 w-4"/>العودة إلى مُعلّم</Link>
        <Link href="/" className="flex items-center gap-2 text-[#153968]">
          <span className="text-right"><b className="block text-2xl font-black leading-none">مُعلّم</b><span className="mt-1 block text-xs font-semibold text-orange-600">لكل مكان</span></span>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-200"><GraduationCap className="h-7 w-7"/></span>
        </Link>
      </div>
    </header>

    <section className="relative overflow-hidden border-b border-orange-100 bg-gradient-to-l from-[#fff0df] via-[#fff8ef] to-[#fff4e8]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-200/30 blur-3xl"/>
      <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl"/>
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 text-center sm:px-6 sm:py-14 md:grid-cols-[1fr_auto_1fr] md:text-right">
        <div className="hidden items-center justify-center md:flex"><div className="relative grid h-36 w-36 place-items-center rounded-[2.5rem] bg-white/80 shadow-sm ring-1 ring-orange-100"><BookOpen className="h-20 w-20 text-orange-500"/><span className="absolute -bottom-2 -left-2 rounded-xl bg-orange-500 p-2 text-white shadow"><NotebookText className="h-5 w-5"/></span></div></div>
        <div className="mx-auto max-w-xl md:mx-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-orange-700"><Globe className="h-3.5 w-3.5"/>مُعلّم · لكل مكان</span>
          <h1 className="mt-4 text-3xl font-black leading-tight text-[#153968] sm:text-4xl">دعنا نساعدك في اختيار <span className="text-orange-600">المعلم المناسب</span></h1>
          <p className="mt-4 text-sm leading-7 text-[#526985] sm:text-base">املأ البيانات التالية وسيتواصل معك فريق مُعلّم لمساعدتك في بناء خطة تعليمية تناسب احتياجاتك، أينما كنت.</p>
        </div>
        <div className="hidden items-center justify-center md:flex"><div className="relative grid h-36 w-36 place-items-center rounded-full bg-white/80 shadow-sm ring-1 ring-orange-100"><Globe2 className="h-24 w-24 text-orange-500"/><span className="absolute -right-1 top-2 rounded-full bg-amber-300 p-2 text-orange-800"><Send className="h-4 w-4"/></span></div></div>
      </div>
    </section>

    <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-[0_16px_50px_rgba(180,83,9,0.08)]">
        {sent ? <div className="px-6 py-16 text-center sm:px-10">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
          <h2 className="text-2xl font-black text-[#153968]">تم استلام طلبك</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">شكرًا لثقتك في مُعلّم. سيتواصل معك فريقنا لمساعدتك في اختيار المعلم المناسب.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600">العودة للرئيسية</Link>
        </div> : <>
          <div className="border-b border-orange-100 px-5 py-5 sm:px-8">
            <h2 className="text-lg font-black text-[#153968]">بيانات طلبك</h2>
            <p className="mt-1 text-sm text-slate-500">الحقول التي تحمل علامة * مطلوبة لإرسال الطلب.</p>
          </div>
          <form onSubmit={submit} className="space-y-6 p-5 sm:p-8">
            <label className="block"><span className={labelClass}>الاسم <span className="text-red-500">*</span></span>
              <span className="relative block"><UserRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-500"/><input required maxLength={120} value={name} onChange={e => setName(e.target.value)} className={fieldClass+" pr-12"} placeholder="أدخل الاسم الكامل" autoComplete="name"/></span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={labelClass}>الدولة <span className="text-red-500">*</span></span>
                <span className="relative block"><Globe2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-500"/><select required value={country} onChange={e => { setCountry(e.target.value); setDialCode(countryCodes.find(c => c[0] === e.target.value)?.[1] ?? ""); }} className={fieldClass+" pr-12"}>
                  {countryCodes.map(c => <option key={c[0]} value={c[0]}>{c[0]} {c[1]}</option>)}
                </select></span>
              </label>
              <label className="block"><span className={labelClass}>مفتاح الدولة <span className="text-red-500">*</span></span>
                <select value={dialCode} onChange={e => setDialCode(e.target.value)} className={fieldClass}>
                  {countryCodes.filter(c => c[1]).map(c => <option key={c[0]} value={c[1]}>{c[0]} ({c[1]})</option>)}
                  <option value="">سأدخل المفتاح يدويًا</option>
                </select>
              </label>
            </div>

            <label className="block"><span className={labelClass}>رقم الهاتف <span className="text-red-500">*</span></span>
              <div className="flex gap-2" dir="ltr">
                <span className="flex min-w-20 items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 text-sm font-bold text-orange-700"><Phone className="h-4 w-4"/>{dialCode || "+"}</span>
                <input required type="tel" inputMode="tel" autoComplete="tel-national" maxLength={24} value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d\s()-]/g, ""))} className={fieldClass+" min-w-0 flex-1"} placeholder="أدخل رقم الهاتف"/>
              </div>
            </label>

            <fieldset className="space-y-3"><legend className={labelClass}>المرحلة الدراسية <span className="text-red-500">*</span><span className="mt-1 block text-xs font-normal text-slate-500">(يمكن اختيار أكثر من مرحلة)</span></legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{stages.map(s => <label key={s} className={optionClass}><input className="h-4 w-4 accent-orange-500" type="checkbox" checked={stage.includes(s)} onChange={() => toggle(stage,s,setStage)}/><GraduationCap className="h-5 w-5 text-orange-500"/><span>{s}</span></label>)}</div>
            </fieldset>

            <fieldset className="space-y-3"><legend className={labelClass}>المواد الدراسية <span className="text-red-500">*</span><span className="mt-1 block text-xs font-normal text-slate-500">(يمكن اختيار أكثر من مادة)</span></legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{subjects.map(s => <label key={s} className={optionClass}><input className="h-4 w-4 accent-orange-500" type="checkbox" checked={subject.includes(s)} onChange={() => toggle(subject,s,setSubject)}/><BookOpen className="h-5 w-5 text-orange-500"/><span>{s}</span></label>)}</div>
            </fieldset>

            <label className="block"><span className={labelClass}><span className="inline-flex items-center gap-2"><NotebookText className="h-4 w-4 text-orange-500"/>ملاحظات إضافية <span className="font-normal text-slate-500">(اختياري)</span></span></span>
              <textarea rows={4} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} className={fieldClass+" resize-y"} placeholder="اكتب أي ملاحظات إضافية هنا..."/>
            </label>

            {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "جارٍ إرسال الطلب..." : "إرسال الطلب"} <Send className="h-4 w-4"/></button>
            <p className="flex items-start justify-center gap-2 text-center text-xs leading-6 text-slate-500"><span className="mt-1 text-orange-500">ⓘ</span>بإرسال النموذج، توافق على استخدام بياناتك للتواصل معك بخصوص طلبك التعليمي.</p>
          </form>
        </>}
      </div>
    </div>
  </main>;
}
