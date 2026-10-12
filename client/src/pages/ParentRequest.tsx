import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Send } from "lucide-react";
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
      setError("اختاري مرحلة دراسية ومادة واحدة على الأقل.");
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

  return <main dir="rtl" className="min-h-screen bg-background px-4 py-12 text-foreground">
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm text-primary hover:underline">العودة إلى مُعلّم</Link>
      <div className="mt-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-9">
        {sent ? <div className="py-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold">تم استلام طلبك</h1>
          <p className="mt-3 text-muted-foreground">شكرًا لثقتك في مُعلّم. سيتواصل معك فريقنا لمساعدتك في اختيار المعلم المناسب.</p>
          <Link href="/" className="mt-6 inline-block text-primary hover:underline">العودة للرئيسية</Link>
        </div> : <>
          <span className="text-sm font-semibold text-primary">مُعلّم · لكل مكان</span>
          <h1 className="mt-3 text-3xl font-bold">دعنا نساعدك في اختيار المعلم المناسب</h1>
          <p className="mt-3 leading-7 text-muted-foreground">املأ البيانات التالية وسيتواصل معك فريق مُعلّم لمساعدتك في بناء خطة تعليمية تناسب احتياجات أبنائك، أينما كنت.</p>
          <form onSubmit={submit} className="mt-8 space-y-6">
            <label className="block space-y-2"><span className="text-sm font-medium">اسم ولي الأمر أو الطالب *</span>
              <input required maxLength={120} value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-3" placeholder="الاسم الكامل" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2"><span className="text-sm font-medium">الدولة *</span>
                <select required value={country} onChange={e => { setCountry(e.target.value); setDialCode(countryCodes.find(c => c[0] === e.target.value)?.[1] ?? ""); }} className="w-full rounded-xl border bg-background px-4 py-3">
                  {countryCodes.map(c => <option key={c[0]} value={c[0]}>{c[0]} {c[1]}</option>)}
                </select>
              </label>
              <label className="block space-y-2"><span className="text-sm font-medium">مفتاح الدولة *</span>
                <select value={dialCode} onChange={e => setDialCode(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-3">
                  {countryCodes.filter(c => c[1]).map(c => <option key={c[0]} value={c[1]}>{c[0]} ({c[1]})</option>)}
                  <option value="">سأدخل المفتاح يدويًا</option>
                </select>
              </label>
            </div>
            <label className="block space-y-2"><span className="text-sm font-medium">رقم الهاتف *</span>
              <div className="flex gap-2" dir="ltr">
                <span className="flex items-center rounded-xl border bg-muted px-3">{dialCode || "+"}</span>
                <input required type="tel" inputMode="tel" autoComplete="tel-national" maxLength={24} value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d\s()-]/g, ""))} className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3" placeholder="رقم الهاتف بدون مفتاح الدولة" />
              </div>
            </label>
            <fieldset className="space-y-3"><legend className="text-sm font-semibold">المرحلة الدراسية * (يمكن اختيار أكثر من مرحلة)</legend>
              <div className="grid gap-3 sm:grid-cols-2">{stages.map(s => <label key={s} className="flex items-center gap-3 rounded-xl border p-3"><input type="checkbox" checked={stage.includes(s)} onChange={() => toggle(stage,s,setStage)} />{s}</label>)}</div>
            </fieldset>
            <fieldset className="space-y-3"><legend className="text-sm font-semibold">المواد الدراسية * (يمكن اختيار أكثر من مادة)</legend>
              <div className="grid gap-3 sm:grid-cols-2">{subjects.map(s => <label key={s} className="flex items-center gap-3 rounded-xl border p-3"><input type="checkbox" checked={subject.includes(s)} onChange={() => toggle(subject,s,setSubject)} />{s}</label>)}</div>
            </fieldset>
            <label className="block space-y-2"><span className="text-sm font-medium">ملاحظات إضافية (اختياري)</span>
              <textarea rows={3} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-3" placeholder="أخبرنا باحتياجات الطالب أو الصف الدراسي" />
            </label>
            {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "جارٍ إرسال الطلب..." : "إرسال الطلب"} <Send className="h-4 w-4" /></button>
            <p className="text-xs leading-6 text-muted-foreground">بإرسال النموذج، توافق على استخدام بياناتك للتواصل معك بخصوص طلبك التعليمي.</p>
          </form>
        </>}
      </div>
    </div>
  </main>;
}
