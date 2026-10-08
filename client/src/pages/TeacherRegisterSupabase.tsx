import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, GraduationCap, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const countries = ["مصر","السعودية","الإمارات","الكويت","قطر","البحرين","عُمان","الأردن","المغرب","الجزائر","تونس","الولايات المتحدة","المملكة المتحدة","كندا","أستراليا","تركيا"];

const currencies = [
  ["EGP","جنيه مصري (EGP)"],["SAR","ريال سعودي (SAR)"],["AED","درهم إماراتي (AED)"],["KWD","دينار كويتي (KWD)"],
  ["QAR","ريال قطري (QAR)"],["BHD","دينار بحريني (BHD)"],["OMR","ريال عُماني (OMR)"],["USD","دولار أمريكي (USD)"],
  ["EUR","يورو (EUR)"],["GBP","جنيه إسترليني (GBP)"],["CAD","دولار كندي (CAD)"],["AUD","دولار أسترالي (AUD)"],
  ["TRY","ليرة تركية (TRY)"],["JOD","دينار أردني (JOD)"],["MAD","درهم مغربي (MAD)"],["DZD","دينار جزائري (DZD)"],["TND","دينار تونسي (TND)"],
] as const;

const fields = [
  ["full_name","الاسم الكامل"],["phone","رقم الهاتف"],["city","المدينة"],["country","الدولة"],
  ["qualification","المؤهل"],["specialization","التخصص"],["subjects","المواد التي تدرّسها (بفواصل)"],
  ["education_stages","المراحل التعليمية (بفواصل)"],["grades","الصفوف (بفواصل)"],
  ["teaching_format","صيغة التدريس"],["years_experience","سنوات الخبرة"],["hourly_rate","السعر بالساعة"],["currency","العملة"],
] as const;

export default function TeacherRegisterSupabase() {
  const { user, profile, loading } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    full_name:"", phone:"", city:"", country:"مصر", qualification:"", specialization:"",
    subjects:"", education_stages:"", grades:"", teaching_format:"", years_experience:"0",
    hourly_rate:"", currency:"EGP", bio:"",
  });
  const [status, setStatus] = useState<"idle"|"saving"|"submitting">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) { navigate("/auth"); return; }
    if (profile && profile.role !== "teacher" && !["admin","super_admin"].includes(profile.role)) {
      setError("هذه الصفحة مخصصة للمعلمين.");
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("teacher_profiles")
      .select("bio,qualification,specialization,years_experience,subjects,education_stages,grades,teaching_format,hourly_rate,currency,verification_status,rejection_reason")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm(f => ({
          ...f,
          country: profile?.country ?? "مصر",
          currency: data.currency ?? "EGP",
          bio: data.bio ?? "",
          qualification: data.qualification ?? "",
          specialization: data.specialization ?? "",
          years_experience: String(data.years_experience ?? 0),
          subjects: (data.subjects ?? []).join(", "),
          education_stages: (data.education_stages ?? []).join(", "),
          grades: (data.grades ?? []).join(", "),
          teaching_format: data.teaching_format ?? "",
          hourly_rate: data.hourly_rate == null ? "" : String(data.hourly_rate),
        }));
        if (data.verification_status === "approved") setMessage("تم اعتماد ملفك. سيظهر للطلاب في سوق المعلمين.");
        if (data.verification_status === "pending") setMessage("تم إرسال ملفك للمراجعة. لا يظهر الملف في السوق قبل الاعتماد.");
        if (data.verification_status === "rejected" && data.rejection_reason) setMessage("ملاحظات المراجعة: " + data.rejection_reason);
      });
  }, [user, profile?.country]);

  if (loading) return <div dir="rtl" className="grid min-h-screen place-items-center bg-[#fbf8f4]">جارٍ التحميل...</div>;
  if (!user) return null;
  if (error) return <div dir="rtl" className="grid min-h-screen place-items-center bg-[#fbf8f4] p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-sm"><p className="font-bold text-red-600">{error}</p><Link href="/" className="mt-5 inline-block rounded-full bg-[#182431] px-6 py-3 text-sm font-bold text-white">الرئيسية</Link></div></div>;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setStatus("saving");

    const { error: profileError } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
    }).eq("id", user.id);

    if (profileError) { setError(profileError.message); setStatus("idle"); return; }

    const payload = {
      id: user.id,
      display_name: form.full_name.trim() || null,
      bio: form.bio.trim() || null,
      qualification: form.qualification.trim() || null,
      specialization: form.specialization.trim() || null,
      years_experience: Math.max(0, Number(form.years_experience) || 0),
      subjects: form.subjects.split(",").map(x => x.trim()).filter(Boolean),
      education_stages: form.education_stages.split(",").map(x => x.trim()).filter(Boolean),
      grades: form.grades.split(",").map(x => x.trim()).filter(Boolean),
      teaching_format: form.teaching_format.trim() || null,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      currency: form.currency,
    };

    const { error: teacherError } = await supabase.from("teacher_profiles").upsert(payload);
    if (teacherError) { setError(teacherError.message); setStatus("idle"); return; }

    setMessage("تم حفظ الملف بنجاح.");
    setStatus("idle");
  };

  const submit = async () => {
    setError(""); setStatus("submitting");
    const { error: e } = await supabase.from("teacher_profiles")
      .update({ verification_status:"pending", rejection_reason:null }).eq("id", user.id);
    if (e) setError(e.message);
    else setMessage("تم إرسال طلبك للمراجعة. سيظهر الملف للطلاب بعد اعتماد الإدارة.");
    setStatus("idle");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#182431] text-white"><GraduationCap className="h-5 w-5"/></span><b>مُعلّم</b></Link>
          <Link href="/portal" className="text-sm font-bold text-black/50">لوحة التحكم</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8 lg:py-12">
        <div className="rounded-[2rem] bg-[#182431] p-7 text-white lg:p-10">
          <ShieldCheck className="text-[#ffb36e]"/>
          <h1 className="mt-4 text-3xl font-extrabold">أنشئ ملفك كمعلم</h1>
          <p className="mt-3 text-sm leading-7 text-white/65">أكمل بياناتك ثم أرسل الطلب للمراجعة. لن يظهر ملفك للطلاب قبل الاعتماد.</p>
        </div>

        {message && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle2 className="ml-2 inline h-4 w-4"/>{message}</div>}
        {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        <form onSubmit={save} className="mt-6 rounded-[2rem] bg-white p-7 shadow-sm lg:p-10">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([key,label]) => (
              <label key={key} className="text-sm font-bold">
                {label}
                {key === "country" ? (
                  <select value={form.country} onChange={e => setForm(f => ({...f,country:e.target.value}))} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 font-normal outline-none focus:border-[#ff7a00]">
                    {countries.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                ) : key === "currency" ? (
                  <select value={form.currency} onChange={e => setForm(f => ({...f,currency:e.target.value}))} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 font-normal outline-none focus:border-[#ff7a00]">
                    {currencies.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                ) : (
                  <input
                    required={["full_name","qualification","subjects"].includes(key)}
                    type={key === "years_experience" || key === "hourly_rate" ? "number" : "text"}
                    min={key === "years_experience" || key === "hourly_rate" ? "0" : undefined}
                    value={form[key]}
                    onChange={e => setForm(f => ({...f,[key]:e.target.value}))}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 font-normal outline-none focus:border-[#ff7a00]"
                  />
                )}
              </label>
            ))}
          </div>

          <label className="mt-4 block text-sm font-bold">
            نبذة مهنية
            <textarea required value={form.bio} onChange={e => setForm(f => ({...f,bio:e.target.value}))} className="mt-2 min-h-32 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 font-normal outline-none focus:border-[#ff7a00]"/>
          </label>

          <button type="submit" disabled={status !== "idle"} className="mt-6 w-full rounded-full bg-[#182431] py-4 font-bold text-white disabled:opacity-50">
            {status === "saving" ? "جارٍ الحفظ..." : "حفظ الملف"}
          </button>
          <button type="button" onClick={submit} disabled={status !== "idle"} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a00] py-4 font-bold text-white disabled:opacity-50">
            <Send className="h-4 w-4"/>{status === "submitting" ? "جارٍ الإرسال..." : "إرسال للمراجعة"}
          </button>
        </form>
      </div>
    </main>
  );
}
